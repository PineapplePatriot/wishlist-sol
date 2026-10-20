import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWishlist, useIsAdmin } from "./hooks";
import * as api from "./api";
import { TIERS, MARK_ORDER, giftsWord } from "./config";
import Header from "./components/Header";
import ItemCard, { itemStatus } from "./components/ItemCard";
import { BookModal, DetailModal } from "./components/GuestModals";
import { AdminLogin, ItemFormModal, SettingsModal, JsonModal, EMPTY_ITEM } from "./components/Admin";
import { Toast, burstSparkles } from "./components/ui";

const NICK_KEY = "emerald-wishlist-nick";
const SURPRISE_KEY = "emerald-wishlist-surprise";
const readLocal = (k, fallback) => { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } };
const writeLocal = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

export default function App() {
  const { items, bookings, settings, loading, error, reload } = useWishlist();
  const isAdmin = useIsAdmin();
  const [onAdminPage, setOnAdminPage] = useState(() => window.location.pathname.replace(/\/$/, "") === "/admin");

  const [openTier, setOpenTier] = useState(null);
  const [basket, setBasket] = useState([]);
  const [booking, setBooking] = useState(null);       // { ids: [...], basket: bool }
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);       // item draft or null
  const [showSettings, setShowSettings] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [toast, setToast] = useState(null);
  const [myIds, setMyIds] = useState(() => new Set(Object.keys(api.getMyBookings())));
  const nickname = readLocal(NICK_KEY, "");
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  const refreshMine = () => setMyIds(new Set(Object.keys(api.getMyBookings())));

  // Run an action, show its error as a toast, then pull fresh data.
  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) showToast(okMsg); return true; }
    catch (e) { showToast(e.message, "error"); return false; }
    finally { reload(); }
  };

  const leaveAdminPage = () => { window.history.replaceState(null, "", "/"); setOnAdminPage(false); };

  /* ── Derived data ── */
  const bookingsByItem = useMemo(() => {
    const map = {};
    for (const b of bookings) (map[b.item_id] ||= []).push(b);
    return map;
  }, [bookings]);

  const statusOf = useCallback((item) => itemStatus(item, bookingsByItem[item.id], myIds), [bookingsByItem, myIds]);

  const tierItems = (tierId) => items
    .filter(i => i.category === tierId)
    .sort((a, b) => (MARK_ORDER[a.star] ?? 2) - (MARK_ORDER[b.star] ?? 2));

  const myCount = bookings.filter(b => myIds.has(b.id)).length;
  const itemById = (id) => items.find(i => i.id === id);

  // drop basket entries that were deleted or got booked by someone else
  useEffect(() => {
    setBasket(prev => {
      const next = prev.filter(id => { const it = itemById(id); return it && statusOf(it).canBook; });
      return next.length === prev.length ? prev : next;
    });
  }, [items, bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Guest actions ── */
  const confirmBooking = async (nick, surprise) => {
    if (!nick) return showToast("Вкажіть нікнейм!", "error");
    writeLocal(NICK_KEY, nick);
    writeLocal(SURPRISE_KEY, surprise ? "1" : "");
    const ids = booking.ids;
    const failed = [];
    for (const id of ids) {
      try { await api.bookItem(id, nick, surprise); }
      catch (e) { failed.push(`${itemById(id)?.name || "подарунок"}: ${e.message}`); }
    }
    refreshMine(); reload();
    const ok = ids.length - failed.length;
    if (booking.basket) setBasket(prev => prev.filter(id => !ids.includes(id)));
    setBooking(null);
    if (ok > 0) burstSparkles();
    if (failed.length) showToast(ok ? `Заброньовано ${ok}, але не вдалося: ${failed.join("; ")}` : failed.join("; "), "error");
    else showToast(ids.length > 1 ? `Заброньовано ${ok} ${giftsWord(ok)}! 🎉` : surprise ? "Заброньовано таємно 🤫🎉" : `${nick}, дякуємо! Заброньовано 🎉`);
  };

  const cancelMine = (bookingId) => run(async () => { await api.cancelMyBooking(bookingId); refreshMine(); }, "Бронювання скасовано");

  const toggleBasket = (id) => setBasket(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ── Admin actions ── */
  const adminCancel = (b) => {
    if (!window.confirm(`Зняти бронь${b.nickname ? ` «${b.nickname}»` : ""}?`)) return;
    run(() => api.adminDeleteBooking(b.id), "Бронь знято");
  };

  const saveItem = async (item) => {
    const ok = await run(() => api.saveItem(item), item.id ? "Оновлено ✨" : "Подарунок додано ✨");
    if (ok) setEditing(null);
  };

  const removeItem = (item) => {
    const n = bookingsByItem[item.id]?.length || 0;
    if (!window.confirm(`Видалити «${item.name}»?${n ? `\nРазом з ${n} бронюванням(и).` : ""}`)) return;
    run(() => api.deleteItem(item.id), "Видалено");
  };

  const importItems = async (list, mode) => {
    if (mode === "merge") {
      // only one 💚 per tier: demote imported ones that would clash with existing gifts
      const hasTop = new Set(items.filter(i => i.star === "top").map(i => i.category));
      list = list.map(i => (i.star === "top" && hasTop.has(i.category) ? { ...i, star: "want" } : i));
    }
    const ok = await run(async () => {
      if (mode === "replace") await api.deleteAllItems();
      await api.insertItems(list);
    }, `${mode === "replace" ? "Замінено" : "Додано"}: ${list.length} ${giftsWord(list.length)} ✨`);
    if (ok) setShowJson(false);
  };

  const logout = async () => { await api.signOut(); showToast("Ви вийшли"); };

  /* ── Screens ── */
  if (onAdminPage && isAdmin === false) return <AdminLogin onDone={() => { leaveAdminPage(); showToast("Вітаємо! Режим власника увімкнено 👑"); }} />;

  if (loading || (onAdminPage && isAdmin === null)) return (
    <div className="center-screen"><div><div className="spinner" /><p className="loading-text">Завантажуємо список…</p></div></div>
  );

  return (
    <>
      {isAdmin && (
        <div className="admin-bar">
          <span className="admin-bar-label">👑 Режим власника</span>
          <button className="btn btn-gold btn-sm" onClick={() => setEditing({ ...EMPTY_ITEM })}>+ Подарунок</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️ Налаштування</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowJson(true)}>📜 JSON</button>
          <button className="btn btn-quiet btn-sm" onClick={logout}>Вийти</button>
        </div>
      )}

      <div className="app">
      {error && (
        <div className="conn-error">
          ⚠ Немає зв'язку з базою даних — зміни можуть не зберегтися.
          <span style={{ display: "block", fontSize: 12, opacity: 0.75, marginTop: 4 }}>{error}</span>
        </div>
      )}

      <Header settings={settings} myCount={myCount} nickname={nickname} />

      <main className="tiers">
        {TIERS.map((tier, ti) => {
          const list = tierItems(tier.id);
          const open = openTier === tier.id;
          const taken = list.filter(i => statusOf(i).full).length;
          return (
            <section key={tier.id} className="fade-up" style={{ animationDelay: `${ti * 0.06}s` }}>
              <button className={`tier${open ? " open" : ""}${tier.tone === "gold" ? " gold" : ""}`} onClick={() => setOpenTier(open ? null : tier.id)} aria-expanded={open}>
                <span className="medallion" aria-hidden="true">{tier.emoji}</span>
                <span className="tier-text">
                  <span className="tier-name" style={{ display: "block" }}>{tier.name}</span>
                  <span className="tier-joke" style={{ display: "block" }}>{tier.joke}</span>
                  <span className="tier-price" style={{ display: "block" }}>{tier.price}</span>
                </span>
                <span className="tier-side">
                  {list.length > 0 && <span className="count-badge" title="заброньовано / всього">{taken}/{list.length}</span>}
                  <span className="chevron" aria-hidden="true">▾</span>
                </span>
              </button>

              {open && (
                <div className="tier-body">
                  {list.length === 0 && <p className="empty">{isAdmin ? "Тут поки порожньо — додайте подарунок" : "Тут поки порожньо ✨"}</p>}
                  {list.map((item, i) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      delay={i * 0.05}
                      status={statusOf(item)}
                      bookings={bookingsByItem[item.id] || []}
                      isAdmin={isAdmin}
                      inBasket={basket.includes(item.id)}
                      onBook={() => setBooking({ ids: [item.id], basket: false })}
                      onToggleBasket={() => toggleBasket(item.id)}
                      onDetail={() => setDetail(item)}
                      onCancelMine={cancelMine}
                      onAdminCancel={adminCancel}
                      onEdit={() => setEditing(item)}
                      onDelete={() => removeItem(item)}
                    />
                  ))}
                  {isAdmin && <button className="btn btn-ghost" onClick={() => setEditing({ ...EMPTY_ITEM, category: tier.id })}>+ Додати сюди</button>}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <footer className="footer">✦ зроблено з любов'ю ✦</footer>

      {basket.length > 0 && !booking && (
        <button className="basket-fab" onClick={() => setBooking({ ids: basket, basket: true })} aria-label={`Кошик: ${basket.length}`}>
          🧺<span className="basket-count">{basket.length}</span>
        </button>
      )}

      {booking && (
        <BookModal
          items={(booking.basket ? basket : booking.ids).map(itemById).filter(Boolean)}
          basketMode={booking.basket}
          nickname={nickname}
          surprise={readLocal(SURPRISE_KEY, "") === "1"}
          onRemove={(id) => { toggleBasket(id); setBooking(b => ({ ...b, ids: b.ids.filter(x => x !== id) })); }}
          onConfirm={confirmBooking}
          onClose={() => setBooking(null)}
        />
      )}
      {detail && <DetailModal item={detail} onClose={() => setDetail(null)} />}
      {editing && <ItemFormModal initial={editing} onSave={saveItem} onClose={() => setEditing(null)} showToast={showToast} />}
      {showSettings && <SettingsModal settings={settings} onClose={() => { setShowSettings(false); reload(); }} showToast={showToast} />}
      {showJson && <JsonModal items={items} onImport={importItems} onClose={() => setShowJson(false)} showToast={showToast} />}
      <Toast toast={toast} />
      </div>
    </>
  );
}
