import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * useAssets — loads user's owned assets with per-second income calculation,
 * real-time live counter, and collect function.
 */
export function useAssets(user, refreshProfile, profile) {
  const [assets, setAssets]           = useState([])
  const [shopItems, setShopItems]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [collecting, setCollecting]   = useState(null)  // asset id being collected
  const [buying, setBuying]           = useState(null)  // asset id being bought
  const [repairing, setRepairing]     = useState(null)
  const [liveCoins, setLiveCoins]     = useState({})    // { [user_asset_id]: number }
  const [claimMsg, setClaimMsg]       = useState(null)

  // Load shop items (assets_config)
  const loadShop = useCallback(async () => {
    const { data, error } = await supabase
      .from('assets_config')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (error) console.error('loadShop error:', error)
    if (data) setShopItems(data)
  }, [])

  // Load user's assets with config joined
  const loadAssets = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('user_assets')
      .select(`
        *,
        assets_config (
          id, name, description, icon,
          price_coins, monthly_roi, maintenance_fee, investor_roi, worker_gross_gen
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .order('purchased_at')
    if (error) console.error('loadAssets error:', error)
    if (data) setAssets(data)
  }, [user])

  useEffect(() => {
    Promise.all([loadShop(), loadAssets()]).finally(() => setLoading(false))
  }, [loadShop, loadAssets])

  // Live per-second coin accumulation counter
  useEffect(() => {
    if (!assets.length) return

    const interval = setInterval(() => {
      const now = Date.now()
      const updated = {}
      assets.forEach(a => {
        if (a.status !== 'active') return
        const config      = a.assets_config
        if (!config) return

        // Differentiate logic based on type
        const baseROI = a.type === 'investor' ? config.investor_roi : (config.worker_gross_gen || config.monthly_roi || 6)
        let ratePerSec = (config.price_coins * (baseROI / 100)) / 30 / 86400
        
        // Investor assets release after 30 days, so we don't show a 'live' counter for them in same way
        if (a.type === 'investor') {
          updated[a.id] = 0 // Investor assets accumulate in release_date, not active vault
          return
        }
        
        // Apply Flash Sale Bonus from DB
        if (a.bonus_income_percent && a.bonus_income_percent > 0) {
          ratePerSec = ratePerSec * (1 + (a.bonus_income_percent / 100))
        }

        const lastCollect = new Date(a.last_collected_at).getTime()
        const elapsed     = Math.max(0, (now - lastCollect) / 1000)
        const cappedSecs  = Math.min(elapsed, 86400)
        updated[a.id]     = Number((ratePerSec * cappedSecs).toFixed(4))
      })
      setLiveCoins(updated)
    }, 1000)

    return () => clearInterval(interval)
  }, [assets])

  // Collect income (calls server-side function)
  const collectIncome = useCallback(async (userAssetId) => {
    if (collecting) return
    setCollecting(userAssetId)
    try {
      const { data, error } = await supabase.rpc('collect_income', {
        p_user_asset_id: userAssetId,
      })
      if (error) { console.error(error); return }
      if (data?.success) {
        setClaimMsg({
          coins: data.user_coins,
          gap: data.gap_coins,
          balance: data.new_balance,
        })
        setTimeout(() => setClaimMsg(null), 4000)
        await loadAssets()
        await refreshProfile()
      }
    } finally {
      setCollecting(null)
    }
  }, [collecting, loadAssets, refreshProfile])

  // Buy an asset
  const buyAsset = useCallback(async (assetId, type = 'worker') => {
    if (buying) return false
    setBuying(assetId)
    try {
      const { data, error } = await supabase.rpc('buy_asset', { p_asset_id: assetId, p_type: type })
      if (error || !data?.success) {
        return { success: false, error: data?.error || 'Purchase failed' }
      }
      await loadAssets()
      await refreshProfile()
      return { success: true }
    } finally {
      setBuying(null)
    }
  }, [buying, loadAssets, refreshProfile])

  // Repair an asset
  const repairAsset = useCallback(async (userAssetId) => {
    if (repairing) return false
    setRepairing(userAssetId)
    try {
      const { data, error } = await supabase.rpc('repair_asset', { p_user_asset_id: userAssetId })
      if (error || !data?.success) {
        return { success: false, error: data?.error || 'Repair failed' }
      }
      await loadAssets()
      await refreshProfile()
      return { success: true }
    } finally {
      setRepairing(null)
    }
  }, [repairing, loadAssets, refreshProfile])

  // Compute totals
  const totalLiveCoins = Object.values(liveCoins).reduce((s, v) => s + v, 0)
  const totalRatePerSec = assets.reduce((sum, a) => {
    if (a.type === 'investor' || !a.assets_config || a.status !== 'active') return sum
    
    const config = a.assets_config
    const baseROI = config.worker_gross_gen || config.monthly_roi
    let rate = (config.price_coins * (baseROI / 100)) / 30 / 86400
    
    if (a.bonus_income_percent && a.bonus_income_percent > 0) {
      rate = rate * (1 + (a.bonus_income_percent / 100))
    }
    
    return sum + rate
  }, 0)

  return {
    assets, shopItems, loading,
    liveCoins, totalLiveCoins, totalRatePerSec,
    collecting, buying, repairing, claimMsg,
    collectIncome, buyAsset, repairAsset, loadAssets, loadShop,
  }
}
