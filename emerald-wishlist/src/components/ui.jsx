import { useEffect } from "react";

/* Pop-up window. Closes on backdrop click or Escape. */
export function Modal({ title, sub, onClose, wide, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">✕</button>
        {title && <h2 className="modal-title">{title}</h2>}
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, title, desc }) {
  return (
    <label className={`toggle${checked ? " on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
      <span>
        <span className="toggle-title">{title}</span>
        {desc && <span className="toggle-desc" style={{ display: "block" }}>{desc}</span>}
      </span>
    </label>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast${toast.type === "error" ? " error" : ""}`} role="status">{toast.msg}</div>;
}

/* Small gold sparkle burst — the one "celebration" effect. */
export function burstSparkles(x = window.innerWidth / 2, y = window.innerHeight / 2) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const N = 14;
  for (let i = 0; i < N; i++) {
    const s = document.createElement("span");
    const ang = (Math.PI * 2 * i) / N + Math.random() * 0.4;
    const dist = 40 + Math.random() * 60;
    s.className = "burst-dot";
    s.textContent = i % 3 === 0 ? "✦" : "·";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.fontSize = `${10 + Math.random() * 12}px`;
    s.style.setProperty("--bx", `${Math.cos(ang) * dist}px`);
    s.style.setProperty("--by", `${Math.sin(ang) * dist - 16}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
}

/* "https://www.rozetka.com.ua/..." → "rozetka.com.ua" */
export function hostOf(link, i) {
  try { return new URL(normalizeUrl(link)).hostname.replace(/^www\./, ""); }
  catch { return `посилання ${i + 1}`; }
}
export const normalizeUrl = (link) => (/^https?:\/\//i.test(link) ? link : `https://${link}`);
