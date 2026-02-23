import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  ShoppingCart, 
  Wallet as WalletIcon, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Coins,
  Trophy
} from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const avatarUrl   = user?.user_metadata?.avatar_url
  const displayName = profile?.username || user?.email?.split('@')[0] || 'Miner'

  const navLinks = [
    { to: '/',          label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/shop',      label: 'Shop',      icon: <ShoppingCart size={18} /> },
    { to: '/wallet',    label: 'Wallet',    icon: <WalletIcon size={18} /> },
    { to: '/referral',  label: 'Referral',  icon: <Users size={18} /> },
    { to: '/tournaments', label: 'eSports', icon: <Trophy size={18} /> },
    ...(profile?.is_admin ? [{ to: '/admin', label: 'Admin', icon: <Settings size={18} /> }] : []),
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-primary-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group relative">
            <div className="absolute inset-0 bg-primary-500/20 blur-xl group-hover:bg-secondary-500/30 transition-all duration-500 rounded-full" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neon-glow group-hover:shadow-neon-pink transition-all duration-300 relative z-10 border border-white/20">
              <span className="text-dark-900 font-black text-lg">D</span>
            </div>
            <span className="font-black text-lg hidden sm:block">
              <span className="text-gradient">DiGital</span>
              <span className="text-white"> InvWOrker</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300
                  ${isActive(to)
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                    : 'text-dark-500 hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                  }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right: balance + user */}
          <div className="flex items-center gap-2">
            {/* Balance */}
            <div className="flex items-center gap-1.5 bg-accent-500/10 border border-accent-500/30 rounded-xl px-3 py-1.5">
              <span className="text-base">🪙</span>
              <span className="text-accent-400 font-bold text-sm">
                {Math.floor(profile?.balance ?? 0).toLocaleString()}
              </span>
            </div>

            {/* User avatar dropdown */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 transition-all"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full ring-2 ring-primary-500/50" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{displayName[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-white hidden sm:inline max-w-[80px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={14} className={`text-dark-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10" 
                      onClick={() => setDropOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 z-20 glass-card shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-dark-500">Signed in as</p>
                        <p className="text-sm text-white font-semibold truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          id="signout-btn"
                          onClick={() => { signOut(); setDropOpen(false) }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="text-lg">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-3 space-y-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive(to)
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span>{icon}</span>{label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
