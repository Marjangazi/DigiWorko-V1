import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform, animate } from 'framer-motion'
import { Wallet, TrendingUp } from 'lucide-react'

export default function BalanceCard({ balance }) {
  const prevBalance = useRef(balance)
  const amountRef = useRef(null)

  useEffect(() => {
    if (balance !== prevBalance.current && amountRef.current) {
      amountRef.current.classList.remove('number-change')
      void amountRef.current.offsetWidth // reflow to restart animation
      amountRef.current.classList.add('number-change')
      prevBalance.current = balance
    }
  }, [balance])

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:border-accent-500/30 animate-glow"
    >
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl group-hover:bg-accent-500/20 transition-all duration-500" />

      <div className="relative z-10">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <Wallet size={16} className="text-accent-400" />
            </div>
            <span className="text-sm font-semibold text-dark-500 uppercase tracking-wider">
              Total Balance
            </span>
          </div>
          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
            <TrendingUp size={12} />
            DGC Token
          </span>
        </div>

        {/* Balance amount */}
        <div className="flex items-end gap-3" ref={amountRef}>
          <span className="text-5xl font-black text-gradient-gold leading-none">
            {(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </span>
          <span className="text-xl text-accent-600 font-bold mb-1">DGC</span>
        </div>

        {/* Subtext */}
        <p className="mt-3 text-dark-500 text-xs font-medium flex items-center gap-1.5"
        >
          <motion.span 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" 
          />
          DigiCoins earned from mining rewards
        </p>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
    </motion.div>
  )
}
