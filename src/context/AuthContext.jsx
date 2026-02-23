import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // Safety timeout to prevent infinite loading if Supabase is unreachable
    const timeout = setTimeout(() => {
      if (loading) setLoading(false)
    }, 10000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) ensureProfile(session.user)
        else setLoading(false)
      })
      .catch(err => {
        console.error('getSession error:', err)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await ensureProfile(session.user)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function ensureProfile(user) {
    try {
      // Use maybeSingle to avoid 406/error if profile doesn't exist yet
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      // Robust check for Google provider
      const isGoogleUser = user.app_metadata?.provider === 'google' || 
                           user.app_metadata?.providers?.includes('google') ||
                           user.identities?.some(id => id.provider === 'google')

      if (!existing) {
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

        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
            balance: 7200,
            referral_code: referralCode,
            referred_by: referredBy,
            is_verified: isGoogleUser, // Auto verify via gmail
          })
          .select()
          .maybeSingle()
        
        if (newProfile) {
          setProfile(newProfile)
          localStorage.removeItem('dg_referral_code')
        }
      } else {
        // Auto-verify legacy unverified Google users
        if (isGoogleUser && !existing.is_verified) {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', user.id)
            .select()
            .maybeSingle()
          setProfile(updated || existing)
        } else {
          setProfile(existing)
        }
      }
    } catch (err) {
      console.error('ensureProfile:', err)
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
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin + '/login', // Ensure correct redirect path
        queryParams: { prompt: 'select_account' }
      },
    })
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
