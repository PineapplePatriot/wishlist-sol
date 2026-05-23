import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

/**
 * Supabase-backed storage that replaces window.storage
 * Uses a simple key-value table: wishlist_data (key text PK, data jsonb)
 * Includes realtime subscriptions for multi-user sync
 */

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const latestValue = useRef(defaultValue)

  // Load initial data
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('wishlist_data')
          .select('data')
          .eq('key', key)
          .single()

        if (!cancelled && data && !error) {
          setValue(data.data)
          latestValue.current = data.data
        }
      } catch (e) {
        // Row doesn't exist yet, that's fine
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [key])

  // Realtime subscription for multi-user sync
  useEffect(() => {
    const channel = supabase
      .channel(`wishlist-${key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist_data',
          filter: `key=eq.${key}`,
        },
        (payload) => {
          if (payload.new && payload.new.data) {
            setValue(payload.new.data)
            latestValue.current = payload.new.data
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [key])

  // Save function with upsert
  const save = useCallback(async (newValue) => {
    setValue(newValue)
    latestValue.current = newValue

    const { error } = await supabase
      .from('wishlist_data')
      .upsert(
        { key, data: newValue, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Storage save error:', error)
      throw error
    }
  }, [key])

  return { value, save, loading }
}
