import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (profile?.whatsapp) {
      navigate('/', { replace: true })
    }
  }, [profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 10) {
      setError('Please enter a valid WhatsApp number.')
      return
    }

    setLoading(true)
    setError(null)
    
    // We already have a profile created by AuthContext. Just update it.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        username: fullName.trim(),
        whatsapp: whatsapp.trim() 
      })
      .eq('id', profile.id)

    if (updateError) {
      setError('Failed to save profile. Please try again.')
    } else {
      await refreshProfile()
      navigate('/', { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md border-primary-500/30 shadow-neon-glow relative z-10"
      >
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">📱</span>
          <h2 className="text-2xl font-black text-white">Complete Profile</h2>
          <p className="text-dark-500 text-sm mt-2">Enter your WhatsApp number to verify your account and secure withdrawals.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-500 text-xs font-bold uppercase tracking-widest mb-1 ml-1">
              Email Address (Google)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-3 text-dark-500 cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label className="block text-dark-500 text-xs font-bold uppercase tracking-widest mb-1 ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahim Ahmed"
              className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-dark-500 text-xs font-bold uppercase tracking-widest mb-1 ml-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 017XXXXXXXX"
              className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 mt-2"
          >
            {loading ? 'Saving...' : 'Verify WhatsApp & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
