import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) ensureProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await ensureProfile(session.user)
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function ensureProfile(user) {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const isGoogleUser = user.app_metadata?.provider === 'google' || user.app_metadata?.providers?.includes('google')

      if (!existing) {
        // Generate random unique referral code
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        
        // Check for stored referrer code
        const refCode = localStorage.getItem('dg_referral_code')
        let referredBy = null

        if (refCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', refCode)
            .single()
          
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
          .single()
        
        if (newProfile) {
          setProfile(newProfile)
          // Clear referral code after use
          localStorage.removeItem('dg_referral_code')
        }
      } else {
        // If user exists but is not verified, and they just logged in with Google, verify them
        if (isGoogleUser && !existing.is_verified) {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', user.id)
            .select()
            .single()
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
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
    return data
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin,
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
