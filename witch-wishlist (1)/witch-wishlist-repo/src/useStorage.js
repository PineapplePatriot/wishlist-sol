import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

/**
 * Supabase-backed storage that replaces window.storage.
 * Table: wishlist_data (key text PK, data jsonb, updated_at timestamptz)
 * Includes realtime sync + surfaced errors so failures are visible, not silent.
 */

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)        // surfaced to the UI
  const latestValue = useRef(defaultValue)

  // Load initial data
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // maybeSingle() returns null (not an error) when the row doesn't exist yet
      const { data, error: loadErr } = await supabase
        .from('wishlist_data')
        .select('data')
        .eq('key', key)
        .maybeSingle()

      if (cancelled) return

      if (loadErr) {
        // A real connection / RLS / config problem — surface it.
        console.error(`[useStorage:${key}] load error:`, loadErr)
        setError(loadErr.message || 'Не вдалося завантажити дані')
      } else if (data && data.data != null) {
        setValue(data.data)
        latestValue.current = data.data
      }
      setLoading(false)
    }
    load().catch((e) => {
      if (!cancelled) { console.error(e); setError(String(e?.message || e)); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [key])

  // Realtime subscription for multi-user sync
  useEffect(() => {
    const channel = supabase
      .channel(`wishlist-${key}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wishlist_data', filter: `key=eq.${key}` },
        (payload) => {
          if (payload.new && payload.new.data != null) {
            setValue(payload.new.data)
            latestValue.current = payload.new.data
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [key])

  // Save with upsert. Returns nothing on success; THROWS on failure so the
  // caller can react (the previous version swallowed errors, which hid the bug).
  const save = useCallback(async (newValue) => {
    // optimistic local update for snappy UI
    setValue(newValue)
    latestValue.current = newValue

    const { error: saveErr } = await supabase
      .from('wishlist_data')
      .upsert(
        { key, data: newValue, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (saveErr) {
      console.error(`[useStorage:${key}] SAVE FAILED:`, saveErr)
      setError(saveErr.message || 'Збереження не вдалося')
      throw saveErr
    }
    setError(null)
  }, [key])

  return { value, save, loading, error }
}
