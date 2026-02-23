import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'

export default function Wallet() {
  const { user, profile, refreshProfile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [depositForm, setDepositForm] = useState({ amount: '', trxId: '' })
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bkashType: 'personal', number: '' })
  const [statusMsg, setStatusMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('history')

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleDeposit = async (e) => {
    e.preventDefault()
    if (!depositForm.amount || !depositForm.trxId) return
    
    setStatusMsg({ type: 'info', text: 'Submitting deposit request...' })
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: parseFloat(depositForm.amount),
        trx_id: depositForm.trxId,
        type: 'deposit',
        status: 'pending',
        note: `Deposit request for ${depositForm.amount} DGC`
      })

    if (error) {
      setStatusMsg({ type: 'error', text: 'Failed to submit. Please try again.' })
    } else {
      setStatusMsg({ type: 'success', text: 'Deposit request submitted! Wait for admin approval.' })
      setDepositForm({ amount: '', trxId: '' })
      fetchTransactions()
    }
    setTimeout(() => setStatusMsg(null), 5000)
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    const amount = parseFloat(withdrawForm.amount)
    if (!amount || amount < 100) {
      setStatusMsg({ type: 'error', text: 'Minimum withdrawal is 100 DGC.' })
      return
    }
    if (amount > (profile?.balance || 0)) {
      setStatusMsg({ type: 'error', text: 'Insufficient balance.' })
      return
    }

    setStatusMsg({ type: 'info', text: 'Submitting withdrawal request...' })

    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_amount: amount,
      p_number: withdrawForm.number,
      p_type: withdrawForm.bkashType
    })

    if (error || !data?.success) {
      setStatusMsg({ type: 'error', text: data?.error || 'Failed to submit. Please try again.' })
    } else {
      await refreshProfile()
      setStatusMsg({ type: 'success', text: data?.message || 'Withdrawal request submitted! Processing takes 1-3 hours.' })
      setWithdrawForm({ amount: '', bkashType: 'personal', number: '' })
      fetchTransactions()
    }
    setTimeout(() => setStatusMsg(null), 5000)
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-white mb-6">
          <span className="text-gradient">Wallet</span> & Payments 💳
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 glass-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <p className="text-dark-500 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Available Balance</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-4xl font-black text-accent-400">{(profile?.balance || 0).toLocaleString()}</span>
              <span className="text-accent-600 font-bold">DGC</span>
            </div>
            <p className="text-dark-600 text-[10px] mt-2 relative z-10">1,000 DGC = 1 BDT (Internal Value)</p>
          </motion.div>

          {/* Info Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 glass-card-dark p-6 border-l-4 border-primary-500 relative overflow-hidden"
          >
            <h3 className="text-white font-bold mb-2">Payment Rules</h3>
            <ul className="text-dark-400 text-sm space-y-1">
              <li>• Deposits take 5-30 mins to approve.</li>
              <li>• Withdrawals are processed 10AM - 6PM daily.</li>
              <li>• Minimum withdrawal: 100 DGC.</li>
              <li>• Please ensure TrxID is correct for deposits.</li>
            </ul>
          </motion.div>
        </div>

        {statusMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold border animate-pulse ${
            statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
            statusMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
            'bg-primary-500/10 text-primary-400 border-primary-500/20'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-dark-800 p-1 rounded-xl w-fit">
          {['history', 'deposit', 'withdraw'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-dark-500 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/5 text-dark-500 uppercase text-[10px] tracking-widest">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-dark-500">Loading history...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-dark-500">No transactions found.</td></tr>
                  ) : (
                    transactions.map(trx => (
                      <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-dark-400">{new Date(trx.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`capitalize font-bold ${trx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          {trx.amount > 0 ? '+' : ''}{trx.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            trx.status === 'approved' || trx.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            trx.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {trx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'deposit' && (
          <motion.div 
            key="deposit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-8 max-w-lg border-primary-500/20 hover:shadow-[0_0_20px_rgba(0,243,255,0.1)] transition-all"
          >
            <div className="mb-6 p-4 bg-accent-500/5 border border-accent-500/20 rounded-xl">
              <p className="text-white font-bold mb-1">Step 1: Send Money to bKash Personal</p>
              <p className="text-accent-400 text-xl font-black mb-2">017XXXXXXXX</p>
              <p className="text-dark-500 text-xs">Rate: 1 BDT = 1,000 Coins (Adjusted for game value)</p>
            </div>
            
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-dark-500 text-xs font-bold mb-1 ml-1">Deposit Amount (Coins)</label>
                <input
                  type="number"
                  required
                  value={depositForm.amount}
                  onChange={e => setDepositForm({...depositForm, amount: e.target.value})}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label className="block text-dark-500 text-xs font-bold mb-1 ml-1">bKash TrxID</label>
                <input
                  type="text"
                  required
                  value={depositForm.trxId}
                  onChange={e => setDepositForm({...depositForm, trxId: e.target.value})}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
                  placeholder="e.g. AM93L2PK0"
                />
              </div>
              <button type="submit" className="w-full btn-primary py-4 hover:shadow-neon-glow">Submit Deposit Request</button>
            </form>
          </motion.div>
        )}

        {activeTab === 'withdraw' && (
          <motion.div 
            key="withdraw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-8 max-w-lg border-secondary-500/20 hover:shadow-[0_0_20px_rgba(255,0,255,0.1)] transition-all"
          >
             <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-dark-500 text-xs font-bold mb-1 ml-1">Withdraw Amount (Coins)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={withdrawForm.amount}
                  onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
                  placeholder="Minimum 100 DGC"
                />
              </div>
              <div>
                <label className="block text-dark-500 text-xs font-bold mb-1 ml-1">bKash Type</label>
                <select
                  value={withdrawForm.bkashType}
                  onChange={e => setWithdrawForm({...withdrawForm, bkashType: e.target.value})}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
                >
                  <option value="personal">Personal</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-dark-500 text-xs font-bold mb-1 ml-1">bKash Number</label>
                <input
                  type="text"
                  required
                  value={withdrawForm.number}
                  onChange={e => setWithdrawForm({...withdrawForm, number: e.target.value})}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-all"
                  placeholder="017XXXXXXXX"
                />
              </div>
              <button 
                type="submit" 
                disabled={parseFloat(withdrawForm.amount) > (profile?.balance || 0)}
                className="w-full btn-primary py-4 hover:shadow-neon-glow disabled:opacity-50 disabled:shadow-none"
              >
                {parseFloat(withdrawForm.amount) > (profile?.balance || 0) ? 'Insufficient Balance' : 'Request Withdrawal'}
              </button>
              <p className="text-center text-dark-600 text-[10px] mt-2 italic">Withdrawals are manually audited to ensure security.</p>
            </form>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  )
}
