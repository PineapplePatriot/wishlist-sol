/* ──────────────────────────────────────────────────────────────
   TIERS — "рівні заможності", by price, descending.
   Change names / jokes / prices here; `id` is what the database
   and the JSON import use, so keep ids stable once gifts exist.
   ────────────────────────────────────────────────────────────── */
export const TIERS = [
  { id: "oligarch",    emoji: "👑", name: "Олігарх",                  joke: "гроші не пахнуть, а от подарунки — ще й як",  price: "1000–1500 грн", tone: "gold" },
  { id: "yacht",       emoji: "🛥️", name: "Мільйонер з яхтою",        joke: "яхта в ремонті, але на подарунок вистачить",   price: "700–1000 грн" },
  { id: "success",     emoji: "💼", name: "Успішний успіх",           joke: "ранкова кава за 120 грн — і ні про що не шкодую", price: "450–700 грн" },
  { id: "middle",      emoji: "💳", name: "Стабільний середній клас", joke: "кешбек 2% — теж інвестиція",                 price: "250–450 грн" },
  { id: "payday",      emoji: "🪙", name: "До зарплати ще тиждень",   joke: "зате від щирого серця і з останніх",          price: "100–250 грн" },
  { id: "buckwheat",   emoji: "🫙", name: "Студент на гречці",        joke: "дорога не ціна, а увага (і гречка)",          price: "до 100 грн" },
];

export const TIER_IDS = new Set(TIERS.map(t => t.id));
export const DEFAULT_TIER = "middle";

/* Gift marks the admin can set. "top" is limited to one per tier (enforced in the DB). */
export const MARKS = {
  top:  { icon: "💚", label: "найбільше бажане", note: "1 на рівень" },
  want: { icon: "⭐", label: "дуже хочеться",    note: "можна кілька" },
};
export const MARK_ORDER = { top: 0, want: 1, "": 2 };

/* Ukrainian plural: plural(5, ["подарунок","подарунки","подарунків"]) */
export function plural(n, [one, few, many]) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
export const giftsWord = (n) => plural(n, ["подарунок", "подарунки", "подарунків"]);
