import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAssets } from '../hooks/useAssets'
import { useFlashSale } from '../hooks/useFlashSale'
import Navbar from '../components/Navbar'
import BalanceCard from '../components/BalanceCard'
import LiveIncomeCounter from '../components/LiveIncomeCounter'
import MiningCard from '../components/MiningCard'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  Trophy, 
  CheckCircle,
  Truck,
  Map,
  Wallet,
  Coins,
  ArrowRight
} from 'lucide-react'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const {
    assets, loading, liveCoins, totalLiveCoins, totalRatePerSec,
    collecting, repairing, claimMsg, collectIncome, repairAsset
  } = useAssets(user, refreshProfile, profile)
  
  const { flashSale, timeLeft, isVaultActive } = useFlashSale()

  const [checkingIn, setCheckingIn] = useState(false)
  const [checkinMsg, setCheckinMsg] = useState(null)

  const [watchingAd, setWatchingAd] = useState(false)

  const handleDailyCheckin = async () => {
    setCheckingIn(true)
    const { data, error } = await supabase.rpc('daily_checkin')
    if (error) {
      setCheckinMsg({ type: 'error', text: 'Check-in failed.' })
    } else if (!data?.success) {
      setCheckinMsg({ type: 'error', text: data?.error || 'Already checked in' })
    } else {
      setCheckinMsg({ type: 'success', text: data?.message })
      await refreshProfile()
    }
    setCheckingIn(false)
    setTimeout(() => setCheckinMsg(null), 4000)
  }

  const handleWatchAd = async () => {
    setWatchingAd(true)
    // Simulate watching ad
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data, error } = await supabase.rpc('watch_ad')
    if (error) {
      setCheckinMsg({ type: 'error', text: 'Failed to apply boost.' })
    } else if (!data?.success) {
      setCheckinMsg({ type: 'error', text: data?.error || 'Boost already active' })
    } else {
      setCheckinMsg({ type: 'success', text: data?.message })
      await refreshProfile()
    }
    setWatchingAd(false)
    setTimeout(() => setCheckinMsg(null), 4000)
  }

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Miner'
  const adBoostActive = profile?.ad_boost_until && new Date(profile.ad_boost_until).getTime() > Date.now()

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Claim/Checkin success toast */}
          {(claimMsg || checkinMsg) && (
            <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 font-bold px-6 py-3 rounded-2xl shadow-xl animate-bounce-slow flex items-center gap-2 ${
              (checkinMsg?.type === 'error') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {claimMsg ? (
                <>⭐ +{claimMsg.coins?.toFixed(2)} DGC collected! {claimMsg.gap > 0 && <span className="text-green-200 font-normal">({claimMsg.gap?.toFixed(2)} missed)</span>}</>
              ) : (
                <>{checkinMsg?.type === 'error' ? '❌' : '⭐'} {checkinMsg.text}</>
              )}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-1">
              Welcome, <span className="text-gradient">{displayName}</span>! ⛏️
            </h1>
            <p className="text-dark-500">Your digital assets are earning coins right now.</p>
          </div>

          {/* Flash Sale Banner */}
          {isVaultActive && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="mb-8 p-6 bg-accent-500/10 border-2 border-accent-500/50 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.2)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent animate-pulse" />
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-accent-400 mb-2 flex items-center gap-2">
                    <span className="text-3xl animate-bounce">⚡</span> FLASH SALE IS LIVE!
                  </h2>
                  <p className="text-dark-400">
                    <span className="text-white font-bold">{flashSale.discount}% OFF</span> on all assets plus <span className="text-green-400 font-bold">+{flashSale.bonus}% Lifetime Bonus Income</span> setup in the Shop!
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center md:text-right">
                    <p className="text-[10px] text-dark-500 font-bold uppercase tracking-widest mb-1 shadow-neon-glow-red">Ends In</p>
                    <div className="text-2xl font-mono font-black text-white bg-dark-900 border border-accent-500/30 px-4 py-2 rounded-xl shadow-[inset_0_0_10px_rgba(250,204,21,0.1)]">
                      {timeLeft}
                    </div>
                  </div>
                  <Link to="/shop" className="btn-gold py-3 px-6 h-fit whitespace-nowrap hidden md:block">
                    Go to Shop 🛒
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Top stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
            <div className="sm:col-span-2 lg:col-span-2">
              <BalanceCard balance={profile?.balance ?? 0} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <LiveIncomeCounter
                totalLiveCoins={totalLiveCoins}
                totalRatePerSec={totalRatePerSec}
                assetCount={assets.length}
              />
            </div>
            {/* Daily Check-in Card (Takes remaining space) */}
            <div className="sm:col-span-2 lg:col-span-1 glass-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/30 transition-all duration-500" />
              <Calendar className="text-primary-400 mb-3" size={32} />
              <h3 className="text-white font-black text-lg mb-1">Daily Reward</h3>
              <p className="text-dark-400 text-xs mb-4">Get 2x your daily asset income every 24 hours!</p>
              
              <button
                onClick={handleDailyCheckin}
                disabled={checkingIn}
                className="w-full btn-gold py-2.5 text-sm"
              >
                {checkingIn ? 'Claiming...' : '🎁 Claim 2x Income'}
              </button>
            </div>

            {/* Watch Ad Card */}
            <div className="sm:col-span-2 lg:col-span-1 glass-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group border-pink-500/20">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl group-hover:bg-pink-500/30 transition-all duration-500" />
              <Zap className="text-pink-400 mb-3" size={32} />
              <h3 className="text-white font-black text-lg mb-1">Ad Reward</h3>
              <p className="text-dark-400 text-[10px] mb-4">Watch a quick ad to earn +10 DGC instantly.</p>
              
              <button
                onClick={handleWatchAd}
                disabled={watchingAd}
                className="w-full py-2.5 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30"
              >
                {watchingAd ? 'Watching...' : '📺 Watch Ad (+10)'}
              </button>
            </div>
          </div>

          {/* Assets section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🛺</span> My Assets
                <span className="text-sm text-dark-500 font-normal">({assets.length})</span>
              </h2>
              <Link to="/shop" className="btn-primary py-2 px-4 text-sm">
                + Buy More
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : assets.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4">🛺</div>
                <h3 className="text-lg font-bold text-white mb-2">No Assets Yet</h3>
                <p className="text-dark-500 text-sm mb-6">Buy your first Riksha and start earning coins every second!</p>
                <Link to="/shop" className="btn-gold inline-flex">🛒 Go to Shop</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.map(asset => (
                  <MiningCard
                    key={asset.id}
                    asset={asset}
                    liveCoins={liveCoins}
                    collecting={collecting}
                    onCollect={collectIncome}
                    repairing={repairing}
                    onRepair={repairAsset}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: '📈', label: 'DGC/Day', value: (totalRatePerSec * 86400).toFixed(2) },
              { icon: '📅', label: 'DGC/Month', value: (totalRatePerSec * 86400 * 30).toFixed(0) },
              { icon: '🏆', label: 'Assets', value: assets.length },
              { icon: '✅', label: 'Verified', value: profile?.is_verified ? 'Yes' : 'No' },
            ].map((s, i) => (
              <div key={i} className="glass-card p-4 text-center hover:border-white/20 transition-colors">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-xs text-dark-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">🗺️ How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              {[
                { n:'01', icon:'💳', t:'Deposit', d:'Top up your DGC balance via bKash.' },
                { n:'02', icon:'🛺', t:'Buy Asset', d:'Purchase a Digital Ricksha from the Shop.' },
                { n:'03', icon:'⚡', t:'Auto-Earn', d:'Earn coins every second, 24/7.' },
                { n:'04', icon:'⛏️', t:'Collect', d:'Collect within 24h — missing time goes to owner.' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 p-3 bg-dark-700/40 rounded-xl border border-white/5">
                  <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-lg">{s.icon}</div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs text-primary-500 font-black">{s.n}</span>
                      <span className="text-xs font-bold text-white">{s.t}</span>
                    </div>
                    <p className="text-xs text-dark-500 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
