import { useState } from "react";
import { MARKS, TIERS, giftsWord } from "../config";
import { Modal, Toggle, Field, hostOf, normalizeUrl } from "./ui";

/* Book one gift, or everything in the basket. */
export function BookModal({ items, basketMode, nickname, surprise, onConfirm, onRemove, onClose }) {
  const [nick, setNick] = useState(nickname);
  const [secret, setSecret] = useState(surprise);
  const [busy, setBusy] = useState(false);
  const single = !basketMode && items[0];

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await onConfirm(nick.trim(), secret); } finally { setBusy(false); }
  };

  return (
    <Modal
      title={basketMode ? "🧺 Кошик" : single.group_gift ? "Скинутися 🤝" : "Забронювати 🎁"}
      sub={basketMode ? `${items.length} ${giftsWord(items.length)} — забронюємо все разом` : single.name}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {basketMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, maxHeight: 300, overflowY: "auto" }}>
            {items.length === 0 && <p className="empty">Кошик порожній</p>}
            {items.map(item => {
              const tier = TIERS.find(t => t.id === item.category);
              return (
                <div key={item.id} className="list-row">
                  <span className="mark">{MARKS[item.star]?.icon || tier?.emoji}</span>
                  <div className="list-row-main">
                    <div className="list-row-title">{item.name}</div>
                    <div className="list-row-sub">{tier?.name}{item.price ? ` · ${item.price}` : ""}{item.group_gift ? " · 🤝 разом" : ""}</div>
                  </div>
                  <button type="button" className="btn btn-quiet btn-icon" onClick={() => onRemove(item.id)} aria-label="Прибрати">✕</button>
                </div>
              );
            })}
          </div>
        )}

        <Field label="Ваш нікнейм" hint="Запам'ятаємо на цьому пристрої">
          <input className="input" value={nick} onChange={e => setNick(e.target.value)} maxLength={40} placeholder="Як вас звати?" autoFocus />
        </Field>

        <Toggle
          checked={secret}
          onChange={setSecret}
          title="🤫 Зберегти в таємниці"
          desc={secret
            ? "Ніхто — навіть іменинник — не побачить вашого імені, лише позначку «заброньовано». Ви бачитимете свою бронь на цьому пристрої."
            : "Ваш нікнейм бачитимуть усі, щоб інші гості знали, хто що дарує."}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !nick.trim() || items.length === 0}>
            {busy ? "Зачекайте…" : basketMode ? "Забронювати все" : "Підтвердити"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DetailModal({ item, onClose }) {
  const tier = TIERS.find(t => t.id === item.category);
  const mark = MARKS[item.star];
  return (
    <Modal title={item.name} onClose={onClose} wide>
      <p className="modal-sub">
        {tier?.emoji} {tier?.name}
        {item.price ? ` · ${item.price}` : ""}
        {mark ? ` · ${mark.icon} ${mark.label}` : ""}
        {item.group_gift ? " · 🤝 можна скинутися" : ""}
      </p>
      {item.photo && <img className="detail-photo" src={item.photo} alt={item.name} />}
      {item.description && <p className="detail-desc">{item.description}</p>}
      {item.links?.length > 0 && (
        <div className="links">
          {item.links.map((link, i) => (
            <a key={i} className="link-pill" href={normalizeUrl(link)} target="_blank" rel="noopener noreferrer">↗ {hostOf(link, i)}</a>
          ))}
        </div>
      )}
    </Modal>
  );
}
