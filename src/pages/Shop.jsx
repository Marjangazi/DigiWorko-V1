import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAssets } from '../hooks/useAssets'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useFlashSale } from '../hooks/useFlashSale'

export default function Shop() {
  const { user, profile, refreshProfile } = useAuth()
  const { shopItems, buying, buyAsset, loading }   = useAssets(user, refreshProfile, profile)
  const { flashSale, timeLeft, isVaultActive } = useFlashSale()
  const [msg, setMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('assets') // 'assets' | 'external'
  const [buyingExternal, setBuyingExternal] = useState(null)
  const [selectedModes, setSelectedModes] = useState({}) // { [assetId]: 'worker' | 'investor' }

  const handleBuy = async (item) => {
    const mode = selectedModes[item.id] || 'worker'
    if ((profile?.balance ?? 0) < item.price_coins) {
      setMsg({ type: 'error', text: `❌ Insufficient balance. Need ${item.price_coins} DGC. Go to Wallet to deposit.` })
      setTimeout(() => setMsg(null), 4000)
      return
    }
    const result = await buyAsset(item.id, mode)
    if (result?.success) {
      setMsg({ type: 'success', text: `✅ ${item.name} purchased! Head to Dashboard to start collecting.` })
    } else {
      setMsg({ type: 'error', text: `❌ ${result?.error || 'Purchase failed'}` })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  const externalProducts = [
    { id: 'ext_1', name: 'Free Fire 100 Diamonds', desc: 'Direct top-up to your FF ID.', icon: '💎', price_coins: 1000 },
    { id: 'ext_2', name: 'Digital Marketing Course', desc: 'Full video course + certification.', icon: '🎓', price_coins: 5000 },
    { id: 'ext_3', name: 'Netflix Premium (1 Month)', desc: 'Shared profile access for 30 days.', icon: '🎬', price_coins: 3000 },
  ]

  const handleBuyExternal = async (item) => {
    if ((profile?.balance ?? 0) < item.price_coins) {
      setMsg({ type: 'error', text: `❌ Insufficient balance. Need ${item.price_coins} DGC.` })
      setTimeout(() => setMsg(null), 4000)
      return
    }
    
    // Check if user has whatsapp
    if (!profile?.whatsapp) {
      setMsg({ type: 'error', text: `❌ You must verify your WhatsApp first to receive external products.` })
      setTimeout(() => setMsg(null), 4000)
      return
    }

    setBuyingExternal(item.id)
    try {
      // Create a pending withdraw-like transaction for admin to fulfill
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -item.price_coins,
        type: 'purchase',
        status: 'pending',
        note: `External Delivery: ${item.name} | WhatsApp: ${profile.whatsapp}`
      })

      if (error) throw error

      setMsg({ type: 'success', text: `✅ Order placed for ${item.name}! Admin will contact you on WhatsApp.` })
      await refreshProfile()
    } catch (err) {
      setMsg({ type: 'error', text: `❌ Failed to place order. Try again.` })
    } finally {
      setBuyingExternal(null)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-black text-white mb-1">
          <span className="text-gradient">Asset</span> Shop 🛒
        </h1>
        <p className="text-dark-500 mb-6">Buy digital assets that earn coins automatically every second.</p>

        {isVaultActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-accent-500/10 border-2 border-accent-500/50 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.2)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent animate-pulse" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-500/20 rounded-full blur-3xl" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-accent-400 mb-1 flex items-center gap-2">
                  <span className="text-3xl animate-bounce">⚡</span> FLASH SALE ACTIVE
                </h2>
                <p className="text-dark-400">
                  <span className="text-white font-bold">{flashSale.discount}% OFF</span> on all assets + 
                  <span className="text-green-400 font-bold"> +{flashSale.bonus}% Extra Lifetime Profit</span>!
                </p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs text-dark-500 font-bold uppercase tracking-widest mb-1">Ends In</p>
                <div className="text-3xl font-mono font-black text-white bg-dark-900 border border-accent-500/30 px-4 py-2 rounded-xl shadow-[inset_0_0_10px_rgba(250,204,21,0.1)]">
                  {timeLeft}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {msg && (
          <div className={`mb-6 px-5 py-3 rounded-xl font-medium text-sm border ${
            msg.type === 'success'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {msg.text}
          </div>
        )}

        {/* Info banner */}
        <div className="glass-card-dark px-5 py-4 mb-6 flex items-start gap-3 border-l-4 border-accent-500">
          <span className="text-xl flex-shrink-0">💡</span>
          <div className="text-sm">
            <p className="text-white font-semibold mb-1">Micro-Economy Rules</p>
            <ul className="text-dark-400 space-y-0.5">
              <li>• 720 DGC = 1 BDT (Deposit via bKash in the wallet)</li>
              <li>• Assets earn coins every second based on monthly ROI</li>
              <li>• <strong className="text-accent-400">Collect within 24h</strong> — missed earnings go to the owner</li>
              <li>• Daily maintenance fee auto-deducted from your balance</li>
            </ul>
          </div>
        </div>

        {/* My balance */}
        <div className="flex items-center gap-2 mb-6 bg-accent-500/10 border border-accent-500/30 rounded-xl px-4 py-2.5 w-fit">
          <span className="text-base">🪙</span>
          <span className="text-accent-400 font-bold">Your Balance: {Math.floor(profile?.balance ?? 0).toLocaleString()} DGC</span>
        </div>

        {/* Shop items */}
        <div className="flex gap-2 mb-6 bg-dark-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'assets' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-dark-500 hover:text-white'
            }`}
          >
            Digital Assets
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'external' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-dark-500 hover:text-white'
            }`}
          >
            External Products
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'assets' ? (
          shopItems.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">🛺</div>
              <h3 className="text-lg font-bold text-white mb-2">Shop is Empty</h3>
              <p className="text-dark-500 text-sm">No digital assets are available for purchase right now. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shopItems.map(item => {
                const basePrice   = Number(item.price_coins || 0)
                const flashDiscount = Number(flashSale?.discount || 0)
                const flashBonus = Number(flashSale?.bonus || 0)
                
                const currentPrice = isVaultActive ? basePrice - (basePrice * (flashDiscount / 100)) : basePrice
                
                const isInvestor = selectedModes[item.id] === 'investor'
                const roiToUse = Number(isInvestor ? (item.investor_roi || 0) : (item.worker_gross_gen || item.monthly_roi || 0))
                
                const baseEarn    = (basePrice * (roiToUse / 100)) / 30
                const bonusEarn   = isVaultActive ? (basePrice * ((roiToUse + flashBonus) / 100)) / 30 - baseEarn : 0
                const dailyEarn   = baseEarn + bonusEarn
                
                const dailyMaint  = isInvestor ? 0 : (basePrice * (Number(item.maintenance_fee || 0) / 100)) / 30
                const netPerDay   = dailyEarn - dailyMaint
                const userBalance = Number(profile?.balance || 0)
                const canAfford   = userBalance >= currentPrice
                
                const isGold = isVaultActive

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className={`glass-card p-6 relative overflow-hidden flex flex-col transition-all duration-300
                    ${canAfford ? (selectedModes[item.id] === 'investor' ? 'border-accent-500/40 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'border-primary-500/30 hover:border-primary-400 hover:shadow-neon-glow') : 'border-white/10 opacity-80'}`}
                >
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${selectedModes[item.id] === 'investor' ? 'bg-accent-500/20' : 'bg-primary-500/20'}`} />

                  {/* Icon & name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br border flex items-center justify-center text-3xl
                      ${selectedModes[item.id] === 'investor' ? 'from-accent-500/20 to-orange-500/20 border-accent-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'from-primary-500/20 to-secondary-500/20 border-primary-500/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]'}
                    `}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-white">{item.name}</h3>
                      <p className="text-xs text-dark-500 uppercase font-bold tracking-tighter">Price: {currentPrice.toLocaleString()} DGC</p>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex bg-dark-800 p-1 rounded-xl mb-4 border border-white/5">
                    <button 
                      onClick={() => setSelectedModes({...selectedModes, [item.id]: 'worker'})}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${(!selectedModes[item.id] || selectedModes[item.id] === 'worker') ? 'bg-primary-600 text-white shadow-lg' : 'text-dark-500'}`}
                    >
                      Part B: Worker
                    </button>
                    <button 
                      onClick={() => setSelectedModes({...selectedModes, [item.id]: 'investor'})}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedModes[item.id] === 'investor' ? 'bg-accent-600 text-dark-900 shadow-lg' : 'text-dark-500'}`}
                    >
                      Part A: Investor
                    </button>
                  </div>

                  {/* Dynamic Stats based on mode */}
                  <div className="space-y-2 mb-5 flex-1 min-h-[120px]">
                    {(!selectedModes[item.id] || selectedModes[item.id] === 'worker') ? (
                      <>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-[10px] text-dark-500 uppercase font-bold">Gross Monthly ROI</span>
                          <span className="font-bold text-primary-400">{item.worker_gross_gen}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-[10px] text-dark-500 uppercase font-bold">Monthly Rent</span>
                          <span className="font-bold text-red-500">-{item.maintenance_fee}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-[10px] text-dark-500 uppercase font-bold">Daily Earnings</span>
                          <span className="font-bold text-green-400">+{((basePrice * (item.worker_gross_gen / 100)) / 30).toFixed(1)} DGC</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 pt-3">
                          <span className="text-xs text-white font-black uppercase">Net Profit / Month</span>
                          <span className="font-black text-primary-400">{(item.worker_gross_gen - item.maintenance_fee).toFixed(1)}%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-[10px] text-dark-500 uppercase font-bold">Total Return (30 Days)</span>
                          <span className="font-bold text-accent-400">{item.investor_roi}% Fixed</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-[10px] text-dark-500 uppercase font-bold">Capital Status</span>
                          <span className="font-bold text-white">Full Capital Returned</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-[10px] text-dark-500 uppercase font-bold">Total Release</span>
                          <span className="font-bold text-green-400">{(basePrice * (1 + (item.investor_roi / 100))).toLocaleString()} DGC</span>
                        </div>
                        <div className="mt-4 p-2 bg-accent-500/5 border border-accent-500/20 rounded-lg text-[9px] text-accent-400 leading-tight">
                          🔒 Note: Capital + Commission will be locked for 30 days and auto-released to your wallet.
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    id={`buy-btn-${item.id}`}
                    onClick={() => handleBuy(item)}
                    disabled={buying === item.id || !canAfford}
                    className={canAfford ? (selectedModes[item.id] === 'investor' ? 'bg-accent-600 hover:bg-accent-500 text-dark-900 w-full py-3 rounded-xl font-black shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all uppercase tracking-widest text-xs' : 'btn-primary w-full shadow-neon-glow uppercase tracking-widest text-xs py-3') : 'btn-secondary w-full opacity-60 uppercase tracking-widest text-xs py-3'}
                  >
                    {buying === item.id ? (
                      <><div className="w-4 h-4 border-2 border-dark-900/50 border-t-dark-900 rounded-full animate-spin inline-block mr-2" /> Processing...</>
                    ) : canAfford ? (
                      <>Buy {selectedModes[item.id] === 'investor' ? 'Investor' : 'Worker'} Mode</>
                    ) : (
                      <>Need {(currentPrice - Math.floor(profile?.balance ?? 0)).toLocaleString()} DGC</>
                    )}
                  </button>
                </motion.div>
              )
            })}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {externalProducts.map(item => {
              const canAfford = (profile?.balance ?? 0) >= item.price_coins

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className={`glass-card p-6 relative overflow-hidden flex flex-col transition-all duration-300
                    ${canAfford ? 'border-secondary-500/30 hover:border-secondary-400 hover:shadow-neon-pink' : 'border-white/10 opacity-80'}`}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl" />

                  {/* Icon & name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary-500/20 to-purple-500/20 border border-secondary-500/50 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(255,0,255,0.2)]">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-white">{item.name}</h3>
                      <p className="text-xs text-dark-500">{item.desc}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-4 mb-5 flex-1">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm text-dark-500">Price</span>
                      <span className="font-bold text-accent-400">{item.price_coins.toLocaleString()} DGC</span>
                    </div>
                    <p className="text-xs text-dark-400 leading-relaxed italic">
                      Admin will contact you via WhatsApp for delivery within 1-2 hours.
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuyExternal(item)}
                    disabled={buyingExternal === item.id || !canAfford}
                    className={canAfford ? 'w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-500 text-white hover:from-secondary-500 hover:to-secondary-400 transition-all duration-300 shadow-neon-pink hover:scale-[1.02] active:scale-95' : 'btn-secondary w-full opacity-60'}
                  >
                    {buyingExternal === item.id ? (
                      <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin inline-block mr-2" /> Placing...</>
                    ) : canAfford ? (
                      <>🛍️ Buy — {item.price_coins.toLocaleString()} DGC</>
                    ) : (
                      <>💳 Need {(item.price_coins - Math.floor(profile?.balance ?? 0)).toLocaleString()} more DGC</>
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
