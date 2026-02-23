import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

export default function Referral() {
  const { profile } = useAuth()
  const [levels, setLevels] = useState({ l1: [], l2: [], l3: [] })
  const [totalEarned, setTotalEarned] = useState(0)
  const [activeLevel, setActiveLevel] = useState('l1')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [refBonus, setRefBonus] = useState(720)

  useEffect(() => {
    async function fetchNetwork() {
      if (!profile?.id) return
      setLoading(true)
      try {
        // 1. Fetch Level 1
        const { data: l1 } = await supabase.from('profiles').select('id, username, created_at, is_verified').eq('referred_by', profile.id)
        
        // 2. Fetch Level 2
        let l2 = []
        if (l1?.length > 0) {
          const l1Ids = l1.map(u => u.id)
          const { data: resL2 } = await supabase.from('profiles').select('id, username, created_at, is_verified').in('referred_by', l1Ids)
          l2 = resL2 || []
        }

        // 3. Fetch Level 3
        let l3 = []
        if (l2?.length > 0) {
          const l2Ids = l2.map(u => u.id)
          const { data: resL3 } = await supabase.from('profiles').select('id, username, created_at, is_verified').in('referred_by', l2Ids)
          l3 = resL3 || []
        }

        setLevels({ l1: l1 || [], l2, l3 })

        // 4. Fetch total referral earnings from transactions
        const { data: trx } = await supabase.from('transactions').select('amount').eq('user_id', profile.id).eq('type', 'referral_bonus').eq('status', 'completed')
        const total = (trx || []).reduce((acc, t) => acc + (t.amount || 0), 0)
        setTotalEarned(total)

        // 5. Fetch system settings for referral bonus
        const { data: settings } = await supabase.from('system_settings').select('referral_bonus_value').eq('id', 1).single()
        if (settings) setRefBonus(settings.referral_bonus_value)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetwork()
  }, [profile])

  const referralLink = `${window.location.origin}/login?ref=${profile?.referral_code || ''}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-white mb-6">
          <span className="text-gradient">Referral</span> Program 🤝
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Referral Card */}
          <div className="glass-card p-8 flex flex-col justify-center border-primary-500/20">
            <h3 className="text-white font-black text-xl mb-2">Invite Friends, Earn Extra!</h3>
            <p className="text-dark-500 text-sm mb-6">For every friend who joins and verifies their account, you get <span className="text-accent-400 font-bold">{refBonus} DGC</span> instantly.</p>
            
            <label className="block text-dark-500 text-[10px] font-black uppercase tracking-widest mb-1 ml-1">Your Referral Link</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none"
              />
              <button
                onClick={copyToClipboard}
                className={`px-6 rounded-xl font-bold text-sm transition-all ${
                  copied ? 'bg-green-600 text-white' : 'btn-primary'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="mt-4 text-dark-600 text-[10px]">Your Code: <span className="text-primary-500 font-black tracking-widest">{profile?.referral_code}</span></p>
          </div>

          {/* Stats Card */}
          <div className="glass-card-dark p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl" />
             <div className="grid grid-cols-2 gap-8 w-full relative z-10">
                <div>
                  <p className="text-white text-4xl font-black">{levels.l1.length + levels.l2.length + levels.l3.length}</p>
                  <p className="text-dark-500 text-[10px] font-bold uppercase tracking-widest mt-1">Total Network</p>
                </div>
                <div>
                  <p className="text-accent-400 text-4xl font-black">{Math.floor(totalEarned).toLocaleString()}</p>
                  <p className="text-dark-500 text-[10px] font-bold uppercase tracking-widest mt-1">DGC Earned</p>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-white/5 w-full grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-white font-bold">{levels.l1.length}</p>
                  <p className="text-dark-600 text-[8px] uppercase">L1 (10%)</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{levels.l2.length}</p>
                  <p className="text-dark-600 text-[8px] uppercase">L2 (5%)</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{levels.l3.length}</p>
                  <p className="text-dark-600 text-[8px] uppercase">L3 (2%)</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-white font-black text-xl">My Network Tree</h2>
          <div className="flex bg-dark-800 p-1 rounded-xl">
            {['l1', 'l2', 'l3'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  activeLevel === lvl ? 'bg-primary-600 text-white shadow-lg' : 'text-dark-500 hover:text-white'
                }`}
              >
                Level {lvl.replace('l', '')}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-dark-500 uppercase text-[10px] tracking-widest">
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Joined At</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-dark-500">Loading your network...</td></tr>
                ) : levels[activeLevel].length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-dark-500">No users in Level {activeLevel.replace('l', '')} yet.</td></tr>
                ) : (
                  levels[activeLevel].map((ref, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-bold">{ref.username}</td>
                      <td className="px-6 py-4 text-dark-400">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          ref.is_verified ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-dark-700 text-dark-500 border-white/5'
                        }`}>
                          {ref.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
