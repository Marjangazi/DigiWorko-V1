/**
 * LiveIncomeCounter — shows real-time accumulating coins per second
 */
export default function LiveIncomeCounter({ totalLiveCoins, totalRatePerSec, assetCount }) {
  return (
    <div className="glass-card p-5 relative overflow-hidden border-green-500/20 hover:border-green-500/40 transition-all duration-300">
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span>⚡</span>
            </div>
            <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">Live Income</span>
          </div>
          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            {assetCount} Asset{assetCount !== 1 ? 's' : ''} Active
          </span>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-green-400 font-mono tabular-nums">
            +{totalLiveCoins.toFixed(4)}
          </span>
          <span className="text-sm text-dark-500 font-medium mb-1">DGC</span>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-xs text-dark-500">
            <span className="text-green-400">↑</span>
            <span>{totalRatePerSec.toFixed(6)} DGC/sec</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-500">
            <span className="text-yellow-400">☀️</span>
            <span>{(totalRatePerSec * 86400).toFixed(2)} DGC/day</span>
          </div>
        </div>

        {/* Animated bar */}
        <div className="mt-3 h-1 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
            style={{
              width: `${Math.min((totalLiveCoins % 100) * 1, 100)}%`,
              transition: 'width 1s linear',
            }}
          />
        </div>
      </div>
    </div>
  )
}
