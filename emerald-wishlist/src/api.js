import { supabase } from './supabase'

/* ──────────────────────────────────────────────────────────────
   All database calls live here, so components stay readable.
   Every function throws a readable Ukrainian Error on failure.
   ────────────────────────────────────────────────────────────── */

const MESSAGES = {
  NICKNAME_REQUIRED: "Вкажіть нікнейм!",
  ITEM_NOT_FOUND: "Цього подарунка вже немає у списку",
  ALREADY_BOOKED: "Ой, хтось щойно забронював цей подарунок 🙈",
  GROUP_FULL: "У цьому спільному подарунку вже немає місць",
  NOT_YOUR_BOOKING: "Скасувати можна лише власне бронювання (з того ж пристрою)",
  items_one_top_per_category: "💚 вже є на цьому рівні — можна лише один",
  "Invalid login credentials": "Невірний email або пароль",
}

function fail(error) {
  const raw = error?.message || String(error)
  const key = Object.keys(MESSAGES).find(k => raw.includes(k))
  console.error('[api]', error)
  throw new Error(key ? MESSAGES[key] : raw)
}

/* ── Reading ── */
export async function fetchAll() {
  const [items, bookings, settings] = await Promise.all([
    supabase.from('items').select('*').order('created_at'),
    supabase.from('bookings').select('*').order('created_at'),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
  ])
  for (const r of [items, bookings, settings]) if (r.error) fail(r.error)
  return { items: items.data, bookings: bookings.data, settings: settings.data }
}

/* ── Guest: booking ── */
const MY_KEY = 'emerald-wishlist-my-bookings'   // { [bookingId]: token }

export function getMyBookings() {
  try { return JSON.parse(localStorage.getItem(MY_KEY)) || {} } catch { return {} }
}
function setMyBookings(map) {
  try { localStorage.setItem(MY_KEY, JSON.stringify(map)) } catch { /* private mode */ }
}

export async function bookItem(itemId, nickname, surprise) {
  const { data, error } = await supabase.rpc('book_item', { p_item_id: itemId, p_nickname: nickname, p_surprise: surprise })
  if (error) fail(error)
  const row = Array.isArray(data) ? data[0] : data
  setMyBookings({ ...getMyBookings(), [row.booking_id]: row.token })
  return row.booking_id
}

export async function cancelMyBooking(bookingId) {
  const token = getMyBookings()[bookingId]
  if (!token) fail(new Error('NOT_YOUR_BOOKING'))
  const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId, p_token: token })
  if (error) fail(error)
  const mine = getMyBookings(); delete mine[bookingId]; setMyBookings(mine)
}

/* ── Admin ── */
export async function adminDeleteBooking(bookingId) {
  const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
  if (error) fail(error)
}

export async function saveItem(item) {
  const { id, ...fields } = item
  const q = id
    ? supabase.from('items').update(fields).eq('id', id)
    : supabase.from('items').insert(fields)
  const { error } = await q
  if (error) fail(error)
}

export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) fail(error)
}

export async function insertItems(items) {
  const { error } = await supabase.from('items').insert(items)
  if (error) fail(error)
}

export async function deleteAllItems() {
  // bookings go with them (on delete cascade)
  const { error } = await supabase.from('items').delete().not('id', 'is', null)
  if (error) fail(error)
}

export async function saveSettings(fields) {
  const { error } = await supabase.from('settings').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', 1)
  if (error) fail(error)
}

export async function uploadPhoto(file) {
  if (!file.type.startsWith('image/')) fail(new Error('Це не зображення'))
  if (file.size > 8 * 1024 * 1024) fail(new Error('Фото завелике (максимум 8 МБ)'))
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('gift-photos').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) fail(error)
  return supabase.storage.from('gift-photos').getPublicUrl(path).data.publicUrl
}

/* ── Auth ── */
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) fail(error)
  const { data, error: adminErr } = await supabase.rpc('is_admin')
  if (adminErr) fail(adminErr)
  if (!data) {
    await supabase.auth.signOut()
    fail(new Error('Цей акаунт не має прав адміністратора'))
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}
