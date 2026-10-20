import { MARKS, plural } from "../config";
import { hostOf, normalizeUrl } from "./ui";

/* Everything the UI needs to know about one gift's booking state. */
export function itemStatus(item, bookings = [], myIds) {
  const count = bookings.length;
  const mine = bookings.filter(b => myIds.has(b.id));
  const full = item.group_gift ? Boolean(item.group_slots && count >= item.group_slots) : count > 0;
  return { count, mine, full, canBook: !full && mine.length === 0 };
}

const who = (b) => b.nickname || "таємний гість";

export default function ItemCard({ item, status, bookings, isAdmin, inBasket, onBook, onToggleBasket, onDetail, onCancelMine, onAdminCancel, onEdit, onDelete, delay = 0 }) {
  const mark = MARKS[item.star];
  const isMine = status.mine.length > 0;
  const cls = ["item", "fade-up", item.star === "top" && "top", inBasket && "in-basket", status.full && "taken", isMine && "mine"].filter(Boolean).join(" ");
  const shortDesc = item.description?.length > 110 ? item.description.slice(0, 110) + "…" : item.description;

  return (
    <article className={cls} style={{ animationDelay: `${delay}s` }}>
      {item.photo && <div className="item-photo" style={{ backgroundImage: `url("${item.photo}")` }} onClick={onDetail} role="img" aria-label={item.name} />}
      <div className="item-content">
        <div className="item-head">
          {mark && <span className="mark" title={mark.label}>{mark.icon}</span>}
          <h3 className="item-name">{item.name}</h3>
          {item.price && <span className="price-tag">{item.price}</span>}
          {item.group_gift && <span className="group-tag">🤝 разом</span>}
        </div>

        {shortDesc && <p className="item-desc">{shortDesc}</p>}

        {item.links?.length > 0 && (
          <div className="links">
            {item.links.map((link, i) => (
              <a key={i} className="link-pill" href={normalizeUrl(link)} target="_blank" rel="noopener noreferrer">↗ {hostOf(link, i)}</a>
            ))}
          </div>
        )}

        {item.group_gift && status.count > 0 && <GroupProgress item={item} bookings={bookings} isAdmin={isAdmin} onAdminCancel={onAdminCancel} />}

        <div className="item-foot">
          <div className="row">
            {isMine ? (
              <>
                <span className="booked-note mine">🌟 {item.group_gift ? "Ви скидаєтесь" : "Ваше бронювання"}{status.mine[0].surprise ? " · 🤫 сюрприз" : ""}</span>
                <button className="btn btn-quiet btn-sm" onClick={() => onCancelMine(status.mine[0].id)}>скасувати</button>
              </>
            ) : status.canBook ? (
              <>
                <button className="btn btn-primary" onClick={onBook}>{item.group_gift ? "Скинутися 🤝" : "Забронювати 🎁"}</button>
                <button className={`btn btn-ghost${inBasket ? " active" : ""}`} onClick={onToggleBasket}>{inBasket ? "✓ У кошику" : "+ Кошик"}</button>
              </>
            ) : !item.group_gift ? (
              <>
                <span className="booked-note">🎁 {bookings[0]?.nickname ? <>Забронювали: <strong>{bookings[0].nickname}</strong></> : "Заброньовано"}</span>
                {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => onAdminCancel(bookings[0])}>зняти бронь</button>}
              </>
            ) : (
              <span className="booked-note">🎉 Учасників вже достатньо</span>
            )}
          </div>
          <div className="row">
            <button className="btn btn-quiet btn-icon" onClick={onDetail} aria-label="Деталі">👁</button>
            {isAdmin && <>
              <button className="btn btn-quiet btn-icon" onClick={onEdit} aria-label="Редагувати">✏️</button>
              <button className="btn btn-danger btn-icon" onClick={onDelete} aria-label="Видалити">🗑</button>
            </>}
          </div>
        </div>
      </div>
    </article>
  );
}

function GroupProgress({ item, bookings, isAdmin, onAdminCancel }) {
  const n = bookings.length;
  const pct = item.group_slots ? Math.min(100, (n / item.group_slots) * 100) : 100;
  const label = item.group_slots
    ? `${n} з ${item.group_slots} ${plural(item.group_slots, ["учасника", "учасників", "учасників"])}`
    : `${n} ${plural(n, ["учасник", "учасники", "учасників"])}`;
  return (
    <div>
      <div className="progress">
        {item.group_slots && <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>}
        <span>🤝 {label}</span>
      </div>
      <div className="row" style={{ marginTop: 6, gap: 6 }}>
        {bookings.map(b => (
          <span key={b.id} className="group-tag" style={{ fontWeight: 500 }}>
            {who(b)}
            {isAdmin && <button className="btn btn-sm" style={{ padding: "0 0 0 6px", background: "none", color: "var(--danger)" }} onClick={() => onAdminCancel(b)} aria-label="Прибрати учасника">✕</button>}
          </span>
        ))}
      </div>
    </div>
  );
}
