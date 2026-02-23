import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ParticleBackground from '../components/ParticleBackground'
import { motion } from 'framer-motion'

const features = [
  { icon: '⛏️', title: 'Mine Every 24h', desc: 'Claim DigiCoins once every 24 hours automatically.' },
  { icon: '🔐', title: 'Google Login', desc: 'Secure, one-click login with your Google account.' },
  { icon: '🌐', title: 'Cloud Synced', desc: 'Your balance is stored in Supabase — accessible anywhere.' },
  { icon: '📱', title: 'Mobile Ready', desc: 'Works perfectly on all screen sizes.' },
]

export default function Login() {
  const { session, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Capture referral code from URL
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    const errorMsg = params.get('error_description') || params.get('error')

    if (ref) {
      localStorage.setItem('dg_referral_code', ref)
    }

    if (errorMsg) {
      console.error('Auth redirect error:', errorMsg)
      // You could set localized error state here
    }

    if (!loading && session) {
      navigate('/', { replace: true })
    }
  }, [session, loading, navigate])

  return (
    <div className="min-h-screen bg-dark-900 relative flex flex-col items-center justify-center px-4 py-12">
      {/* Animated particle background */}
      <ParticleBackground />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-primary-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Main content */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >

        {/* Logo / Hero */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Glow ring */}
            <div className="absolute w-28 h-28 rounded-full bg-primary-500/30 blur-xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-purple-700 flex items-center justify-center shadow-neon-glow animate-float border border-white/20">
              <span className="text-5xl">⛏️</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
            <span className="text-gradient">DiGital</span>
            <span className="text-white"> InvWOrker</span>
          </h1>
          <p className="text-dark-500 text-base font-medium mt-2">
            Mine DigiCoins every 24 hours. <span className="text-primary-400">7,200 Initial Bonus!</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 mb-6">
          <h2 className="text-xl font-bold text-white text-center mb-2">Start Mining Now</h2>
          <p className="text-dark-500 text-sm text-center mb-6">
            Login with Google to access your mining dashboard.
          </p>

          <button
            id="google-login-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
          >
            {/* Google Logo SVG */}
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-base">Continue with Google</span>
          </button>

          <p className="text-xs text-dark-600 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card-dark p-4 hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <span className="text-xl mb-2 block">{f.icon}</span>
              <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-dark-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-dark-600 text-xs mt-8">
          © 2026 DiGital InvWOrker · All rights reserved
        </p>
      </motion.div>
    </div>
  )
}
