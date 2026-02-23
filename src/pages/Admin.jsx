import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../hooks/useAdmin'
import Navbar from '../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'

export default function Admin() {
  const { user, profile } = useAuth()
  
  const isAdmin = profile?.is_admin || user?.email === 'mdmarzangazi@gmail.com';

  const { 
    allUsers, pendingTrx, vaultStats, allAssets, flashSaleSettings, economyStats, rentLogs, allTournaments, loading, actionMsg,
    toggleVerification, adjustBalance, adjustTKBalance, approveTrx, rejectTrx, updateAssetConfig, updateSystemSettings, addAsset,
    addTournament, deleteTournament
  } = useAdmin(isAdmin)

  const [adjustForm, setAdjustForm] = useState({ userId: '', amount: '', type: 'coin', note: '' })
  const [flashForm, setFlashForm] = useState({ discount: 10, bonus: 2, hours: 2, refBonus: 720 })
  const [newAsset, setNewAsset] = useState({ name: '', icon: '🌟', price_coins: '', investor_roi: 2, worker_gross_gen: 6, maintenance_fee: 1 })
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [activeView, setActiveView] = useState('economy') // economy, users, assets, transactions, vault, orders, tournaments
  const [tourForm, setTourForm] = useState({ title: '', game: 'Free Fire', entry_fee: 50, prize_pool: '', total_spots: 50, date_time: '', image_url: '' })
  const [showAddTour, setShowAddTour] = useState(false)

  if (!isAdmin) {
    console.log('Access Denied Check:', { 
      db_admin: profile?.is_admin, 
      email: user?.email, 
      target: 'mdmarzangazi@gmail.com' 
    });
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="glass-card p-12 text-center max-w-md">
          <span className="text-6xl mb-4 block">🚫</span>
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-dark-500">You do not have administrative privileges to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">
              <span className="text-gradient">God Mode</span> Panel ⚡
            </h1>
            <p className="text-dark-500 text-sm">Manage users, transactions, and economy parameters.</p>
          </div>
          
          <div className="flex bg-dark-800 p-1 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] flex-wrap">
             {['economy', 'users', 'assets', 'transactions', 'vault', 'orders', 'tournaments'].map(v => (
               <button
                 key={v}
                 onClick={() => setActiveView(v)}
                 className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                   activeView === v ? 'bg-gradient-to-r from-accent-600 to-accent-400 text-dark-900 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-dark-500 hover:text-white'
                 }`}
               >
                 {v}
               </button>
             ))}
          </div>
        </div>

        {actionMsg && (
          <div className="mb-6 p-4 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl font-bold animate-pulse text-center shadow-neon-glow">
            {actionMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
        {activeView === 'tournaments' && (
          <motion.div 
            key="tournaments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-bold text-xl">Active Arena Matches</h3>
              <button 
                onClick={() => setShowAddTour(!showAddTour)}
                className="btn-primary py-2 px-6"
              >
                {showAddTour ? 'Cancel' : '+ Create Tournament'}
              </button>
            </div>

            {showAddTour && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 border-primary-500/30">
                <form onSubmit={e => {
                  e.preventDefault()
                  addTournament(tourForm)
                  setShowAddTour(false)
                }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input required placeholder="Tournament Title" value={tourForm.title} onChange={e => setTourForm({...tourForm, title: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-4 py-2 text-white border outline-none" />
                  <input required placeholder="Prize Pool (e.g. 5,000 DGC)" value={tourForm.prize_pool} onChange={e => setTourForm({...tourForm, prize_pool: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-4 py-2 text-white border outline-none" />
                  <input required type="datetime-local" value={tourForm.date_time} onChange={e => setTourForm({...tourForm, date_time: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-4 py-2 text-white border outline-none" />
                  <input required type="number" placeholder="Entry Fee" value={tourForm.entry_fee} onChange={e => setTourForm({...tourForm, entry_fee: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-4 py-2 text-white border outline-none" />
                  <input required type="number" placeholder="Total Spots" value={tourForm.total_spots} onChange={e => setTourForm({...tourForm, total_spots: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-4 py-2 text-white border outline-none" />
                  <div className="flex gap-2">
                    <input placeholder="Image URL (Optional)" value={tourForm.image_url} onChange={e => setTourForm({...tourForm, image_url: e.target.value})} className="w-full bg-dark-800 border-white/10 rounded-lg px-4 py-2 text-white border outline-none" />
                    <button type="submit" className="bg-success-600 hover:bg-success-500 text-dark-900 px-6 rounded-lg font-black text-xs uppercase">Create</button>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {allTournaments.map(t => (
                <div key={t.id} className="glass-card overflow-hidden border-white/5 flex flex-col md:flex-row">
                  <div className="w-full md:w-48 bg-dark-800 p-6 flex flex-col items-center justify-center border-r border-white/5">
                    <span className="text-primary-500 text-[10px] font-black uppercase tracking-wider mb-1">{t.game}</span>
                    <h4 className="text-white font-black text-center">{t.title}</h4>
                    <button onClick={() => deleteTournament(t.id)} className="mt-4 text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest">Delete Match</button>
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-center mb-4">
                       <h5 className="text-[10px] text-dark-500 font-black uppercase tracking-widest">Participant Roster ({t.tournament_participants?.length || 0})</h5>
                       <span className="text-[11px] text-white font-mono">{new Date(t.date_time).toLocaleString()}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {t.tournament_participants?.map(p => (
                        <div key={p.user_id} className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col">
                          <span className="text-white text-xs font-bold truncate">{p.profiles?.username}</span>
                          <a 
                            href={`https://wa.me/${p.profiles?.whatsapp}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[9px] text-green-400 hover:text-green-300 font-bold mt-1"
                          >
                            💬 {p.profiles?.whatsapp}
                          </a>
                        </div>
                      ))}
                      {(!t.tournament_participants || t.tournament_participants.length === 0) && (
                        <div className="col-span-full py-4 text-center text-dark-600 text-xs italic">No participants yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {allTournaments.length === 0 && <div className="text-center py-12 text-dark-600">No tournaments scheduled.</div>}
            </div>
          </motion.div>
        )}

        {activeView === 'vault' && vaultStats && (
            <motion.div 
              key="vault"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="glass-card p-8 text-center border-accent-500/20">
                <p className="text-dark-500 text-xs font-black uppercase tracking-widest mb-1">Gap Income</p>
                <p className="text-accent-400 text-4xl font-black">{vaultStats.totalGap.toFixed(2)}</p>
                <p className="text-[10px] text-dark-600 mt-1">From users who missed 24h collection</p>
              </div>
              <div className="glass-card p-8 text-center border-primary-500/20">
                <p className="text-dark-500 text-xs font-black uppercase tracking-widest mb-1">Maintenance Fees</p>
                <p className="text-primary-400 text-4xl font-black">{vaultStats.totalMaint.toFixed(2)}</p>
                <p className="text-[10px] text-dark-600 mt-1">Automated daily asset charges</p>
              </div>
              <div className="glass-card p-8 text-center bg-gradient-to-br from-primary-600/10 to-pink-600/10">
                <p className="text-white text-xs font-black uppercase tracking-widest mb-1">Total Vault Value</p>
                <p className="text-white text-4xl font-black">{(vaultStats.total).toFixed(2)}</p>
                <p className="text-[10px] text-dark-400 mt-1">Net accumulated owner profit</p>
              </div>
            </motion.div>
        )}

        {activeView === 'transactions' && (
          <motion.div 
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card overflow-hidden border-primary-500/20"
          >
             <div className="p-6 border-b border-white/5">
                <h3 className="text-white font-bold">Pending Requests</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/5 text-dark-500 uppercase text-[10px] tracking-widest">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">TrxID / Info</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center">Loading transactions...</td></tr>
                  ) : pendingTrx.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-dark-600">No pending transactions. Clean state!</td></tr>
                  ) : (
                    pendingTrx.map(trx => (
                       <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white font-bold">{trx.profiles?.username || 'Unknown'}</p>
                            <p className="text-[10px] text-dark-600">{trx.profiles?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                               trx.type === 'deposit' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                               trx.type === 'purchase' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                               'bg-red-500/20 text-red-400 border-red-500/30'
                             }`}>
                               {trx.type}
                             </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-white">{trx.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <p className="text-accent-400 font-mono text-xs">{trx.trx_id || '-'}</p>
                            <p className="text-[10px] text-dark-500 truncate max-w-[150px]">{trx.note}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                               <button onClick={() => approveTrx(trx.id, trx.user_id, trx.amount, trx.type)} className="bg-success-600 hover:bg-success-500 text-dark-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(57,255,20,0.5)]">Approve</button>
                               <button onClick={() => rejectTrx(trx.id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)]">Reject</button>
                            </div>
                          </td>
                       </tr>
                    ))
                  )}
                </tbody>
               </table>
             </div>
          </motion.div>
        )}

        {activeView === 'users' && (
           <motion.div 
             key="users"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="grid grid-cols-1 lg:grid-cols-3 gap-8"
           >
              <div className="lg:col-span-2 glass-card overflow-hidden h-fit">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-white font-bold">User Database</h3>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest">{allUsers.length} total users</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white/5 text-dark-500 uppercase text-[10px] tracking-widest">
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Balance</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {allUsers.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-white font-bold">{u.username}</p>
                              <p className="text-[10px] text-dark-600">{u.email}</p>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-accent-400">{Math.floor(u.balance).toLocaleString()}</td>
                             <td className="px-6 py-4">
                                <button 
                                  onClick={() => toggleVerification(u.id, u.is_verified)} 
                                  className={`text-xs border px-3 py-1 rounded-lg transition-all font-bold ${
                                    u.is_verified 
                                      ? 'bg-success-500/10 text-success-500 border-success-500/30' 
                                      : 'bg-primary-500/10 text-primary-500 border-primary-500/30'
                                  }`}
                                >
                                  {u.is_verified ? 'Verified ✅' : 'Untrusted 🚫'}
                                </button>
                             </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                onClick={() => setAdjustForm({ userId: u.id, amount: '', note: '' })}
                                className="text-dark-400 hover:text-white text-xs"
                               >Manage</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>

              <div className="glass-card p-6 h-fit sticky top-24">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="text-accent-500">🛠️</span> Balance Control
                 </h3>
                 <form onSubmit={e => { 
                   e.preventDefault(); 
                   if (adjustForm.type === 'coin') adjustBalance(adjustForm.userId, parseFloat(adjustForm.amount), adjustForm.note)
                   else adjustTKBalance(adjustForm.userId, parseFloat(adjustForm.amount), adjustForm.note)
                 }} className="space-y-4">
                    <div>
                       <label className="text-[10px] text-dark-500 font-bold uppercase block mb-1">Target User ID</label>
                       <input readOnly value={adjustForm.userId} className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] font-mono outline-none" placeholder="Click 'Manage' on user" />
                    </div>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setAdjustForm({...adjustForm, type: 'coin'})} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${adjustForm.type === 'coin' ? 'bg-primary-600 border-primary-500 text-white' : 'border-white/10 text-dark-500'}`}>COIN (DGC)</button>
                       <button type="button" onClick={() => setAdjustForm({...adjustForm, type: 'tk'})} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${adjustForm.type === 'tk' ? 'bg-green-600 border-green-500 text-white' : 'border-white/10 text-dark-500'}`}>TAKA (BDT)</button>
                    </div>
                    <div>
                       <label className="text-[10px] text-dark-500 font-bold uppercase block mb-1">Amount</label>
                       <input type="number" required value={adjustForm.amount} onChange={e => setAdjustForm({...adjustForm, amount: e.target.value})} className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-accent-500 transition-all" placeholder="e.g. 1000" />
                    </div>
                    <button type="submit" disabled={!adjustForm.userId} className="w-full bg-accent-600 hover:bg-accent-500 text-dark-900 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 transition-all">Execute Adjustment</button>
                 </form>
              </div>
           </motion.div>
        )}

        {activeView === 'assets' && (
           <motion.div 
             key="assets"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
           >
              {/* Flash Sale Controller */}
              <div className="glass-card p-6 mb-8 border-accent-500/30 shadow-[0_0_20px_rgba(250,204,21,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-accent-500 text-2xl">⚡</span> Market Flash Sale
                </h3>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] text-dark-500 font-bold uppercase block mb-1">Discount (%)</label>
                        <input type="number" value={flashForm.discount} onChange={e => setFlashForm({...flashForm, discount: e.target.value})} className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-accent-500 transition-all font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 font-bold uppercase block mb-1">Bonus ROI (%)</label>
                        <input type="number" value={flashForm.bonus} onChange={e => setFlashForm({...flashForm, bonus: e.target.value})} className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-accent-500 transition-all font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 font-bold uppercase block mb-1">Duration (Hrs)</label>
                        <input type="number" value={flashForm.hours} onChange={e => setFlashForm({...flashForm, hours: e.target.value})} className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-accent-500 transition-all font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 font-bold uppercase block mb-1">Ref Bonus (DGC)</label>
                        <input type="number" value={flashForm.refBonus} onChange={e => setFlashForm({...flashForm, refBonus: e.target.value})} className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-accent-500 transition-all font-bold" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <button 
                      onClick={() => updateSystemSettings({ referral_bonus_value: parseFloat(flashForm.refBonus) })}
                      className="bg-dark-800 text-white border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-dark-700 transition-all"
                    >
                      Update Settings
                    </button>
                    {flashSaleSettings?.flash_sale_active ? (
                      <button 
                        onClick={() => updateSystemSettings({ flash_sale_active: false })}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all h-[42px] shadow-neon-glow"
                      >
                        Stop Sale
                      </button>
                    ) : (
                       <button 
                         onClick={() => updateSystemSettings({ 
                           flash_sale_active: true, 
                           flash_sale_discount: parseFloat(flashForm.discount),
                           flash_sale_bonus: parseFloat(flashForm.bonus),
                           flash_sale_ends_at: new Date(Date.now() + flashForm.hours * 3600000).toISOString(),
                           referral_bonus_value: parseFloat(flashForm.refBonus)
                         })}
                         className="bg-accent-600 hover:bg-accent-500 text-dark-900 px-6 py-2.5 rounded-xl font-bold transition-all h-[42px] shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                       >
                         Start Flash Sale!
                       </button>
                    )}
                  </div>
                </div>
                {flashSaleSettings?.flash_sale_active && (
                  <div className="mt-4 p-3 bg-accent-500/10 border border-accent-500/20 rounded-lg text-sm font-bold text-accent-400 animate-pulse">
                    🔥 Sale logic active ends at: {new Date(flashSaleSettings.flash_sale_ends_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">Dynamic Asset Manager</h3>
                <button 
                  onClick={() => setShowAddAsset(!showAddAsset)}
                  className="btn-primary py-1.5 px-4 text-xs"
                >
                  {showAddAsset ? 'Cancel' : '+ Add Asset'}
                </button>
              </div>
              
              <AnimatePresence>
                {showAddAsset && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div className="glass-card p-6 border-primary-500/30">
                      <h4 className="text-white font-bold mb-4">Create New Asset</h4>
                      <form onSubmit={e => {
                        e.preventDefault()
                        addAsset({
                          name: newAsset.name,
                          icon: newAsset.icon,
                          price_coins: parseInt(newAsset.price_coins),
                          investor_roi: parseFloat(newAsset.investor_roi),
                          worker_gross_gen: parseFloat(newAsset.worker_gross_gen),
                          maintenance_fee: parseFloat(newAsset.maintenance_fee)
                        })
                        setNewAsset({ name: '', icon: '🌟', price_coins: '', investor_roi: 2, worker_gross_gen: 6, maintenance_fee: 1 })
                        setShowAddAsset(false)
                      }} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <input required placeholder="Name" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        <input required placeholder="Icon" value={newAsset.icon} onChange={e => setNewAsset({...newAsset, icon: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-3 py-2 text-white text-sm w-16" />
                        <input required type="number" placeholder="Price" value={newAsset.price_coins} onChange={e => setNewAsset({...newAsset, price_coins: e.target.value})} className="bg-dark-800 border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        <input required type="number" placeholder="Inv ROI%" value={newAsset.investor_roi} onChange={e => setNewAsset({...newAsset, investor_roi: e.target.value})} className="bg-dark-800 border-accent-500/30 rounded-lg px-3 py-2 text-white text-sm" />
                        <input required type="number" placeholder="Work Gross%" value={newAsset.worker_gross_gen} onChange={e => setNewAsset({...newAsset, worker_gross_gen: e.target.value})} className="bg-dark-800 border-primary-500/30 rounded-lg px-3 py-2 text-white text-sm" />
                        <div className="flex gap-2">
                          <input required type="number" placeholder="Rent%" value={newAsset.maintenance_fee} onChange={e => setNewAsset({...newAsset, maintenance_fee: e.target.value})} className="w-full bg-dark-800 border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 rounded-lg font-bold">Add</button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allAssets.map(asset => (
                <div key={asset.id} className="glass-card p-6 border-accent-500/20 hover:border-accent-500/50 transition-all hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="text-4xl">{asset.icon}</div>
                      <div>
                         <h4 className="text-white font-bold">{asset.name}</h4>
                         <span className={asset.is_active ? "text-green-500 text-[10px]" : "text-red-500 text-[10px]"}>{asset.is_active ? "ACTIVE" : "INACTIVE"}</span>
                      </div>
                   </div>
                   
                    <div className="space-y-4">
                       {/* Part A: Investor Settings */}
                       <div className="p-3 bg-accent-500/5 border border-accent-500/20 rounded-xl space-y-2">
                          <label className="text-[9px] font-black text-accent-500 uppercase tracking-widest">Part A: Investor (30-day Lock)</label>
                          <div className="flex items-center justify-between text-xs">
                             <span className="text-dark-500">Fixed ROI %</span>
                             <input 
                                type="number" 
                                className="w-16 bg-dark-900 border border-accent-500/20 rounded text-center py-1 text-accent-400 font-bold" 
                                defaultValue={asset.investor_roi} 
                                onBlur={e => updateAssetConfig(asset.id, { investor_roi: parseFloat(e.target.value) })}
                             />
                          </div>
                       </div>

                       {/* Part B: Worker Settings */}
                       <div className="p-3 bg-primary-500/5 border border-primary-500/20 rounded-xl space-y-2">
                          <label className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Part B: Worker (Daily Cycle)</label>
                          <div className="flex items-center justify-between text-xs">
                             <span className="text-dark-500">Gross Gen %</span>
                             <input 
                                type="number" 
                                className="w-16 bg-dark-900 border border-primary-500/20 rounded text-center py-1 text-primary-400 font-bold" 
                                defaultValue={asset.worker_gross_gen} 
                                onBlur={e => updateAssetConfig(asset.id, { worker_gross_gen: parseFloat(e.target.value) })}
                             />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                             <span className="text-dark-500">Rent Cost %</span>
                             <input 
                                type="number" 
                                className="w-16 bg-dark-900 border border-primary-500/20 rounded text-center py-1 text-primary-400 font-bold" 
                                defaultValue={asset.maintenance_fee}
                                onBlur={e => updateAssetConfig(asset.id, { maintenance_fee: parseFloat(e.target.value) })}
                             />
                          </div>
                          <div className="pt-1 border-t border-primary-500/10 flex justify-between text-[10px] items-center">
                             <span className="text-dark-600 font-bold">NET PROFIT (Est.)</span>
                             <span className="text-success-500 font-black">{(asset.worker_gross_gen - asset.maintenance_fee).toFixed(1)}%</span>
                          </div>
                       </div>

                       <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-dark-500">Base Price</span>
                          <input 
                             type="number" 
                             className="w-24 bg-dark-700 border border-white/10 rounded text-center py-1 text-white font-mono" 
                             defaultValue={asset.price_coins}
                             onBlur={e => updateAssetConfig(asset.id, { price_coins: parseInt(e.target.value) })}
                          />
                       </div>
                       <button 
                         onClick={() => updateAssetConfig(asset.id, { is_active: !asset.is_active })}
                         className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${asset.is_active ? "bg-red-600/20 text-red-400 hover:bg-red-600/40" : "bg-green-600/20 text-green-400 hover:bg-green-600/40"}`}
                       >
                         {asset.is_active ? "Deactivate Asset" : "Activate Asset"}
                       </button>
                    </div>
                </div>
              ))}
              </div>
           </motion.div>
        )}

         {activeView === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-card overflow-hidden border-secondary-500/20 shadow-neon-pink/10"
            >
               <div className="p-6 border-b border-white/5 bg-secondary-500/5">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <span className="text-secondary-400 text-xl">🛍️</span> External Product Orders
                  </h3>
                  <p className="text-[10px] text-dark-500 uppercase font-bold mt-1 tracking-widest">Pending Deliveries Only</p>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-dark-500 uppercase text-[10px] tracking-widest">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingTrx.filter(t => t.type === 'purchase').length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-dark-600">No pending orders. Delivery queue is clear!</td></tr>
                    ) : (
                      pendingTrx.filter(t => t.type === 'purchase').map(trx => (
                         <tr key={trx.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-white font-bold">{trx.profiles?.username}</p>
                              <p className="text-[10px] text-dark-600 font-mono">{trx.profiles?.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-secondary-400 text-xs font-black uppercase mb-1">{trx.note.split('|')[0]}</p>
                              {trx.note.includes('WhatsApp:') && (
                                <a 
                                  href={`https://wa.me/${trx.note.split('WhatsApp:')[1].trim()}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform"
                                >
                                  💬 Chat & Deliver: {trx.note.split('WhatsApp:')[1]}
                                </a>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-white">
                              {Math.abs(trx.amount).toLocaleString()} <span className="text-[10px] opacity-40">DGC</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                 onClick={() => approveTrx(trx.id, trx.user_id, trx.amount, 'purchase')}
                                 className="bg-secondary-600 hover:bg-secondary-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-neon-pink"
                               >
                                 MARK DELIVERED
                               </button>
                            </td>
                         </tr>
                      ))
                    )}
                  </tbody>
                 </table>
               </div>
            </motion.div>
         )}

         {activeView === 'economy' && (
           <motion.div 
             key="economy"
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="space-y-8"
           >
              {/* ANALYTICS: Neon Cyan vs Neon Gold */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Part A: Investor Pool (Neon Gold) */}
                 <div className="glass-card p-8 border-accent-500 shadow-[0_0_30px_rgba(250,204,21,0.15)] relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl group-hover:bg-accent-500/20 transition-all duration-500" />
                    <h4 className="text-accent-500 font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                       <span className="w-2 h-2 bg-accent-500 rounded-full shadow-[0_0_10px_#facd15]" /> Part A: Investor Pool
                    </h4>
                    <div className="space-y-6">
                       <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-white">{Math.floor(economyStats.investorCapital / 1000)}k</span>
                          <span className="text-accent-500 text-xs font-bold uppercase tracking-widest">DGC Locked</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                          <div>
                            <p className="text-[10px] text-dark-500 font-bold uppercase mb-1">Active Investors</p>
                            <p className="text-xl font-black text-white">{economyStats.investorCount || 0}</p> 
                          </div>
                          <div>
                            <p className="text-[10px] text-dark-500 font-bold uppercase mb-1">Fixed ROI Liability</p>
                            <p className="text-xl font-black text-accent-400">{(economyStats.investorCapital * 0.02).toFixed(0)}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Part B: Worker Fleet (Neon Cyan) */}
                 <div className="glass-card p-8 border-primary-500 shadow-[0_0_30px_rgba(0,243,255,0.15)] relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-500" />
                    <h4 className="text-primary-500 font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                       <span className="w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_10px_#00f3ff]" /> Part B: Worker Fleet
                    </h4>
                    <div className="space-y-6">
                       <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-white">{economyStats.workerRate.toFixed(1)}</span>
                          <span className="text-primary-500 text-xs font-bold uppercase tracking-widest">Daily Generation</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                          <div>
                            <p className="text-[10px] text-dark-500 font-bold uppercase mb-1">Active Workers</p>
                            <p className="text-xl font-black text-white">{economyStats.workerCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-dark-500 font-bold uppercase mb-1">Est. Daily Rent</p>
                            <p className="text-xl font-black text-primary-400">{economyStats.totalDailyRent.toFixed(0)}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* ADMIN SELF-EDIT: Neon Gold */}
              <div className="glass-card p-8 border-accent-500 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white">God-Mode <span className="text-accent-400 italic">Self-Control</span></h3>
                       <div className="flex gap-6">
                          <div>
                             <p className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">Gold Balance</p>
                             <p className="text-2xl font-black text-accent-400">{Math.floor(profile.balance).toLocaleString()} <span className="text-xs opacity-50">DGC</span></p>
                          </div>
                          <div className="border-l border-white/10 pl-6">
                             <p className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">BDT Balance</p>
                             <p className="text-2xl font-black text-green-400">{Math.floor(profile.tk_balance || 0).toLocaleString()} <span className="text-xs opacity-50">TK</span></p>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                       <button onClick={() => adjustBalance(profile.id, 1000000, 'God injection')} className="bg-accent-600 hover:bg-accent-500 text-dark-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter shadow-lg hover:scale-105 transition-all">Inject 1M DGC</button>
                       <button onClick={() => adjustTKBalance(profile.id, 1000, 'God injection')} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter shadow-lg hover:scale-105 transition-all">Inject 1k TK</button>
                       <button onClick={() => { adjustBalance(profile.id, -profile.balance, 'God purge'); adjustTKBalance(profile.id, -(profile.tk_balance||0), 'God purge') }} className="bg-dark-800 text-red-500 border border-red-500/30 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-red-500/10 transition-all">Purge All</button>
                    </div>
                 </div>
              </div>

              {/* RENT LOGS: Neon Cyan */}
              <div className="glass-card overflow-hidden border-primary-500/30">
                 <div className="p-6 bg-primary-500/5 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                       <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse shadow-[0_0_10px_#00f3ff]" /> Rent Collection Timeline
                    </h3>
                    <span className="text-[10px] text-dark-500 font-bold uppercase">Latest 20 Logs</span>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead>
                          <tr className="bg-white/5 text-dark-500 uppercase text-[10px] tracking-widest">
                             <th className="px-6 py-4">Technician (User)</th>
                             <th className="px-6 py-4">Maintenance Fee</th>
                             <th className="px-6 py-4 text-right">Activity Sync</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {rentLogs.map(log => (
                             <tr key={log.id} className="hover:bg-primary-500/5 transition-colors">
                                <td className="px-6 py-4">
                                   <p className="text-white font-bold">{log.profiles?.username}</p>
                                   <p className="text-[10px] text-dark-600 font-mono italic">{log.user_id.slice(0, 8)}...</p>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <span className="font-mono text-red-400 font-black">-{Math.abs(log.amount).toFixed(2)}</span>
                                      <span className="text-[9px] text-dark-600 font-bold uppercase">DGC/Day</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-dark-500 text-right text-[11px] font-mono">{new Date(log.created_at).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  )
}
