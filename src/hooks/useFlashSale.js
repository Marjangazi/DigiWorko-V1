import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useFlashSale() {
  const [flashSale, setFlashSale] = useState({
    active: false,
    discount: 0,
    bonus: 0,
    endsAt: null
  })
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    let intervalStarted = false
    let timerId = null

    const fetchConfig = async () => {
      const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single()
      if (data) {
        setFlashSale({
          active: data.flash_sale_active,
          discount: data.flash_sale_discount,
          bonus: data.flash_sale_bonus,
          endsAt: data.flash_sale_ends_at
        })
      }
    }
    
    fetchConfig()

    // Realtime subscription
    const channel = supabase.channel('system_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, payload => {
        const newData = payload.new
        setFlashSale({
          active: newData.flash_sale_active,
          discount: newData.flash_sale_discount,
          bonus: newData.flash_sale_bonus,
          endsAt: newData.flash_sale_ends_at
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let timerId = null
    if (flashSale.active && flashSale.endsAt) {
      const endTime = new Date(flashSale.endsAt).getTime()
      
      const updateTimer = () => {
        const now = Date.now()
        const diff = endTime - now
        
        if (diff <= 0) {
          setTimeLeft('EXPIRED')
          clearInterval(timerId)
          // Flash sale effectively ended on client, though DB will catch it via function logic too
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60))
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const s = Math.floor((diff % (1000 * 60)) / 1000)
          
          setTimeLeft(`${h}h ${m}m ${s}s`)
        }
      }

      updateTimer()
      timerId = setInterval(updateTimer, 1000)
    } else {
      setTimeLeft('')
    }
    
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [flashSale])

  // Client-side helper to check if sale is truly valid right now
  const isVaultActive = flashSale.active && flashSale.endsAt && (new Date(flashSale.endsAt).getTime() > Date.now())

  return { flashSale, timeLeft, isVaultActive }
}
