import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * useMining - Calculates live production and handles collection logic
 */
export function useMining(user, asset, onComplete) {
  const [liveEarned, setLiveEarned] = useState(0)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [isCollecting, setIsCollecting] = useState(false)

  // Calculate live production every second
  useEffect(() => {
    if (!asset || !asset.assets_config) return

    const config = asset.assets_config
    const lastCollect = new Date(asset.last_collected_at).getTime()
    
    // Rate: (Price * ROI%) / 30 days / 86400 seconds
    const roi = config.worker_gross_gen || config.monthly_roi || 6
    const ratePerSec = (config.price_coins * (roi / 100)) / 30 / 86400

    const interval = setInterval(() => {
      const now = Date.now()
      const totalElapsed = Math.max(0, (now - lastCollect) / 1000)
      
      // User only gets up to 24 hours (86400 seconds)
      const cappedElapsed = Math.min(totalElapsed, 86400)
      
      setElapsedSecs(totalElapsed)
      setLiveEarned(ratePerSec * cappedElapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [asset])

  const collect = useCallback(async () => {
    if (isCollecting || !asset) return
    setIsCollecting(true)

    try {
      // We call the server-side PL/pgSQL function 'collect_income'
      // This ensures 24h logic and server-time are used for security.
      const { data, error } = await supabase.rpc('collect_income', {
        p_user_asset_id: asset.id
      })

      if (error) throw error

      if (data?.success && onComplete) {
        onComplete(data)
      }
      return data
    } catch (err) {
      console.error('Collect error:', err)
      return { success: false, error: err.message }
    } finally {
      setIsCollecting(false)
    }
  }, [asset, isCollecting, onComplete])

  const progress = Math.min((elapsedSecs / 86400) * 100, 100)
  const isOverdue = elapsedSecs > 86400

  return {
    liveEarned,
    elapsedSecs,
    progress,
    isOverdue,
    isCollecting,
    collect
  }
}
