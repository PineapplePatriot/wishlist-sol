import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import { fetchAll } from './api'

/* Loads gifts + bookings + settings, and refetches whenever anyone
   changes them (Supabase realtime). Errors are surfaced, not hidden. */
export function useWishlist() {
  const [data, setData] = useState({ items: [], bookings: [], settings: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(supabaseConfigured ? null : "Сайт не підключено до бази даних (немає ключів Supabase)")
  const timer = useRef(null)

  const reload = useCallback(async () => {
    try {
      setData(await fetchAll())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    reload()
    // several changes often arrive together (e.g. a bulk import) — batch them
    const schedule = () => { clearTimeout(timer.current); timer.current = setTimeout(reload, 150) }
    const channel = supabase
      .channel('wishlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, schedule)
      .subscribe()
    // refetch when a phone comes back from the background
    const onVisible = () => { if (document.visibilityState === 'visible') schedule() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer.current)
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return { ...data, loading, error, reload }
}

/* true once a logged-in user is confirmed as admin by the database;
   null while that check is still running */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(supabaseConfigured ? null : false)

  useEffect(() => {
    if (!supabaseConfigured) return
    const check = async (session) => {
      if (!session) return setIsAdmin(false)
      const { data } = await supabase.rpc('is_admin')
      setIsAdmin(Boolean(data))
    }
    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // run outside the auth callback (supabase-js recommendation)
      setTimeout(() => check(session), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return isAdmin
}

/* Days / hours / minutes until a date; ticks every 30s. */
export function useCountdown(target) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!target) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [target])
  if (!target) return null
  const diff = new Date(target).getTime() - now
  if (Number.isNaN(diff)) return null
  const day = 86_400_000
  return {
    past: diff <= 0,
    today: diff <= 0 && diff > -day,
    days: Math.floor(diff / day),
    hours: Math.floor((diff % day) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  }
}
