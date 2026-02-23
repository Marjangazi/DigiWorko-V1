import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // Determine if we are likely in an OAuth flow
    const isReturningFromAuth = window.location.hash.includes('access_token=') || 
                               window.location.hash.includes('error=');

    console.log('Auth Init: Processing hash?', isReturningFromAuth);

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          console.log('Session found on init');
          setSession(initialSession);
          setUser(initialSession.user);
          await ensureProfile(initialSession.user);
        } else if (!isReturningFromAuth) {
          // If no session and not in OAuth flow, we are definitely done loading
          setLoading(false);
        }
      } catch (err) {
        console.error('Init Auth Error:', err);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth Event:', event);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await ensureProfile(currentSession.user);
        } else {
          setProfile(null);
          // Only stop loading if we aren't waiting for a redirect token
          if (!isReturningFromAuth || event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      }
    );

    // Fallback: If still loading after 5 seconds, force stop.
    // This prevents the "Black Screen of Death"
    const timer = setTimeout(() => {
      setLoading(curr => {
        if (curr) console.warn('Auth loading timed out - forcing start');
        return false;
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    }
  }, [])

  async function ensureProfile(user) {
    if (!user) {
      setLoading(false)
      return
    }
    
    console.log('Synchronizing profile for user:', user.id);
    
    try {
      // First attempt to get the profile
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }

      // Detection of Google source
      const isGoogleUser = 
        user.app_metadata?.provider === 'google' || 
        user.app_metadata?.providers?.includes('google') ||
        user.user_metadata?.email_verified === true ||
        user.identities?.some(id => id.provider === 'google');

      console.log('Is Google User:', isGoogleUser);

      if (!existing) {
        console.log('No profile found, creating new one...');
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        const refCode = localStorage.getItem('dg_referral_code')
        let referredBy = null

        if (refCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', refCode)
            .maybeSingle()
          if (referrer) referredBy = referrer.id
        }

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
            balance: 7200,
            referral_code: referralCode,
            referred_by: referredBy,
            is_verified: isGoogleUser, 
          })
          .select()
          .maybeSingle()
        
        if (insertError) {
          console.error('Insert profile error:', insertError);
          // If concurrent insert happened, refetch
          if (insertError.code === '23505') {
            const { data: refetched } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
            setProfile(refetched)
          }
        } else if (newProfile) {
          setProfile(newProfile)
          localStorage.removeItem('dg_referral_code')
        }
      } else {
        console.log('Profile exists, checking verification...');
        // Auto-verify if source is Google and profile isn't verified locally
        if (isGoogleUser && !existing.is_verified) {
          console.log('Google user found, auto-verifying...');
          const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', user.id)
            .select()
            .maybeSingle()
          
          if (updateError) console.error('Auto-verify update error:', updateError)
          setProfile(updated || existing)
        } else {
          setProfile(existing)
        }
      }
    } catch (err) {
      console.error('Profile synchronization failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
    return data
  }

  async function signInWithGoogle() {
    try {
      console.log('Initiating Google OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          }
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Full Auth Context Error:', err)
      alert('Google Login failed: ' + (err.message || 'Check your Supabase project configuration.'))
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      setProfile, signInWithGoogle, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
