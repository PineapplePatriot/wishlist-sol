import { useCountdown } from "../hooks";
import { MARKS, giftsWord, plural } from "../config";

function Countdown({ date }) {
  const c = useCountdown(date);
  if (!c) return null;
  if (c.past) {
    return c.today ? <div className="countdown fade-up"><div className="countdown-today">🎉 Свято вже сьогодні!</div></div> : null;
  }
  const cells = [
    [c.days, plural(c.days, ["день", "дні", "днів"])],
    [c.hours, plural(c.hours, ["година", "години", "годин"])],
    [c.minutes, plural(c.minutes, ["хвилина", "хвилини", "хвилин"])],
  ];
  return (
    <div className="countdown fade-up" aria-label="Відлік до свята">
      {cells.map(([n, label]) => (
        <div key={label} className="countdown-cell">
          <div className="countdown-num">{n}</div>
          <div className="countdown-lbl">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Header({ settings, myCount, nickname }) {
  return (
    <header className="header">
      <div className="ornament"><span>✦ ◆ ✦</span></div>
      <h1 className="title fade-up">{settings?.title || "Список Бажань"}</h1>
      {settings?.subtitle && <p className="subtitle fade-up">{settings.subtitle}</p>}
      {settings?.show_countdown !== false && <Countdown date={settings?.event_date} />}

      <p className="header-note">
        Обери свій рівень заможності (чесно чи не дуже) та забронюй подарунок.<br />
        <strong>Можна кілька — або зібрати все в кошик і забронювати разом.</strong>
      </p>

      <div className="legend">
        <span className="legend-item"><span className="mark">{MARKS.top.icon}</span>{MARKS.top.label}<span className="legend-note">{MARKS.top.note}</span></span>
        <span className="legend-item"><span className="mark">{MARKS.want.icon}</span>{MARKS.want.label}<span className="legend-note">{MARKS.want.note}</span></span>
        <span className="legend-item"><span className="mark">🤝</span>можна скинутися разом</span>
      </div>

      {myCount > 0 && (
        <div className="my-bookings fade-up">🌟 {nickname ? `${nickname}, у вас` : "У вас"} {myCount} {giftsWord(myCount)} в броні</div>
      )}
    </header>
  );
}
