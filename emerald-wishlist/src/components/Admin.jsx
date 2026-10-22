import { useState, useRef } from "react";
import { TIERS, TIER_IDS, DEFAULT_TIER, MARKS } from "../config";
import { signIn, uploadPhoto, saveSettings } from "../api";
import { Modal, Toggle, Field } from "./ui";

/* ── /admin login page ── */
export function AdminLogin({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await signIn(email.trim(), password); onDone(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="center-screen">
      <form className="modal fade-up" onSubmit={submit} style={{ textAlign: "left" }}>
        <div className="ornament" style={{ marginBottom: 10 }}><span>✦ ◆ ✦</span></div>
        <h1 className="modal-title" style={{ textAlign: "center", paddingRight: 0 }}>Вхід для власника</h1>
        <p className="modal-sub" style={{ textAlign: "center" }}>Тут керують списком бажань</p>
        <Field label="Email">
          <input className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Пароль">
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </Field>
        {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-gold btn-block" disabled={busy}>{busy ? "Перевіряємо…" : "Увійти"}</button>
        <p style={{ textAlign: "center", marginTop: 16 }}><a href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← до списку</a></p>
      </form>
    </div>
  );
}

/* ── Add / edit a gift ── */
export const EMPTY_ITEM = { name: "", category: DEFAULT_TIER, price: "", star: "", photo: "", description: "", links: [""], group_gift: false, group_slots: "" };

export function ItemFormModal({ initial, onSave, onClose, showToast }) {
  const [it, setIt] = useState(() => ({ ...EMPTY_ITEM, ...initial, links: initial?.links?.length ? [...initial.links] : [""], group_slots: initial?.group_slots ?? "" }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (patch) => setIt(prev => ({ ...prev, ...patch }));

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setUploading(true);
    try { set({ photo: await uploadPhoto(file) }); }
    catch (err) { showToast(err.message, "error"); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!it.name.trim()) return showToast("Вкажіть назву!", "error");
    const slots = parseInt(it.group_slots, 10);
    setBusy(true);
    try {
      await onSave({
        ...(it.id ? { id: it.id } : {}),
        name: it.name.trim(),
        category: it.category,
        price: it.price.trim(),
        star: it.star,
        photo: it.photo.trim(),
        description: it.description.trim(),
        links: it.links.map(l => l.trim()).filter(Boolean),
        group_gift: it.group_gift,
        group_slots: it.group_gift && slots >= 2 ? slots : null,
      });
    } finally { setBusy(false); }
  };

  return (
    <Modal title={it.id ? "Редагувати подарунок" : "Новий подарунок"} onClose={onClose} wide>
      <form onSubmit={submit}>
        <Field label="Назва *">
          <input className="input" value={it.name} onChange={e => set({ name: e.target.value })} autoFocus />
        </Field>
        <div className="field-row">
          <Field label="Рівень">
            <select className="select" value={it.category} onChange={e => set({ category: e.target.value })}>
              {TIERS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name} ({t.price})</option>)}
            </select>
          </Field>
          <Field label="Ціна">
            <input className="input" value={it.price} onChange={e => set({ price: e.target.value })} placeholder="напр. 850 грн" />
          </Field>
        </div>

        <div className="field">
          <span className="field-label">Позначка</span>
          <div className="segmented">
            {[["", "без позначки"], ["want", `${MARKS.want.icon} ${MARKS.want.label}`], ["top", `${MARKS.top.icon} ${MARKS.top.label}`]].map(([v, label]) => (
              <button type="button" key={v} className={`btn btn-ghost btn-sm${it.star === v ? " active" : ""}`} onClick={() => set({ star: v })}>{label}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Фото</span>
          <div className="photo-picker">
            <div className="photo-preview" style={it.photo ? { backgroundImage: `url("${it.photo}")` } : undefined}>{!it.photo && "🖼"}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="row">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Завантаження…" : "📷 Завантажити фото"}</button>
                {it.photo && <button type="button" className="btn btn-quiet btn-sm" onClick={() => set({ photo: "" })}>прибрати</button>}
              </div>
              <input className="input" value={it.photo} onChange={e => set({ photo: e.target.value })} placeholder="…або вставте посилання на зображення" style={{ fontSize: 13 }} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        </div>

        <Field label="Опис">
          <textarea className="textarea" value={it.description} onChange={e => set({ description: e.target.value })} placeholder="Колір, розмір, деталі…" />
        </Field>

        <div className="field">
          <span className="field-label">Посилання на магазин</span>
          {it.links.map((l, i) => (
            <div key={i} className="row" style={{ flexWrap: "nowrap" }}>
              <input className="input" value={l} onChange={e => set({ links: it.links.map((x, j) => j === i ? e.target.value : x) })} placeholder="https://…" />
              {it.links.length > 1 && <button type="button" className="btn btn-quiet btn-icon" onClick={() => set({ links: it.links.filter((_, j) => j !== i) })} aria-label="Прибрати">✕</button>}
            </div>
          ))}
          <button type="button" className="btn btn-quiet btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => set({ links: [...it.links, ""] })}>+ ще посилання</button>
        </div>

        <Toggle checked={it.group_gift} onChange={v => set({ group_gift: v })} title="🤝 Можна скинутися разом"
          desc="Кілька гостей можуть долучитися до одного подарунка (для дорогих речей)." />
        {it.group_gift && (
          <div style={{ marginTop: 12 }}>
            <Field label="Скільки учасників потрібно?" hint="Порожньо — без обмеження">
              <input className="input" type="number" min="2" max="50" value={it.group_slots} onChange={e => set({ group_slots: e.target.value })} placeholder="напр. 4" />
            </Field>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-gold" disabled={busy || uploading}>{busy ? "Зберігаємо…" : it.id ? "Зберегти" : "Додати"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Settings: title, subtitle, event date ── */
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function SettingsModal({ settings, onClose, showToast }) {
  const [title, setTitle] = useState(settings?.title || "");
  const [subtitle, setSubtitle] = useState(settings?.subtitle || "");
  const [date, setDate] = useState(toLocalInput(settings?.event_date));
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveSettings({ title: title.trim() || "Список Бажань", subtitle: subtitle.trim(), event_date: date ? new Date(date).toISOString() : null });
      showToast("Налаштування збережено ✨");
      onClose();
    } catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="⚙️ Налаштування" sub="Це бачать усі гості вгорі сторінки" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Заголовок"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Список Бажань" /></Field>
        <Field label="Підзаголовок"><input className="input" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="до 25-го дня народження" /></Field>
        <Field label="Дата і час свята" hint="Для відліку у шапці. Порожньо — відлік сховано.">
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input className="input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
            {date && <button type="button" className="btn btn-quiet btn-sm" onClick={() => setDate("")}>очистити</button>}
          </div>
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? "Зберігаємо…" : "Зберегти"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── JSON bulk import / export ── */
const LEGACY_STAR = { purple: "top", yellow: "want" };   // files from the witch wishlist still work

export function normalizeImported(parsed) {
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : null;
  if (!list) throw new Error("JSON має бути масивом подарунків або об'єктом { \"items\": [...] }");
  const seenTop = new Set();
  return list.map((raw, idx) => {
    if (!raw || typeof raw !== "object") throw new Error(`Елемент #${idx + 1} не є об'єктом`);
    if (!raw.name || !String(raw.name).trim()) throw new Error(`Елемент #${idx + 1}: відсутня назва (name)`);
    const category = TIER_IDS.has(String(raw.category || "").trim()) ? String(raw.category).trim() : DEFAULT_TIER;
    let star = String(raw.star || "").trim().toLowerCase();
    star = LEGACY_STAR[star] || star;
    if (star !== "top" && star !== "want") star = "";
    if (star === "top") { if (seenTop.has(category)) star = "want"; else seenTop.add(category); }
    const links = Array.isArray(raw.links) ? raw.links.map(String).map(s => s.trim()).filter(Boolean) : raw.link ? [String(raw.link)] : [];
    const slots = parseInt(raw.group_slots, 10);
    return {
      name: String(raw.name).trim(),
      category,
      price: raw.price ? String(raw.price) : "",
      star,
      photo: raw.photo ? String(raw.photo) : "",
      description: raw.description ? String(raw.description) : "",
      links,
      group_gift: Boolean(raw.group_gift),
      group_slots: raw.group_gift && slots >= 2 ? slots : null,
    };
  });
}

function download(name, obj) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATE = {
  items: [
    { name: "Назва подарунка", category: "oligarch", price: "1200 грн", star: "top", photo: "https://…jpg", description: "Колір, розмір, деталі…", links: ["https://shop.example/item"], group_gift: true, group_slots: 3 },
    { name: "Ще один подарунок", category: "payday", price: "180 грн", star: "", links: ["https://…"] },
  ],
};

export function JsonModal({ items, onImport, onClose, showToast }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("merge");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pickFile = (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    file.text().then(setText).catch(() => showToast("Не вдалося прочитати файл", "error"));
  };

  const submit = async () => {
    let parsed;
    try { parsed = JSON.parse(text); } catch { return showToast("Помилка JSON: перевірте синтаксис", "error"); }
    let list;
    try { list = normalizeImported(parsed); } catch (err) { return showToast(err.message, "error"); }
    if (!list.length) return showToast("Порожній список", "error");
    if (mode === "replace" && !window.confirm(`Видалити всі ${items.length} поточних подарунків разом з бронюваннями і замінити новими?`)) return;
    setBusy(true);
    try { await onImport(list, mode); } finally { setBusy(false); }
  };

  const exportCurrent = () => {
    const strip = ({ id, created_at, ...rest }) => rest;
    download("wishlist-export.json", { items: items.map(strip) });
  };

  return (
    <Modal title="📜 Імпорт / експорт JSON" onClose={onClose} wide>
      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>📂 Відкрити файл</button>
        <button className="btn btn-quiet btn-sm" onClick={() => download("wishlist-template.json", TEMPLATE)}>⬇ Шаблон</button>
        <button className="btn btn-quiet btn-sm" onClick={exportCurrent} disabled={!items.length}>⬇ Експорт поточного</button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={pickFile} />
      </div>
      <textarea className="textarea code" value={text} onChange={e => setText(e.target.value)} placeholder='{ "items": [ { "name": "…", "category": "middle", "price": "300 грн" } ] }' />
      <p className="field-hint" style={{ margin: "8px 0 14px" }}>
        Рівні (category): {TIERS.map(t => t.id).join(", ")}. Позначки (star): "top", "want" або "".
      </p>
      <div className="segmented">
        <button className={`btn btn-ghost btn-sm${mode === "merge" ? " active" : ""}`} onClick={() => setMode("merge")}>➕ Додати до наявних</button>
        <button className={`btn btn-ghost btn-sm${mode === "replace" ? " active" : ""}`} onClick={() => setMode("replace")}>♻️ Замінити все</button>
      </div>
      <div className="modal-actions">
        <button className="btn btn-quiet" onClick={onClose}>Закрити</button>
        <button className="btn btn-gold" onClick={submit} disabled={busy || !text.trim()}>{busy ? "Імпортуємо…" : "Імпортувати"}</button>
      </div>
    </Modal>
  );
}
