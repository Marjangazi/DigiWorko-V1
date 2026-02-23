import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, Clock, Sword } from 'lucide-react'

export default function Tournaments() {
  const { user, profile, refreshProfile } = useAuth()
  const [tournaments, setTournaments]     = useState([])
  const [loading, setLoading]             = useState(true)
  const [joining, setJoining]             = useState(null)
  const [msg, setMsg]                     = useState(null)

  useEffect(() => {
    fetchTournaments()
  }, [])

  async function fetchTournaments() {
    setLoading(true)
    try {
      // Fetch tournaments and count participants
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, tournament_participants(count)')
        .eq('is_active', true)
        .order('date_time', { ascending: true })

      if (error) throw error
      
      const formatted = data.map(t => ({
        ...t,
        spots_taken: t.tournament_participants[0]?.count || 0
      }))
      setTournaments(formatted)
    } catch (err) {
      console.error('fetchTournaments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (t) => {
    if (!profile?.is_verified) {
      setMsg({ type: 'error', text: '❌ Please wait for admin to verify your account first.' })
      setTimeout(() => setMsg(null), 4000)
      return
    }

    if (!profile?.whatsapp) {
      setMsg({ type: 'error', text: '❌ Verify WhatsApp in Profile to receive room credentials.' })
      setTimeout(() => setMsg(null), 4000)
      return
    }

    setJoining(t.id)
    try {
      const { data, error } = await supabase.rpc('join_tournament', { p_tournament_id: t.id })
      
      if (error) throw error

      if (data.success) {
        setMsg({ type: 'success', text: `✅ ${data.message} Get ready!` })
        await refreshProfile()
        await fetchTournaments()
      } else {
        setMsg({ type: 'error', text: `❌ ${data.error}` })
      }
    } catch (error) {
      setMsg({ type: 'error', text: 'Failed to join tournament.' })
    } finally {
      setJoining(null)
      setTimeout(() => setMsg(null), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            eSports <span className="text-primary-500">Arena</span> <span className="animate-pulse">🎮</span>
          </h1>
          <p className="text-dark-500">Compete in professional matches and win massive DGC rewards.</p>
        </div>

        {msg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 px-6 py-4 rounded-2xl font-bold text-sm border shadow-xl flex items-center gap-3 ${
              msg.type === 'success'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            {msg.type === 'success' ? '🏆' : '⚠️'} {msg.text}
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-dark-500 font-bold uppercase tracking-widest text-xs">Loading Arena...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="glass-card p-12 text-center border-white/5">
            <Trophy className="mx-auto text-dark-700 mb-4" size={64} />
            <h3 className="text-xl font-bold text-white mb-2">No Active Tournaments</h3>
            <p className="text-dark-500">Check back later for new matches and seasons!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((t) => {
              const spotsLeft = t.total_spots - (t.spots_taken || 0)
              const isFull = spotsLeft <= 0
              
              return (
                <motion.div 
                  key={t.id}
                  whileHover={{ y: -5 }}
                  className="glass-card overflow-hidden group border-white/5 hover:border-primary-500/30 transition-all duration-300 shadow-xl"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={t.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" 
                      alt={t.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                       <span className="bg-primary-600 text-white text-[10px] font-black px-2 py-1 rounded border border-primary-400/50 uppercase tracking-widest shadow-lg">
                         {t.game}
                       </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">{t.title}</h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                      <div className="text-center">
                        <p className="text-[10px] text-dark-500 font-black uppercase mb-1">Entry</p>
                        <p className="text-white font-bold">{t.entry_fee} <span className="text-[10px] opacity-50">DGC</span></p>
                      </div>
                      <div className="text-center border-x border-white/10">
                        <p className="text-[10px] text-dark-500 font-black uppercase mb-1">Pool</p>
                        <div className="flex items-center justify-center gap-1">
                          <Trophy size={12} className="text-accent-400" />
                          <p className="text-accent-400 font-black">{t.prize_pool}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-dark-500 font-black uppercase mb-1">Spots</p>
                        <p className={`font-bold ${isFull ? 'text-red-500' : 'text-green-400'}`}>
                          {t.spots_taken} / {t.total_spots}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center gap-3 text-dark-400 text-sm">
                          <Calendar size={16} className="text-primary-500" />
                          <span>{new Date(t.date_time).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                       </div>
                       <div className="flex items-center gap-3 text-dark-400 text-sm">
                          <Clock size={16} className="text-primary-500" />
                          <span>{new Date(t.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>

                    <button
                      onClick={() => handleJoin(t)}
                      disabled={joining === t.id || isFull}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg
                        ${isFull 
                          ? 'bg-dark-800 text-dark-500 border border-white/5 cursor-not-allowed' 
                          : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20 hover:scale-[1.02]'
                        }`}
                    >
                      {joining === t.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isFull ? (
                        'Arena Full'
                      ) : (
                        <><Sword size={16} /> Enter Match</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
