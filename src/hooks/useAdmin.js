import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAdmin(isAdmin) {
  const [allUsers, setAllUsers]           = useState([])
  const [pendingTrx, setPendingTrx]       = useState([])
  const [vaultStats, setVaultStats]       = useState(null)
  const [allAssets, setAllAssets]         = useState([])
  const [flashSaleSettings, setFlashSaleSettings] = useState(null)
  const [economyStats, setEconomyStats] = useState({ investorCapital: 0, workerRate: 0, totalCoins: 0, totalAssetsOwned: 0, totalDailyRent: 0 })
  const [rentLogs, setRentLogs]           = useState([])
  const [allTournaments, setAllTournaments] = useState([])
  const [loading, setLoading]             = useState(false)
  const [actionMsg, setActionMsg]         = useState(null)

  const load = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const [usersRes, trxRes, vaultRes, assetsRes, flashRes, economyRes, rentRes, tourRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*, profiles(username, email)').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('owner_vault').select('gap_coins, maintenance_coins'),
        supabase.from('assets_config').select('*').order('sort_order'),
        supabase.from('system_settings').select('*').eq('id', 1).single(),
        supabase.from('user_assets').select('type, asset_id, assets_config(price_coins, monthly_roi, worker_gross_gen, maintenance_fee, investor_roi)').eq('status', 'active'),
        supabase.from('transactions').select('*, profiles(username)').eq('type', 'maintenance').order('created_at', { ascending: false }).limit(20),
        supabase.from('tournaments').select('*, tournament_participants(user_id, profiles(username, whatsapp))').order('date_time', { ascending: true })
      ])
      if (usersRes.data)  setAllUsers(usersRes.data)
      if (trxRes.data)    setPendingTrx(trxRes.data)
      if (assetsRes.data) setAllAssets(assetsRes.data)
      if (flashRes.data)  setFlashSaleSettings(flashRes.data)
      if (rentRes.data)   setRentLogs(rentRes.data)
      if (tourRes.data)   setAllTournaments(tourRes.data)
      
      if (economyRes.data) {
        let invTotal = 0
        let workRate = 0
        let investorCount = 0
        let workerCount = 0
        
        economyRes.data.forEach(ua => {
          const config = ua.assets_config
          if (ua.type === 'investor') {
            invTotal += config.price_coins
            investorCount++
          } else {
            workRate += (config.price_coins * (config.worker_gross_gen / 100)) / 30
            workerCount++
          }
        })
        
        const totalCoins = (usersRes.data || []).reduce((s, u) => s + (u.balance || 0), 0)
        const totalAssetsOwned = economyRes.data.length
        const totalDailyRent = economyRes.data.reduce((s, ua) => {
          if (ua.type === 'worker') return s + (ua.assets_config.price_coins * (ua.assets_config.maintenance_fee / 100)) / 30
          return s
        }, 0)

        setEconomyStats({ 
          investorCapital: invTotal, 
          workerRate: workRate,
          totalCoins,
          totalAssetsOwned,
          totalDailyRent,
          investorCount,
          workerCount
        })
      }

      if (vaultRes.data) {
        const totalGap  = vaultRes.data.reduce((s, r) => s + (r.gap_coins || 0), 0)
        const totalMaint = vaultRes.data.reduce((s, r) => s + (r.maintenance_coins || 0), 0)
        setVaultStats({ totalGap, totalMaint, total: totalGap + totalMaint })
      }
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  const toggleVerification = useCallback(async (userId, currentStatus) => {
    await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId)
    setActionMsg(`✅ User ${!currentStatus ? 'verified' : 'unverified'}!`)
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const adjustBalance = useCallback(async (userId, amount, note = 'Admin adjustment') => {
    await supabase.rpc('increment_balance', { p_user_id: userId, p_amount: amount })
    await supabase.from('transactions').insert({ user_id: userId, amount, type: 'deposit', status: 'completed', note: `Coin Adjustment: ${note}` })
    setActionMsg(`✅ Coin balance adjusted by ${amount}`)
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const adjustTKBalance = useCallback(async (userId, amount, note = 'Admin adjustment') => {
    await supabase.rpc('increment_tk_balance', { p_user_id: userId, p_amount: amount })
    await supabase.from('transactions').insert({ user_id: userId, amount, type: 'deposit', status: 'completed', note: `TK Adjustment: ${note}` })
    setActionMsg(`✅ TK balance adjusted by ${amount}`)
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const approveTrx = useCallback(async (trxId, userId, amount, type) => {
    await supabase.from('transactions').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', trxId)
    // Only increment balance for deposits. 
    // Withdrawals (amount < 0) were already deducted on request.
    if (type === 'deposit') {
      await supabase.rpc('increment_balance', { p_user_id: userId, p_amount: amount })
    }
    setActionMsg('✅ Transaction approved!')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const rejectTrx = useCallback(async (trxId) => {
    await supabase.rpc('reject_transaction', { p_trx_id: trxId })
    setActionMsg('❌ Transaction rejected')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const addAsset = useCallback(async (newAsset) => {
    await supabase.from('assets_config').insert(newAsset)
    setActionMsg('✅ New asset added!')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const updateAssetConfig = useCallback(async (assetId, updates) => {
    await supabase.from('assets_config').update(updates).eq('id', assetId)
    setActionMsg('✅ Asset config updated!')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const updateSystemSettings = useCallback(async (updates) => {
    await supabase.from('system_settings').update(updates).eq('id', 1)
    setActionMsg('⚙️ System settings updated!')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const addTournament = useCallback(async (tour) => {
    await supabase.from('tournaments').insert(tour)
    setActionMsg('🎮 Tournament added!')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  const deleteTournament = useCallback(async (id) => {
    await supabase.from('tournaments').delete().eq('id', id)
    setActionMsg('🗑️ Tournament deleted')
    setTimeout(() => setActionMsg(null), 3000)
    load()
  }, [load])

  return {
    allUsers, pendingTrx, vaultStats, allAssets, flashSaleSettings, economyStats, rentLogs, allTournaments,
    loading, actionMsg,
    toggleVerification, adjustBalance, adjustTKBalance, approveTrx, rejectTrx, updateAssetConfig, updateSystemSettings, addAsset, 
    addTournament, deleteTournament,
    reload: load,
  }
}
