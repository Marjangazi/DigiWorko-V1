import { motion } from 'framer-motion'
import { Truck } from 'lucide-react'

export default function MiningCard({ asset, liveCoins, collecting, onCollect, repairing, onRepair }) {
  const config = asset.assets_config
  if (!config) return null

  const earned    = liveCoins[asset.id] || 0
  const lastAt    = new Date(asset.last_collected_at)
  const now       = Date.now()
  const elapsedHrs = (now - lastAt.getTime()) / 3600000
  const canCollect = elapsedHrs >= 0.01 // allow collect after ~36 seconds for demo
  const progress   = Math.min((elapsedHrs / 24) * 100, 100)

  // Neon conditional styles based on status
  const isDamaged = asset.health < 100
  const isPaused = asset.status === 'paused'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className={`glass-card p-5 relative overflow-hidden transition-all duration-300 border ${
        isPaused ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-900/10' : 
        asset.type === 'investor' ? 'border-accent-500/30 shadow-[0_0_15px_rgba(250,204,21,0.1)] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]' :
        'border-primary-500/30 shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-neon-glow'
      }`}
    >
      {/* Background glow orb */}
      {!isPaused && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl ${asset.type === 'investor' ? 'bg-accent-500/20' : 'bg-primary-500/20'}`} />
      )}

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/50 flex items-center justify-center text-2xl flex-shrink-0 shadow-neon-glow">
            {config.icon ? (
               <span>{config.icon}</span>
            ) : (
               <Truck className="text-primary-400" size={24} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">
              {config.name} {isPaused && <span className="text-red-400 ml-1 animate-pulse">(BROKEN)</span>}
              <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded border ${asset.type === 'investor' ? 'text-accent-400 border-accent-500/30 bg-accent-500/10' : 'text-primary-400 border-primary-500/30 bg-primary-500/10'}`}>
                {asset.type === 'investor' ? 'PART A' : 'PART B'}
              </span>
            </h3>
            <p className="text-xs text-secondary-400 font-medium">
              {asset.type === 'investor' ? `ROI ${config.investor_roi}% Fixed` : `ROI ${config.monthly_roi}%/month · ${asset.health}% Health`}
            </p>
          </div>
        </div>
        <div className="text-right">
          {asset.type === 'investor' ? (
             <p className="text-xs font-black text-accent-400 font-mono tracking-tighter">
               LOCK-UP
             </p>
          ) : (
            <p className="text-lg font-black text-success-500 font-mono drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
              +{earned.toFixed(4)}
            </p>
          )}
          <p className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">
            {asset.type === 'investor' ? 'PART A' : 'Vault'}
          </p>
        </div>
      </div>

      {/* Progress or Release Info */}
      <div className="relative z-10 mt-5">
        {asset.type === 'investor' ? (
          <div className="bg-accent-500/5 border border-accent-500/20 rounded-xl p-3">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-dark-500 font-bold uppercase">Estimated Release</span>
                <span className="text-[10px] text-accent-400 font-black">{new Date(asset.release_date).toLocaleDateString()}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] text-dark-500 font-bold uppercase">Total Payout</span>
                <span className="text-xs text-white font-black">{(config.price_coins * (1 + (config.investor_roi / 100))).toLocaleString()} DGC</span>
             </div>
             <div className="mt-2 h-1 bg-dark-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-500 animate-pulse" 
                  style={{ width: `${Math.min(((30 - (new Date(asset.release_date) - now)/86400000)/30)*100, 100)}%` }}
                />
             </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-[10px] text-primary-400 uppercase tracking-wide font-bold mb-1.5">
              <span>⏱ {elapsedHrs.toFixed(1)}h elapsed</span>
              <span>{Math.round(progress)}% of 24h</span>
            </div>
            <div className="h-2.5 bg-dark-800 rounded-full overflow-hidden border border-white/5 relative">
              <div
                className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${
                  progress >= 100 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-primary-600 to-secondary-500'
                }`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
            {progress >= 100 && (
              <p className="text-red-400 text-[10px] mt-1 font-bold animate-pulse text-right">⚠️ Vault Full! Collect now.</p>
            )}
          </>
        )}
      </div>

      {/* Repair Section (Worker Only) */}
      {asset.type === 'worker' && isDamaged && (
        <div className="relative z-10 mt-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <div>
            <p className="text-red-400 text-xs font-bold uppercase tracking-wide">⚠️ Damaged</p>
            <p className="text-dark-400 text-[10px]">Fix for {config.price_coins * 0.1} DGC</p>
          </div>
          <button
            onClick={() => onRepair(asset.id)}
            disabled={repairing === asset.id}
            className="bg-red-500 text-white hover:bg-red-400 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)] disabled:opacity-50"
          >
            {repairing === asset.id ? 'Fixing...' : 'Repair'}
          </button>
        </div>
      )}

      {/* Collect Button (Worker Only) */}
      <div className="relative z-10 mt-4">
        {asset.type === 'investor' ? (
          <div className="w-full bg-accent-500/10 border border-accent-500/30 py-2.5 text-[10px] font-black uppercase tracking-widest text-accent-500 rounded-xl text-center">
            🔒 Locked Asset
          </div>
        ) : asset.status === 'active' ? (
          <button
            id={`collect-btn-${asset.id}`}
            onClick={() => onCollect(asset.id)}
            disabled={!canCollect || collecting === asset.id}
            className="w-full relative group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-primary-500/30 blur-md rounded-xl group-hover:bg-primary-400/50 transition-all duration-300" />
            <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 border border-primary-400/50 text-dark-900 font-bold py-2.5 rounded-xl transition-all duration-300 group-hover:scale-[1.02]">
              {collecting === asset.id ? (
                <><span className="w-4 h-4 border-2 border-dark-900/50 border-t-dark-900 rounded-full animate-spin" /> Mining...</>
              ) : canCollect ? (
                <>⛏️ Collect {earned.toFixed(2)} DGC</>
              ) : (
                <>⏳ Accumulating Base...</>
              )}
            </div>
          </button>
        ) : (
          <button className="w-full bg-dark-800 text-dark-500 border border-red-500/20 py-2.5 text-sm font-bold uppercase tracking-widest rounded-xl cursor-not-allowed shadow-[0_0_10px_rgba(239,68,68,0.1)]">
            ❌ Asset Offline
          </button>
        )}
      </div>
    </motion.div>
  )
}
