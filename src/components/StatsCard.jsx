export default function StatsCard({ profile, user }) {
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  const lastMined = profile?.last_mined
    ? new Date(profile.last_mined).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never'

  const stats = [
    {
      icon: '📅',
      label: 'Member Since',
      value: joinDate,
    },
    {
      icon: '⛏️',
      label: 'Last Mined',
      value: lastMined,
    },
    {
      icon: '🏆',
      label: 'Total Earnings',
      value: `${(profile?.balance ?? 0).toLocaleString()} DGC`,
    },
    {
      icon: '🌐',
      label: 'Network',
      value: 'DiGi Mainnet',
    },
  ]

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <span className="text-base">📊</span>
        </div>
        <span className="text-sm font-semibold text-dark-500 uppercase tracking-wider">
          Miner Stats
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-dark-700/50 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors duration-200"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-dark-500 font-medium truncate">{stat.label}</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* User email */}
      <div className="mt-4 flex items-center gap-2 bg-dark-700/30 rounded-xl px-3 py-2 border border-white/5">
        <span className="text-sm">📧</span>
        <span className="text-xs text-dark-500 font-medium truncate">{user?.email}</span>
        <span className="ml-auto text-xs bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">
          Verified
        </span>
      </div>
    </div>
  )
}
