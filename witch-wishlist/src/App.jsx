import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useStorage } from "./useStorage";
import MusicPlayer from "./MusicPlayer";

/* ──────────────────────────────────────────────────────────────
   CRYSTALS BY RARITY  — price tiers, descending
   Deep mystic violet + moonlight silver palette.
   Each tier has a hand-drawn SVG gem "portrait".
   ────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "amethyst", name: "Аметист",   subtitle: "улюблений камінь відьмочки", crown: true, priceNote: "найцінніший", price: "1000–1500 грн", emoji: "🔮", color: "#bb8ff2", accent: "#dcc4ff", bg: "rgba(187,143,242,0.10)", border: "rgba(187,143,242,0.30)", gem: { fill: "#c9a3f5", facet: "#9a63dd", deep: "#5e2fa0", glint: "#f0e4ff", bg1: "#271a42", bg2: "#160e2a" } },
  { id: "moonstone",name: "Місячний камінь", subtitle: "ловить світло повні", price: "700–1000 грн", emoji: "🌙", color: "#aeb8e8", accent: "#cdd4f5", bg: "rgba(174,184,232,0.08)", border: "rgba(174,184,232,0.25)", gem: { fill: "#cdd4f5", facet: "#9aa6e0", deep: "#5a64a8", glint: "#ffffff", bg1: "#1c2038", bg2: "#101324" } },
  { id: "sapphire", name: "Сапфір",    subtitle: "глибина опівнічного неба", price: "450–700 грн", emoji: "💠", color: "#7e8ce8", accent: "#a3aef5", bg: "rgba(126,140,232,0.08)", border: "rgba(126,140,232,0.25)", gem: { fill: "#8e9af0", facet: "#5e6cd0", deep: "#33409a", glint: "#d4dbff", bg1: "#18203a", bg2: "#0d1126" } },
  { id: "tourmaline",name: "Турмалін", subtitle: "рожевий шепіт серця", price: "250–450 грн", emoji: "🌸", color: "#d98fc4", accent: "#f0b3e0", bg: "rgba(217,143,196,0.08)", border: "rgba(217,143,196,0.25)", gem: { fill: "#e89fd4", facet: "#c66aae", deep: "#8a3a72", glint: "#ffe0f5", bg1: "#2a182a", bg2: "#1c0f1c" } },
  { id: "quartz",   name: "Кварц",     subtitle: "ніжне сяйво на щодень", price: "100–250 грн", emoji: "✨", color: "#c4b8e0", accent: "#ddd4f0", bg: "rgba(196,184,224,0.08)", border: "rgba(196,184,224,0.25)", gem: { fill: "#d4c8f0", facet: "#a896d4", deep: "#6a5a9a", glint: "#ffffff", bg1: "#201c30", bg2: "#13101f" } },
  { id: "pebble",   name: "Камінчик",  subtitle: "маленький, та від щирого серця", price: "до 100 грн", emoji: "🪶", color: "#9a96b0", accent: "#bdb8d0", bg: "rgba(154,150,176,0.08)", border: "rgba(154,150,176,0.25)", gem: { fill: "#b0acc4", facet: "#7e7a96", deep: "#4a4860", glint: "#dad6e8", bg1: "#1a1826", bg2: "#100e18" } },
];
const ADMIN_CODE = "witch2026";

/* ── Crystal portrait (replaces Harbinger mask) ── */
function CrystalGem({ cat, size = 56, idx = 0 }) {
  const g = cat.gem; const id = cat.id;
  const delay = `${(idx * 1.7) % 9}s`;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0, filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.5))" }}>
      <defs>
        <radialGradient id={`gbg-${id}`} cx="50%" cy="40%" r="62%"><stop offset="0%" stopColor={g.bg1} /><stop offset="100%" stopColor={g.bg2} /></radialGradient>
        <radialGradient id={`gglow-${id}`} cx="50%" cy="55%" r="50%"><stop offset="0%" stopColor={g.fill} stopOpacity="0.35" /><stop offset="100%" stopColor={g.fill} stopOpacity="0" /></radialGradient>
        <linearGradient id={`gface-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={g.fill} /><stop offset="100%" stopColor={g.facet} /></linearGradient>
        <linearGradient id={`gsheen-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={g.glint} stopOpacity="0" />
          <stop offset="50%" stopColor={g.glint} stopOpacity="0.85" />
          <stop offset="100%" stopColor={g.glint} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`gclip-${id}`}><polygon points="40,16 56,32 48,58 32,58 24,32" /></clipPath>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#gbg-${id})`} stroke={g.facet} strokeWidth="1.5" strokeOpacity="0.4" />
      <circle cx="40" cy="44" r="30" fill={`url(#gglow-${id})`} />
      {/* faceted gem body */}
      <g>
        <polygon points="40,16 56,32 48,58 32,58 24,32" fill={`url(#gface-${id})`} stroke={g.glint} strokeWidth="0.6" strokeOpacity="0.5" />
        {/* table facet */}
        <polygon points="40,16 56,32 40,36 24,32" fill={g.fill} opacity="0.95" />
        {/* left/right crown facets */}
        <polygon points="24,32 40,36 32,58" fill={g.facet} opacity="0.85" />
        <polygon points="56,32 40,36 48,58" fill={g.deep} opacity="0.9" />
        {/* center culet line */}
        <polygon points="40,36 32,58 48,58" fill={g.facet} opacity="0.6" />
        {/* glint highlights */}
        <polygon points="40,17 52,30 41,33" fill={g.glint} opacity="0.55" />
        <line x1="40" y1="36" x2="40" y2="58" stroke={g.glint} strokeWidth="0.5" strokeOpacity="0.4" />
      </g>
      {/* travelling light-sweep, clipped to the gem body */}
      <g clipPath={`url(#gclip-${id})`}>
        <rect x="-30" y="10" width="16" height="60" fill={`url(#gsheen-${id})`} style={{ transformBox: "fill-box", transformOrigin: "center", animation: `gemSweep 9s ease-in-out infinite`, animationDelay: delay }} />
      </g>
      {/* sparkles */}
      <circle cx="60" cy="22" r="1.4" fill={g.glint} opacity="0.7" />
      <circle cx="20" cy="50" r="1" fill={g.glint} opacity="0.5" />
      <path d="M62 48 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 z" fill={g.glint} opacity="0.4" />
    </svg>
  );
}

/* ── Background: starfield + drifting fog + moon (canvas) ── */
function CelestialBackground() {
  const canvasRef = useRef(null); const animRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h;
    const resize = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Stars
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h * 0.85,
      r: Math.random() * 1.3 + 0.3,
      tw: Math.random() * Math.PI * 2,
      twSpeed: Math.random() * 0.03 + 0.008,
      dx: (Math.random() - 0.5) * 0.08, dy: (Math.random() - 0.5) * 0.08,
      hue: Math.random() > 0.7 ? "#cdb8ff" : "#e8e4ff",
    }));
    // Drifting violet motes (fog particles)
    const motes = Array.from({ length: 28 }, () => ({
      x: Math.random() * w, y: h - Math.random() * h * 0.5,
      r: Math.random() * 2.4 + 0.6,
      dx: (Math.random() - 0.5) * 0.25, dy: -Math.random() * 0.3 - 0.05,
      alpha: Math.random() * 0.4 + 0.08, pulse: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? "#a978e8" : "#aeb8e8",
    }));
    // Fog blobs near bottom
    const fog = Array.from({ length: 5 }, (_, i) => ({
      x: (w / 5) * i + Math.random() * 100,
      y: h - Math.random() * 80,
      r: 140 + Math.random() * 120,
      dx: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Moon (top-right, slow vertical bob)
      const t = Date.now() * 0.0002;
      const moonX = w - 90, moonY = 90 + Math.sin(t) * 8;
      const mGrad = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 70);
      mGrad.addColorStop(0, "rgba(232,228,255,0.5)");
      mGrad.addColorStop(0.4, "rgba(169,120,232,0.12)");
      mGrad.addColorStop(1, "rgba(169,120,232,0)");
      ctx.beginPath(); ctx.arc(moonX, moonY, 70, 0, Math.PI * 2); ctx.fillStyle = mGrad; ctx.fill();
      ctx.beginPath(); ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(225,220,250,0.85)"; ctx.fill();
      // moon craters
      ctx.fillStyle = "rgba(150,140,190,0.3)";
      ctx.beginPath(); ctx.arc(moonX - 8, moonY - 6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX + 7, moonY + 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX + 2, moonY - 10, 2.5, 0, Math.PI * 2); ctx.fill();

      // Constellation lines — connect nearby stars (drawn under the stars)
      const LINK = 118, LINK2 = LINK * LINK;
      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            const op = (1 - Math.sqrt(d2) / LINK) * 0.22;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "#a98fe0"; ctx.globalAlpha = op; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Stars (twinkle + slow drift)
      for (const s of stars) {
        s.tw += s.twSpeed;
        s.x += s.dx; s.y += s.dy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h * 0.85; if (s.y > h * 0.85) s.y = 0;
        const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.hue; ctx.globalAlpha = a; ctx.fill();
        if (s.r > 1) {
          ctx.globalAlpha = a * 0.5;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = s.hue; ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Fog blobs
      for (const f of fog) {
        f.x += f.dx; f.phase += 0.004;
        if (f.x < -f.r) f.x = w + f.r; if (f.x > w + f.r) f.x = -f.r;
        const fy = f.y + Math.sin(f.phase) * 12;
        const fGrad = ctx.createRadialGradient(f.x, fy, 0, f.x, fy, f.r);
        fGrad.addColorStop(0, "rgba(120,80,180,0.10)");
        fGrad.addColorStop(0.5, "rgba(90,60,150,0.05)");
        fGrad.addColorStop(1, "rgba(90,60,150,0)");
        ctx.beginPath(); ctx.arc(f.x, fy, f.r, 0, Math.PI * 2); ctx.fillStyle = fGrad; ctx.fill();
      }

      // Drifting motes
      for (const p of motes) {
        p.x += p.dx; p.y += p.dy; p.pulse += 0.015;
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = a; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = a * 0.07; ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ── Sparkle burst (booking celebration) — imperative, call from anywhere ── */
function burstSparkles(x, y) {
  let layer = document.getElementById("burst-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "burst-layer";
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998;";
    document.body.appendChild(layer);
  }
  const glyphs = ["✦", "✧", "⭐", "🌙", "💜", "·"];
  const colors = ["#cdb8ff", "#a978e8", "#aeb8e8", "#e8dcff", "#dcc4ff"];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const s = document.createElement("span");
    const ang = (Math.PI * 2 * i) / N + Math.random() * 0.4;
    const dist = 40 + Math.random() * 80;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 20; // bias upward
    const size = 10 + Math.random() * 14;
    const c = colors[Math.floor(Math.random() * colors.length)];
    s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    s.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;color:${c};font-size:${size}px;transform:translate(-50%,-50%);text-shadow:0 0 10px ${c};animation:burstFly 1s ease-out forwards;will-change:transform,opacity;`;
    s.style.setProperty("--bx", `${dx}px`);
    s.style.setProperty("--by", `${dy}px`);
    s.style.setProperty("--rot", `${(Math.random() - 0.5) * 360}deg`);
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

/* ── Cursor sparkle trail ── */
function SparkleTrail() {
  const layerRef = useRef(null);
  const last = useRef(0);
  useEffect(() => {
    const layer = layerRef.current; if (!layer) return;
    const colors = ["#cdb8ff", "#a978e8", "#aeb8e8", "#e8dcff"];
    const spawn = (x, y) => {
      const now = Date.now();
      if (now - last.current < 28) return; // throttle
      last.current = now;
      const s = document.createElement("span");
      const size = 4 + Math.random() * 7;
      const c = colors[Math.floor(Math.random() * colors.length)];
      s.textContent = Math.random() > 0.6 ? "✦" : "·";
      s.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9999;color:${c};font-size:${size + 6}px;transform:translate(-50%,-50%);text-shadow:0 0 8px ${c};animation:sparkleFade 0.9s ease forwards;will-change:transform,opacity;`;
      const dx = (Math.random() - 0.5) * 26;
      const dy = (Math.random() - 0.5) * 26 + 8;
      s.style.setProperty("--dx", `${dx}px`);
      s.style.setProperty("--dy", `${dy}px`);
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    };
    const onMove = (e) => spawn(e.clientX, e.clientY);
    const onTouch = (e) => { const t = e.touches[0]; if (t) spawn(t.clientX, t.clientY); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("touchmove", onTouch); };
  }, []);
  return <div ref={layerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }} />;
}

/* ── Floating witch silhouette ── */
function FloatingWitch() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: 0, pointerEvents: "none", zIndex: 1 }}>
      <div style={{ position: "absolute", top: "18vh", animation: "witchFly 28s linear infinite", willChange: "transform" }}>
        <svg width="84" height="60" viewBox="0 0 120 80" style={{ filter: "drop-shadow(0 0 10px rgba(169,120,232,0.5))" }}>
          {/* trailing sparkles */}
          <circle cx="10" cy="58" r="1.6" fill="#cdb8ff" opacity="0.8"><animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.4s" repeatCount="indefinite" /></circle>
          <circle cx="4" cy="62" r="1.1" fill="#a978e8" opacity="0.6"><animate attributeName="opacity" values="0.6;0.05;0.6" dur="1.7s" repeatCount="indefinite" /></circle>
          <circle cx="16" cy="54" r="1" fill="#e8dcff" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.1s" repeatCount="indefinite" /></circle>
          {/* broom handle */}
          <line x1="18" y1="56" x2="84" y2="40" stroke="#6a4a30" strokeWidth="2.5" strokeLinecap="round" />
          {/* broom bristles */}
          <path d="M18 56 L4 52 M18 56 L3 58 M18 56 L5 63 M18 56 L8 66" stroke="#b89050" strokeWidth="1.6" strokeLinecap="round" />
          {/* cloak / body */}
          <path d="M52 44 Q60 26 74 30 Q86 33 80 46 Q74 56 60 54 Q52 52 52 44 Z" fill="#3a2a5e" stroke="#a978e8" strokeWidth="1" strokeOpacity="0.5" />
          {/* cloak flutter */}
          <path d="M80 46 Q92 48 100 44 Q94 52 82 52 Z" fill="#2e2150" opacity="0.85" />
          {/* head */}
          <circle cx="73" cy="26" r="6.5" fill="#d8c4b0" />
          {/* witch hat */}
          <path d="M64 22 L80 24 L92 6 Z" fill="#2e2150" stroke="#a978e8" strokeWidth="0.8" strokeOpacity="0.5" />
          <ellipse cx="73" cy="23" rx="13" ry="3" fill="#231840" />
          <path d="M88 9 a3 3 0 0 1 -3 4" stroke="#cdb8ff" strokeWidth="1" fill="none" opacity="0.6" />
          {/* moon charm */}
          <path d="M104 40 a4 4 0 1 0 0.1 -6 a3 3 0 0 1 -0.1 6 z" fill="#e8dcff" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}

function StarFlair({ star }) {
  if (!star) return null;
  const isP = star === "purple";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", fontSize: isP ? 20 : 17,
      filter: isP ? "drop-shadow(0 0 6px #b060e0) drop-shadow(0 0 12px #8030b0)" : "drop-shadow(0 0 4px #aeb8e8) drop-shadow(0 0 8px #7e8ce8)",
      animation: isP ? "purpleStar 2s ease infinite" : "silverStar 3s ease infinite",
    }}>{isP ? "💜" : "⭐"}</span>
  );
}

function Overlay({ children, onClose }) {
  return (<div style={st.overlay} onClick={onClose}><div onClick={e => e.stopPropagation()} style={{ animation: "fadeUp 0.3s ease" }}>{children}</div></div>);
}

function hexRgb(hex) { return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`; }

/* small decorative sigil that glows on category hover */
function Sigil({ color, active }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{
      position: "absolute", right: 54, top: "50%", transform: "translateY(-50%)",
      opacity: active ? 0.85 : 0, transition: "opacity 0.4s ease, transform 0.4s ease",
      pointerEvents: "none", filter: active ? `drop-shadow(0 0 8px ${color})` : "none",
    }}>
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.6" />
      <circle cx="20" cy="20" r="11" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.4" />
      <polygon points="20,5 33,28 7,28" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.7" />
      <polygon points="20,35 7,12 33,12" fill="none" stroke={color} strokeWidth="0.6" strokeOpacity="0.45" />
      <circle cx="20" cy="20" r="2" fill={color} fillOpacity="0.7">
        {active && <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />}
      </circle>
    </svg>
  );
}

/* filigree flourish that sits on the top edge of each category card */
function TopOrnament({ color, accent, active }) {
  return (
    <div style={{
      position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
      pointerEvents: "none", lineHeight: 0,
      filter: active ? `drop-shadow(0 0 6px ${color})` : "none",
      transition: "filter 0.4s ease",
    }}>
      <svg width="180" height="26" viewBox="0 0 180 26">
        {/* mirrored scrolling curls sweeping outward from center */}
        <path d="M90 13 C 76 13, 70 4, 56 6 C 44 8, 40 16, 28 14 C 20 13, 16 8, 8 11"
          fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.7" strokeLinecap="round" />
        <path d="M90 13 C 104 13, 110 4, 124 6 C 136 8, 140 16, 152 14 C 160 13, 164 8, 172 11"
          fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.7" strokeLinecap="round" />
        {/* inner shorter accent curls */}
        <path d="M90 13 C 80 13, 76 8, 66 10" fill="none" stroke={accent} strokeWidth="0.7" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M90 13 C 100 13, 104 8, 114 10" fill="none" stroke={accent} strokeWidth="0.7" strokeOpacity="0.5" strokeLinecap="round" />
        {/* tiny end dots */}
        <circle cx="8" cy="11" r="1.4" fill={color} fillOpacity="0.7" />
        <circle cx="172" cy="11" r="1.4" fill={color} fillOpacity="0.7" />
        {/* center diamond gem */}
        <g style={{ transformOrigin: "90px 13px", transform: active ? "scale(1.15)" : "scale(1)", transition: "transform 0.4s ease" }}>
          <polygon points="90,3 97,13 90,23 83,13" fill={color} fillOpacity="0.9" stroke={accent} strokeWidth="0.6" />
          <polygon points="90,3 97,13 90,13 83,13" fill={accent} fillOpacity="0.85" />
          <line x1="90" y1="13" x2="90" y2="23" stroke={accent} strokeWidth="0.4" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

/* ── Main App ── */

export default function App() {
  const { value: items, save: saveItemsRaw, loading: loadingItems, error: itemsError } = useStorage('items', []);
  const { value: bookings, save: saveBookingsRaw, loading: loadingBookings, error: bookingsError } = useStorage('bookings', {});

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [nickname, setNickname] = useState("");
  const [savedNick, setSavedNick] = useState("");
  const [toast, setToast] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [basket, setBasket] = useState([]);
  const [showBasket, setShowBasket] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "amethyst", photo: "", links: [""], description: "", star: "", price: "" });
  const [jsonText, setJsonText] = useState("");
  const [jsonMode, setJsonMode] = useState("merge"); // merge | replace
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); }, []);

  useEffect(() => {
    const stored = localStorage.getItem('witchlist-nick');
    if (stored) { setSavedNick(stored); setNickname(stored); }
  }, []);

  const loading = loadingItems || loadingBookings;

  const myBookings = useMemo(() => {
    if (!savedNick || !bookings) return [];
    return Object.entries(bookings).filter(([, n]) => n.toLowerCase() === savedNick.toLowerCase()).map(([id]) => id);
  }, [bookings, savedNick]);

  const saveItems = async (ni) => { try { await saveItemsRaw(ni); } catch (e) { showToast(`Не збережено: ${e?.message || "помилка БД"}`, "error"); } };
  const saveBookings = async (nb) => { try { await saveBookingsRaw(nb); } catch (e) { showToast(`Не збережено: ${e?.message || "помилка БД"}`, "error"); } };

  const resetForm = () => setNewItem({ name: "", category: "amethyst", photo: "", links: [""], description: "", star: "", price: "" });

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const addItem = async () => {
    if (!newItem.name.trim()) return showToast("Вкажіть назву!", "error");
    if (newItem.star === "purple") {
      const existing = items.find(i => i.category === newItem.category && i.star === "purple");
      if (existing) return showToast(`💜 вже є: «${existing.name}»`, "error");
    }
    const item = { ...newItem, id: genId(), links: newItem.links.filter(l => l.trim()), createdAt: Date.now() };
    await saveItems([...items, item]);
    resetForm(); setShowAddModal(false); setEditingItem(null); showToast("Подарунок додано! 🔮");
  };

  const updateItem = async () => {
    if (!newItem.name.trim()) return showToast("Вкажіть назву!", "error");
    if (newItem.star === "purple") {
      const existing = items.find(i => i.category === newItem.category && i.star === "purple" && i.id !== editingItem.id);
      if (existing) return showToast(`💜 вже є: «${existing.name}»`, "error");
    }
    await saveItems(items.map(it => it.id === editingItem.id ? { ...it, ...newItem, links: newItem.links.filter(l => l.trim()) } : it));
    resetForm(); setShowAddModal(false); setEditingItem(null); showToast("Оновлено! ✨");
  };

  const deleteItem = async (id) => {
    await saveItems(items.filter(it => it.id !== id));
    const nb = { ...bookings }; delete nb[id]; await saveBookings(nb);
    setShowDetailModal(null); setBasket(prev => prev.filter(b => b !== id)); showToast("Видалено 🗑");
  };

  /* ── JSON bulk import ── */
  const validCatIds = new Set(CATEGORIES.map(c => c.id));
  const normalizeImported = (arr) => {
    // Accepts array of items OR {items:[...]}
    const list = Array.isArray(arr) ? arr : (arr && Array.isArray(arr.items) ? arr.items : null);
    if (!list) throw new Error("JSON має бути масивом подарунків або об'єктом { \"items\": [...] }");
    return list.map((raw, idx) => {
      if (!raw || typeof raw !== "object") throw new Error(`Елемент #${idx + 1} не є об'єктом`);
      if (!raw.name || !String(raw.name).trim()) throw new Error(`Елемент #${idx + 1}: відсутня назва (name)`);
      let category = String(raw.category || "").trim();
      if (!validCatIds.has(category)) category = "quartz"; // fallback to a mid-low tier
      let star = String(raw.star || "").trim().toLowerCase();
      if (star !== "purple" && star !== "yellow") star = "";
      let links = [];
      if (Array.isArray(raw.links)) links = raw.links.filter(l => l && String(l).trim()).map(String);
      else if (raw.link && String(raw.link).trim()) links = [String(raw.link)];
      return {
        id: raw.id ? String(raw.id) : genId(),
        name: String(raw.name).trim(),
        category,
        photo: raw.photo ? String(raw.photo) : "",
        description: raw.description ? String(raw.description) : "",
        price: raw.price ? String(raw.price) : "",
        star,
        links,
        createdAt: raw.createdAt || Date.now() + idx,
      };
    });
  };

  const importJson = async () => {
    let parsed;
    try { parsed = JSON.parse(jsonText); }
    catch (e) { return showToast("Помилка JSON: перевірте синтаксис", "error"); }
    let imported;
    try { imported = normalizeImported(parsed); }
    catch (e) { return showToast(e.message, "error"); }
    if (!imported.length) return showToast("Порожній список", "error");

    // de-dup purple per category: keep first purple, demote rest to yellow
    const seenPurple = new Set();
    const cleaned = imported.map(it => {
      if (it.star === "purple") {
        if (seenPurple.has(it.category)) return { ...it, star: "yellow" };
        seenPurple.add(it.category);
      }
      return it;
    });

    if (jsonMode === "replace") {
      await saveItems(cleaned);
      await saveBookings({}); // clear bookings since ids changed
      showToast(`Замінено! Додано ${cleaned.length} 🔮`);
    } else {
      // merge: avoid purple clash with existing
      const existingPurple = new Set(items.filter(i => i.star === "purple").map(i => i.category));
      const merged = cleaned.map(it => {
        if (it.star === "purple" && existingPurple.has(it.category)) return { ...it, star: "yellow" };
        if (it.star === "purple") existingPurple.add(it.category);
        return it;
      });
      // avoid id collisions
      const existingIds = new Set(items.map(i => i.id));
      const safe = merged.map(it => existingIds.has(it.id) ? { ...it, id: genId() } : it);
      await saveItems([...items, ...safe]);
      showToast(`Додано ${safe.length} подарунк${safe.length === 1 ? "ок" : safe.length < 5 ? "и" : "ів"}! 🔮`);
    }
    setJsonText(""); setShowJsonModal(false);
  };

  const onFilePicked = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(String(reader.result || ""));
    reader.onerror = () => showToast("Не вдалося прочитати файл", "error");
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const template = {
      items: [
        { name: "Назва подарунка", category: "amethyst", price: "1200 грн", star: "purple", photo: "https://...jpg", description: "Колір, розмір, деталі...", links: ["https://shop.example/item"] },
        { name: "Ще один подарунок", category: "quartz", price: "180 грн", star: "", links: ["https://..."] },
      ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "wishlist-template.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrent = () => {
    const blob = new Blob([JSON.stringify({ items }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "wishlist-export.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Експортовано ✨");
  };

  const bookSingle = async (itemId) => {
    if (!nickname.trim()) return showToast("Вкажіть нікнейм!", "error");
    const n = nickname.trim();
    await saveBookings({ ...bookings, [itemId]: n });
    setSavedNick(n); localStorage.setItem('witchlist-nick', n);
    setShowBookModal(null); showToast(`${n} забронював(ла) подарунок! 🎉`);
    burstSparkles(window.innerWidth / 2, window.innerHeight / 2);
  };

  const bookBasket = async () => {
    if (!nickname.trim()) return showToast("Вкажіть нікнейм!", "error");
    const available = basket.filter(id => !bookings[id]);
    if (!available.length) return showToast("Усе вже заброньовано!", "error");
    const nb = { ...bookings }; available.forEach(id => { nb[id] = nickname.trim(); });
    await saveBookings(nb);
    setSavedNick(nickname.trim()); localStorage.setItem('witchlist-nick', nickname.trim());
    setBasket([]); setShowBasket(false);
    const c = available.length;
    showToast(`${nickname.trim()} забронював(ла) ${c} подарунк${c === 1 ? "ок" : c < 5 ? "и" : "ів"}! 🎉`);
    burstSparkles(window.innerWidth / 2, window.innerHeight / 2);
  };

  const unbookItem = async (itemId) => { const nb = { ...bookings }; delete nb[itemId]; await saveBookings(nb); showToast("Скасовано"); };
  const toggleBasketItem = (itemId) => { setBasket(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]); };

  const startEdit = (item) => {
    setEditingItem(item);
    setNewItem({ name: item.name, category: item.category, photo: item.photo || "", links: item.links?.length ? [...item.links] : [""], description: item.description || "", star: item.star || "", price: item.price || "" });
    setShowAddModal(true); setShowDetailModal(null);
  };

  const catItems = (catId) => (items || []).filter(i => i.category === catId).sort((a, b) => {
    const o = { purple: 0, yellow: 1, "": 2 }; return (o[a.star] ?? 2) - (o[b.star] ?? 2);
  });

  if (loading) return (<div style={st.loadingScreen}><div style={st.loadingSpinner} /><p style={{ color: "#cdb8ff", fontFamily: "'Cinzel',serif", fontSize: 18 }}>Завантаження чарів...</p></div>);

  const basketItems = basket.map(id => (items || []).find(i => i.id === id)).filter(Boolean);
  const basketAvailable = basketItems.filter(i => !bookings[i.id]);

  return (
    <div style={st.app}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0814}
        ::selection{background:rgba(169,120,232,0.35);color:#fff}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(169,120,232,0.35);border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes toastIn{from{transform:translateY(30px) translateX(-50%);opacity:0}to{transform:translateY(0) translateX(-50%);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 4px var(--glow))}50%{filter:drop-shadow(0 0 18px var(--glow))}}
        @keyframes silverStar{0%,100%{transform:scale(1)}25%{transform:scale(1.18) rotate(6deg)}75%{transform:scale(1.05) rotate(-3deg)}}
        @keyframes purpleStar{0%,100%{transform:scale(1);filter:drop-shadow(0 0 6px #b060e0)}50%{transform:scale(1.3) rotate(10deg);filter:drop-shadow(0 0 18px #b060e0) drop-shadow(0 0 32px #6020a0)}}
        @keyframes breathe{0%,100%{opacity:0.35}50%{opacity:0.75}}
        @keyframes borderGlow{0%,100%{box-shadow:0 4px 20px rgba(169,120,232,0.3)}50%{box-shadow:0 4px 30px rgba(169,120,232,0.55)}}
        @keyframes sparkleFade{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0.3)}}
        @keyframes witchFly{0%{transform:translateX(-140px)}100%{transform:translateX(calc(100vw + 140px))}}
        @keyframes gemSweep{0%,100%{transform:rotate(20deg) translateX(40px);opacity:0}45%{transform:rotate(20deg) translateX(72px);opacity:1}90%{transform:rotate(20deg) translateX(95px);opacity:0}}
        @keyframes burstFly{0%{opacity:1;transform:translate(-50%,-50%) scale(0.4) rotate(0deg)}60%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--bx)),calc(-50% + var(--by))) scale(1.1) rotate(var(--rot))}}
        @keyframes titleShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .cat-card{cursor:pointer;transition:box-shadow 0.3s ease,border-color 0.3s ease,background 0.3s ease,transform 0.12s ease;position:relative;transform-style:preserve-3d}.cat-card:hover{box-shadow:0 16px 50px rgba(20,8,40,0.6)}
        .cat-sheen{position:absolute;inset:0;border-radius:18px;pointer-events:none;opacity:0;transition:opacity 0.3s ease;background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),var(--sheen,rgba(200,180,255,0.10)),transparent 60%)}
        .cat-card:hover .cat-sheen{opacity:1}
        .cat-card::before,.cat-card::after{content:"";position:absolute;width:16px;height:16px;border:1px solid var(--corner,rgba(169,120,232,0.4));opacity:0.6;transition:opacity 0.3s ease,width 0.3s ease,height 0.3s ease;pointer-events:none}
        .cat-card::before{top:9px;left:9px;border-right:none;border-bottom:none;border-top-left-radius:6px}
        .cat-card::after{bottom:9px;right:9px;border-left:none;border-top:none;border-bottom-right-radius:6px}
        .cat-card:hover::before,.cat-card:hover::after{opacity:1;width:20px;height:20px}
        .item-card{transition:all 0.2s ease}.item-card:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(20,8,40,0.5)}
        .btn{cursor:pointer;transition:all 0.2s ease}.btn:hover{filter:brightness(1.15);transform:translateY(-1px)}.btn:active{transform:translateY(0)}
        .link-pill:hover{filter:brightness(1.2)}
        .music-btn:hover{background:rgba(169,120,232,0.22)!important}
        .basket-fab:hover{transform:scale(1.1)!important}
        .basket-item:hover{background:rgba(255,255,255,0.06)!important}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#a978e8!important;box-shadow:0 0 0 2px rgba(169,120,232,0.18)}
      `}</style>

      <CelestialBackground />
      <FloatingWitch />
      <SparkleTrail />

      {(itemsError || bookingsError) && (
        <div style={st.connError}>
          ⚠ Немає зв'язку з базою даних — зміни не зберігаються для інших.
          <span style={{ opacity: 0.7, display: "block", fontSize: 12, marginTop: 4 }}>
            {itemsError || bookingsError}
          </span>
        </div>
      )}

      <header style={st.header}>
        <div style={st.headerDecor}>☾ ✦ ☽</div>
        <h1 style={st.title}>Список Бажань</h1>
        <p style={st.subtitle}>до 21-го дня народження 🔮</p>
        <div style={st.headerLine} />
        <p style={st.headerNote}>Обери самоцвіт за щедрістю свого серця та забронюй подарунок<br /><span style={{ color: "#cdb8ff" }}>Можна бронювати скільки завгодно — або збери кошик чарів!</span></p>
        <div style={st.legend}>
          <span style={st.legendItem}><span style={{ fontSize: 16 }}>💜</span> найбільше бажане <span style={st.legendPrio}>1 на категорію</span></span>
          <span style={st.legendDot}>·</span>
          <span style={st.legendItem}><span style={{ fontSize: 15 }}>⭐</span> дуже хочеться <span style={st.legendPrio}>можна кілька</span></span>
          <span style={st.legendDot}>·</span>
          <span style={st.legendItem}><span style={{ opacity: 0.5 }}>○</span> буду рада будь-чому</span>
        </div>
        <MusicPlayer />
        {savedNick && myBookings.length > 0 && (
          <div style={st.myBookings}><span style={{ color: "#cdb8ff" }}>🎀 {savedNick}</span><span style={{ color: "#998fb8" }}> — {myBookings.length} подарунк{myBookings.length === 1 ? "ок" : myBookings.length < 5 ? "и" : "ів"}</span></div>
        )}
        <div style={st.adminArea}>
          {isAdmin ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#cdb8ff", fontSize: 14 }}>🌙 Відьмонька</span>
              <button className="btn" style={st.smallBtn} onClick={() => { setEditingItem(null); resetForm(); setShowAddModal(true); }}>+ Додати</button>
              <button className="btn" style={st.smallBtn} onClick={() => { setJsonText(""); setShowJsonModal(true); }}>📜 JSON</button>
              <button className="btn" style={{ ...st.smallBtn, background: "rgba(255,255,255,0.08)", color: "#aaa" }} onClick={() => setIsAdmin(false)}>Вийти</button>
            </div>
          ) : showAdminLogin ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
              <input type="password" placeholder="Закляття" value={adminInput} onChange={e => setAdminInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { if (adminInput === ADMIN_CODE) { setIsAdmin(true); setShowAdminLogin(false); setAdminInput(""); showToast("Ласкаво просимо, Чаклунко! 🌙"); } else { showToast("Невірне закляття!", "error"); setAdminInput(""); } } }}
                style={st.adminCodeInput} />
              <button className="btn" style={st.smallBtn} onClick={() => { if (adminInput === ADMIN_CODE) { setIsAdmin(true); setShowAdminLogin(false); setAdminInput(""); showToast("Ласкаво просимо, Чаклунко! 🌙"); } else { showToast("Невірне закляття!", "error"); setAdminInput(""); } }}>→</button>
              <button className="btn" style={{ ...st.smallBtn, background: "rgba(255,255,255,0.06)", color: "#888" }} onClick={() => { setShowAdminLogin(false); setAdminInput(""); }}>✕</button>
            </div>
          ) : (
            <button className="btn" style={{ ...st.smallBtn, background: "rgba(255,255,255,0.04)", color: "#555", fontSize: 11 }} onClick={() => setShowAdminLogin(true)}>🔮</button>
          )}
        </div>
      </header>

      <main style={st.main}>
        {CATEGORIES.map((cat, ci) => {
          const cItems = catItems(cat.id);
          const isOpen = activeCategory === cat.id;
          const bookedCount = cItems.filter(i => bookings[i.id]).length;
          const isHov = hoveredCat === cat.id;
          return (
            <div key={cat.id} style={{ animation: `fadeUp 0.5s ease ${ci * 0.07}s both` }}>
              <div className="cat-card"
                onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseMove={(e) => {
                  const el = e.currentTarget;
                  const r = el.getBoundingClientRect();
                  const px = (e.clientX - r.left) / r.width - 0.5;
                  const py = (e.clientY - r.top) / r.height - 0.5;
                  el.style.transform = `perspective(900px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-3px)`;
                  el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
                  el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
                }}
                onMouseLeave={(e) => { setHoveredCat(null); e.currentTarget.style.transform = ""; }}
                style={{ ...st.catCard, "--corner": cat.border, "--sheen": `rgba(${hexRgb(cat.accent)},0.10)`, borderColor: isOpen ? cat.color : isHov ? cat.accent : cat.border, background: isOpen ? cat.bg : isHov ? `rgba(${hexRgb(cat.color)},0.05)` : "rgba(255,255,255,0.02)" }}>
                <div className="cat-sheen" />
                <Sigil color={cat.color} active={isHov || isOpen} />
                <TopOrnament color={cat.color} accent={cat.accent} active={isHov || isOpen} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ position: "relative", "--glow": cat.color, animation: isOpen ? "glowPulse 3s ease infinite" : "none", transition: "all 0.3s" }}>
                      {cat.crown && (
                        <svg width="34" height="20" viewBox="0 0 34 20" style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", filter: `drop-shadow(0 0 4px ${cat.color})`, zIndex: 2 }}>
                          <path d="M3 17 L5 6 L11 12 L17 3 L23 12 L29 6 L31 17 Z" fill={cat.accent} stroke={cat.color} strokeWidth="1" strokeLinejoin="round" />
                          <circle cx="17" cy="3" r="2" fill="#f0e4ff" />
                          <circle cx="5" cy="6" r="1.5" fill="#f0e4ff" />
                          <circle cx="29" cy="6" r="1.5" fill="#f0e4ff" />
                          <rect x="3" y="16" width="28" height="2.5" rx="1" fill={cat.color} />
                        </svg>
                      )}
                      <CrystalGem cat={cat} size={62} idx={ci} />
                    </div>
                    <div>
                      <h2 style={{ ...st.catName, color: cat.color }}>{cat.name}</h2>
                      <p style={st.catSubtitle}>{cat.subtitle}</p>
                      <p style={{ ...st.catPrice, color: cat.accent }}>{cat.price}{cat.priceNote ? <span style={{ color: "#776e90", fontStyle: "italic", marginLeft: 6, fontSize: 12 }}>({cat.priceNote})</span> : null}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {cItems.length > 0 && <span style={{ ...st.badge, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{bookedCount}/{cItems.length}</span>}
                    <span style={{ color: cat.color, fontSize: 22, transition: "transform 0.3s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.7 }}>▾</span>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "10px 0 4px", animation: "fadeUp 0.35s ease" }}>
                  {cItems.length === 0 ? (
                    <p style={st.emptyText}>{isAdmin ? "Додайте подарунок!" : "Поки нічого немає ✨"}</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {cItems.map((item, ii) => {
                        const booked = bookings[item.id];
                        const isMine = booked && savedNick && booked.toLowerCase() === savedNick.toLowerCase();
                        const inBasket = basket.includes(item.id);
                        return (
                          <div key={item.id} className="item-card" style={{
                            ...st.itemCard,
                            borderColor: inBasket ? "rgba(169,120,232,0.5)" : booked ? (isMine ? "rgba(169,120,232,0.3)" : "rgba(100,100,120,0.2)") : cat.border,
                            opacity: booked && !isMine ? 0.55 : 1,
                            animation: `fadeUp 0.4s ease ${ii * 0.06}s both`,
                            ...(item.star === "purple" ? { boxShadow: "0 0 24px rgba(160,60,220,0.18), inset 0 0 24px rgba(160,60,220,0.04)" } : {}),
                          }}>
                            {item.photo && <div style={{ ...st.itemPhoto, backgroundImage: `url(${item.photo})` }} onClick={() => setShowDetailModal(item)} />}
                            <div style={st.itemContent}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <StarFlair star={item.star} />
                                <h3 style={{ ...st.itemName, textDecoration: booked ? "line-through" : "none", color: booked ? "#6a6480" : "#eee" }}>{item.name}</h3>
                                {item.price && <span style={st.priceTag}>💎 {item.price}</span>}
                              </div>
                              {item.description && <p style={st.itemDesc}>{item.description.length > 100 ? item.description.slice(0, 100) + "…" : item.description}</p>}
                              {item.links?.length > 0 && (
                                <div style={st.linksRow}>
                                  {item.links.map((link, li) => (
                                    <a key={li} href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="link-pill"
                                      style={{ ...st.linkPill, borderColor: cat.border, color: cat.color }} onClick={e => e.stopPropagation()}>
                                      🔗 {(() => { try { return new URL(link.startsWith("http") ? link : `https://${link}`).hostname.replace("www.", ""); } catch { return `посилання ${li + 1}`; } })()}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div style={st.itemFooter}>
                                {booked ? (
                                  <div style={st.bookedBadge}>
                                    <span>{isMine ? "🌟 Ваше бронювання" : <>🎀 <strong>{booked}</strong></>}</span>
                                    {(isAdmin || isMine) && <button className="btn" style={st.tinyBtn} onClick={e => { e.stopPropagation(); unbookItem(item.id); }}>скасувати</button>}
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <button className="btn" style={{ ...st.bookBtn, background: cat.color, color: "#140d24" }} onClick={e => { e.stopPropagation(); setShowBookModal(item.id); }}>Забронювати 🎁</button>
                                    <button className="btn" style={{ ...st.basketBtn, borderColor: inBasket ? "#a978e8" : cat.border, color: inBasket ? "#cdb8ff" : cat.color, background: inBasket ? "rgba(169,120,232,0.12)" : "transparent" }}
                                      onClick={e => { e.stopPropagation(); toggleBasketItem(item.id); }}>
                                      {inBasket ? "✓ Кошик" : "+ Кошик"}
                                    </button>
                                  </div>
                                )}
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button className="btn" style={st.detailBtn} onClick={e => { e.stopPropagation(); setShowDetailModal(item); }}>👁</button>
                                  {isAdmin && (<>
                                    <button className="btn" style={st.detailBtn} onClick={e => { e.stopPropagation(); startEdit(item); }}>✏️</button>
                                    <button className="btn" style={{ ...st.detailBtn, color: "#d97a9a" }} onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>🗑</button>
                                  </>)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isAdmin && <button className="btn" style={{ ...st.addInCatBtn, borderColor: cat.border, color: cat.color }}
                    onClick={() => { setNewItem({ name: "", category: cat.id, photo: "", links: [""], description: "", star: "", price: "" }); setEditingItem(null); setShowAddModal(true); }}>+ Додати сюди</button>}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {basket.length > 0 && <button className="basket-fab" onClick={() => setShowBasket(true)} style={st.basketFab}><span style={{ fontSize: 22 }}>🧺</span><span style={st.basketCount}>{basket.length}</span></button>}

      {showBasket && (
        <Overlay onClose={() => setShowBasket(false)}>
          <div style={{ ...st.modal, maxWidth: 500 }}>
            <h2 style={st.modalTitle}>🧺 Кошик чарів</h2>
            {basketItems.length === 0 ? <p style={{ color: "#776e90", fontSize: 15, textAlign: "center", padding: "20px 0" }}>Порожній</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 360, overflow: "auto" }}>
                {basketItems.map(item => {
                  const cat = CATEGORIES.find(c => c.id === item.category);
                  const booked = bookings[item.id];
                  return (
                    <div key={item.id} className="basket-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${booked ? "rgba(100,100,120,0.2)" : cat?.border}`, background: "rgba(255,255,255,0.03)", transition: "all 0.2s" }}>
                      <StarFlair star={item.star} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: booked ? "#6a6480" : "#eee", fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, textDecoration: booked ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                          <span style={{ fontSize: 12, color: cat?.color }}>{cat?.emoji} {cat?.name}</span>
                          {item.price && <span style={{ ...st.priceTag, fontSize: 11, padding: "1px 7px" }}>💎 {item.price}</span>}
                        </div>
                      </div>
                      {booked && <span style={{ fontSize: 11, color: "#d97a9a", whiteSpace: "nowrap" }}>зайнято</span>}
                      <button className="btn" style={{ ...st.tinyBtn, color: "#d97a9a", flexShrink: 0 }} onClick={() => toggleBasketItem(item.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
            {basketAvailable.length > 0 && (<>
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(169,120,232,0.06)", border: "1px solid rgba(169,120,232,0.15)", marginBottom: 14 }}>
                <p style={{ color: "#cdb8ff", fontSize: 14 }}>✨ Буде заброньовано: <strong>{basketAvailable.length}</strong></p>
              </div>
              <label style={st.label}>Ваш нікнейм</label>
              <input style={st.input} placeholder="Нікнейм" value={nickname} onChange={e => setNickname(e.target.value)} onKeyDown={e => e.key === "Enter" && bookBasket()} />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" style={st.primaryBtn} onClick={bookBasket}>Забронювати все 🎁</button>
                <button className="btn" style={st.secondaryBtn} onClick={() => setShowBasket(false)}>Пізніше</button>
              </div>
            </>)}
            {basketAvailable.length === 0 && basketItems.length > 0 && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn" style={st.secondaryBtn} onClick={() => { setBasket([]); setShowBasket(false); }}>Очистити кошик</button>
              </div>
            )}
          </div>
        </Overlay>
      )}

      {showAddModal && (
        <Overlay onClose={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }}>
          <div style={st.modal}>
            <h2 style={st.modalTitle}>{editingItem ? "✏️ Редагувати" : "🔮 Новий подарунок"}</h2>
            <label style={st.label}>Назва *</label>
            <input style={st.input} placeholder="Що бажаєте?" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <label style={st.label}>Самоцвіт (категорія)</label>
            <select style={st.input} value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name} — {c.price}</option>)}
            </select>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={st.label}>Ціна</label><input style={{ ...st.input, marginBottom: 0 }} placeholder="напр. 350 грн" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} /></div>
              <div style={{ flex: 1 }}><label style={st.label}>Зірка</label><select style={{ ...st.input, marginBottom: 0 }} value={newItem.star} onChange={e => setNewItem({ ...newItem, star: e.target.value })}><option value="">— без —</option><option value="yellow">⭐ Хочу!</option><option value="purple">💜 Найбільше тут</option></select></div>
            </div>
            <label style={st.label}>Фото (URL зображення)</label>
            <input style={st.input} placeholder="Правий клік на фото → Копіювати адресу зображення" value={newItem.photo} onChange={e => setNewItem({ ...newItem, photo: e.target.value })} />
            {newItem.photo && <div style={{ margin: "4px 0 10px", borderRadius: 10, overflow: "hidden", maxHeight: 130 }}><img src={newItem.photo} alt="" style={{ width: "100%", objectFit: "cover", maxHeight: 130 }} onError={e => { e.target.style.display = "none"; }} /></div>}
            <label style={st.label}>Посилання / локація</label>
            {newItem.links.map((link, li) => (
              <div key={li} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input style={{ ...st.input, marginBottom: 0, flex: 1 }} placeholder="https://..." value={link} onChange={e => { const nl = [...newItem.links]; nl[li] = e.target.value; setNewItem({ ...newItem, links: nl }); }} />
                {newItem.links.length > 1 && <button className="btn" style={{ ...st.tinyBtn, alignSelf: "center" }} onClick={() => setNewItem({ ...newItem, links: newItem.links.filter((_, i) => i !== li) })}>✕</button>}
              </div>
            ))}
            <button className="btn" style={{ ...st.tinyBtn, marginBottom: 12, color: "#cdb8ff" }} onClick={() => setNewItem({ ...newItem, links: [...newItem.links, ""] })}>+ ще посилання</button>
            <label style={st.label}>Опис</label>
            <textarea style={{ ...st.input, minHeight: 70, resize: "vertical" }} placeholder="Колір, розмір, деталі..." value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn" style={st.primaryBtn} onClick={editingItem ? updateItem : addItem}>{editingItem ? "Зберегти" : "Додати"} ✦</button>
              <button className="btn" style={st.secondaryBtn} onClick={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }}>Скасувати</button>
            </div>
          </div>
        </Overlay>
      )}

      {showJsonModal && (
        <Overlay onClose={() => { setShowJsonModal(false); setJsonText(""); }}>
          <div style={{ ...st.modal, maxWidth: 560 }}>
            <h2 style={st.modalTitle}>📜 Завантажити список (JSON)</h2>
            <p style={{ color: "#aaa3c0", fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
              Встав готовий JSON або обери файл. Кожен елемент: <code style={st.code}>name</code> (обов'язково), <code style={st.code}>category</code>, <code style={st.code}>price</code>, <code style={st.code}>star</code> (<code style={st.code}>purple</code>/<code style={st.code}>yellow</code>/порожньо), <code style={st.code}>photo</code>, <code style={st.code}>description</code>, <code style={st.code}>links</code> (масив).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <button className="btn" style={st.chipBtn} onClick={() => fileInputRef.current?.click()}>📁 Обрати файл</button>
              <button className="btn" style={st.chipBtn} onClick={downloadTemplate}>⬇ Шаблон</button>
              <button className="btn" style={st.chipBtn} onClick={exportCurrent}>📤 Експорт поточних</button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onFilePicked} />
            </div>
            <div style={{ marginBottom: 10, fontSize: 12, color: "#776e90" }}>
              Доступні категорії: {CATEGORIES.map(c => <code key={c.id} style={{ ...st.code, marginRight: 4 }}>{c.id}</code>)}
            </div>
            <textarea
              style={{ ...st.input, minHeight: 180, resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 }}
              placeholder={`{\n  "items": [\n    { "name": "Подарунок", "category": "amethyst", "price": "1200 грн", "star": "purple", "links": ["https://..."] }\n  ]\n}`}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
            />
            <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "6px 0 14px", flexWrap: "wrap" }}>
              <span style={{ ...st.label, marginBottom: 0 }}>Режим:</span>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: jsonMode === "merge" ? "#cdb8ff" : "#888", cursor: "pointer" }}>
                <input type="radio" name="jsonmode" checked={jsonMode === "merge"} onChange={() => setJsonMode("merge")} style={{ accentColor: "#a978e8" }} /> Додати до наявних
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: jsonMode === "replace" ? "#d97a9a" : "#888", cursor: "pointer" }}>
                <input type="radio" name="jsonmode" checked={jsonMode === "replace"} onChange={() => setJsonMode("replace")} style={{ accentColor: "#d97a9a" }} /> Замінити все
              </label>
            </div>
            {jsonMode === "replace" && <p style={{ color: "#d97a9a", fontSize: 13, marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(217,122,154,0.08)", border: "1px solid rgba(217,122,154,0.2)" }}>⚠ Замінить усі подарунки та скине бронювання.</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" style={st.primaryBtn} onClick={importJson}>Завантажити 🔮</button>
              <button className="btn" style={st.secondaryBtn} onClick={() => { setShowJsonModal(false); setJsonText(""); }}>Скасувати</button>
            </div>
          </div>
        </Overlay>
      )}

      {showBookModal && (
        <Overlay onClose={() => setShowBookModal(null)}>
          <div style={st.modal}>
            <h2 style={st.modalTitle}>🎀 Забронювати</h2>
            {savedNick && myBookings.length > 0 && (
              <p style={{ color: "#cdb8ff", fontSize: 14, marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(169,120,232,0.08)", border: "1px solid rgba(169,120,232,0.15)" }}>
                🌟 {savedNick}: вже {myBookings.length} подарунк{myBookings.length === 1 ? "ок" : myBookings.length < 5 ? "и" : "ів"}
              </p>
            )}
            <input style={st.input} placeholder="Ваш нікнейм" value={nickname} onChange={e => setNickname(e.target.value)} onKeyDown={e => e.key === "Enter" && bookSingle(showBookModal)} autoFocus />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" style={st.primaryBtn} onClick={() => bookSingle(showBookModal)}>Підтвердити 🎁</button>
              <button className="btn" style={st.secondaryBtn} onClick={() => setShowBookModal(null)}>Скасувати</button>
            </div>
          </div>
        </Overlay>
      )}

      {showDetailModal && (() => {
        const cat = CATEGORIES.find(c => c.id === showDetailModal.category);
        const booked = bookings[showDetailModal.id];
        const isMine = booked && savedNick && booked.toLowerCase() === savedNick.toLowerCase();
        const inBasket = basket.includes(showDetailModal.id);
        return (
          <Overlay onClose={() => setShowDetailModal(null)}>
            <div style={{ ...st.modal, maxWidth: 520 }}>
              {showDetailModal.photo && <div style={{ margin: "-24px -24px 16px", borderRadius: "18px 18px 0 0", overflow: "hidden", maxHeight: 260 }}><img src={showDetailModal.photo} alt="" style={{ width: "100%", objectFit: "cover", maxHeight: 260 }} /></div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><StarFlair star={showDetailModal.star} /><h2 style={{ ...st.modalTitle, marginBottom: 4 }}>{showDetailModal.name}</h2></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 12 }}><CrystalGem cat={cat} size={30} /><span style={{ fontSize: 13, color: "#776e90" }}>{cat?.name}</span></div>
              </div>
              {showDetailModal.price && <p style={{ ...st.priceTag, display: "inline-block", marginTop: 6, fontSize: 15, padding: "4px 14px" }}>💎 {showDetailModal.price}</p>}
              {showDetailModal.description && <p style={{ color: "#bbb3d0", fontSize: 15, lineHeight: 1.6, margin: "14px 0" }}>{showDetailModal.description}</p>}
              {showDetailModal.links?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
                  {showDetailModal.links.map((link, li) => (
                    <a key={li} href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="link-pill" style={{ ...st.linkPill, borderColor: cat?.border, color: cat?.color }}>
                      🔗 {(() => { try { return new URL(link.startsWith("http") ? link : `https://${link}`).hostname.replace("www.", ""); } catch { return link.length > 30 ? link.slice(0, 30) + "…" : link; } })()}
                    </a>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: booked ? (isMine ? "rgba(169,120,232,0.08)" : "rgba(217,122,154,0.08)") : "rgba(120,200,150,0.06)", border: `1px solid ${booked ? (isMine ? "rgba(169,120,232,0.2)" : "rgba(217,122,154,0.2)") : "rgba(120,200,150,0.15)"}` }}>
                {booked ? <span style={{ color: isMine ? "#cdb8ff" : "#d97a9a", fontSize: 15 }}>{isMine ? "🌟 Ваше бронювання" : <>🎀 <strong>{booked}</strong></>}</span>
                  : <span style={{ color: "#8dce8d", fontSize: 15 }}>✅ Доступний</span>}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {!booked && <button className="btn" style={st.primaryBtn} onClick={() => { setShowBookModal(showDetailModal.id); setShowDetailModal(null); }}>Забронювати 🎁</button>}
                {!booked && <button className="btn" style={{ ...st.secondaryBtn, borderColor: inBasket ? "rgba(169,120,232,0.4)" : "rgba(255,255,255,0.1)", color: inBasket ? "#cdb8ff" : "#aaa" }} onClick={() => { toggleBasketItem(showDetailModal.id); showToast(inBasket ? "Прибрано" : "Додано в кошик 🧺"); }}>{inBasket ? "✓ Кошик" : "+ Кошик"}</button>}
                {(isAdmin || isMine) && booked && <button className="btn" style={{ ...st.secondaryBtn, borderColor: "rgba(217,122,154,0.3)", color: "#d97a9a" }} onClick={() => { unbookItem(showDetailModal.id); setShowDetailModal(null); }}>Скасувати</button>}
                <button className="btn" style={st.secondaryBtn} onClick={() => setShowDetailModal(null)}>Закрити</button>
              </div>
            </div>
          </Overlay>
        );
      })()}

      <footer style={st.footer}>
        <div style={st.footerLine} />
        <p style={st.footerText}>{(items || []).length === 0 ? "Очікуйте подарунки! ✨" : `${Object.keys(bookings || {}).length} з ${items.length} заброньовано`}</p>
        <p style={{ ...st.footerText, fontSize: 11, opacity: 0.35, marginTop: 6 }}>зіткано з 💜 та місячного світла</p>
      </footer>

      {toast && <div style={{ ...st.toast, background: toast.type === "error" ? "#2a1424" : "#1a2420", borderColor: toast.type === "error" ? "#d97a9a" : "#5a9a6a", color: toast.type === "error" ? "#f0b0c0" : "#a0e0b0" }}>{toast.msg}</div>}
    </div>
  );
}

const st = {
  app: { minHeight: "100vh", background: "radial-gradient(ellipse at 70% 0%, #1a1230 0%, #0d0a1c 45%, #08060f 100%)", color: "#eee", fontFamily: "'Raleway',sans-serif", position: "relative", overflow: "hidden" },
  loadingScreen: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#08060f", gap: 16 },
  loadingSpinner: { width: 32, height: 32, border: "3px solid rgba(169,120,232,0.2)", borderTopColor: "#a978e8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: { textAlign: "center", padding: "44px 20px 24px", position: "relative", zIndex: 2 },
  headerDecor: { fontSize: 16, color: "#cdb8ff", opacity: 0.4, marginBottom: 8, animation: "breathe 4s ease infinite", letterSpacing: 14 },
  title: { fontFamily: "'Cinzel',serif", fontSize: "clamp(36px, 8.5vw, 60px)", fontWeight: 800, letterSpacing: 2, lineHeight: 1.1, animation: "fadeUp 0.6s ease, titleShimmer 6s ease infinite", background: "linear-gradient(110deg, #ffffff 20%, #cdb8ff 45%, #a978e8 70%, #e8dcff 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 24px rgba(169,120,232,0.3))" },
  subtitle: { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(18px, 3.8vw, 27px)", color: "#cdb8ff", fontStyle: "italic", marginTop: 8, animation: "fadeUp 0.6s ease 0.1s both" },
  headerLine: { width: 60, height: 1, background: "linear-gradient(90deg, transparent, #a978e8, transparent)", margin: "22px auto 16px" },
  headerNote: { color: "#9a92b0", fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.6, animation: "fadeUp 0.6s ease 0.2s both" },
  legend: { display: "inline-flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, padding: "8px 18px", borderRadius: 20, background: "rgba(169,120,232,0.06)", border: "1px solid rgba(169,120,232,0.14)", fontSize: 13, color: "#aaa3c0", animation: "fadeUp 0.6s ease 0.25s both" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 5 },
  legendPrio: { fontSize: 11, color: "#776e90", fontStyle: "italic" },
  legendDot: { color: "#554f6a" },
  myBookings: { marginTop: 14, fontSize: 15, padding: "10px 20px", borderRadius: 12, background: "rgba(169,120,232,0.06)", border: "1px solid rgba(169,120,232,0.12)", display: "inline-block" },
  adminArea: { marginTop: 14, animation: "fadeIn 0.5s ease 0.3s both" },
  adminCodeInput: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(169,120,232,0.3)", borderRadius: 8, padding: "8px 12px", color: "#eee", fontSize: 14, width: 130 },
  smallBtn: { background: "rgba(169,120,232,0.15)", border: "1px solid rgba(169,120,232,0.3)", borderRadius: 8, padding: "7px 16px", color: "#cdb8ff", fontSize: 13, fontWeight: 600 },
  chipBtn: { background: "rgba(169,120,232,0.1)", border: "1px solid rgba(169,120,232,0.25)", borderRadius: 20, padding: "7px 16px", color: "#cdb8ff", fontSize: 13, fontWeight: 600 },
  code: { background: "rgba(169,120,232,0.12)", border: "1px solid rgba(169,120,232,0.2)", borderRadius: 5, padding: "1px 6px", fontSize: 12, color: "#cdb8ff", fontFamily: "monospace" },
  main: { maxWidth: 860, margin: "0 auto", padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 },
  catCard: { padding: "26px 28px 20px", borderRadius: 18, border: "1px solid", transition: "all 0.3s ease", backdropFilter: "blur(2px)", position: "relative", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" },
  catName: { fontFamily: "'Cinzel',serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5 },
  catSubtitle: { color: "#776e90", fontSize: 14, fontStyle: "italic", marginTop: 2, fontFamily: "'Cormorant Garamond',serif" },
  catPrice: { fontSize: 15, fontWeight: 600, marginTop: 4, letterSpacing: 0.5 },
  badge: { fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 20 },
  emptyText: { color: "#555068", fontSize: 16, textAlign: "center", padding: "28px 0", fontStyle: "italic" },
  itemCard: { background: "rgba(255,255,255,0.025)", border: "1px solid", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(2px)" },
  itemPhoto: { height: 180, backgroundSize: "cover", backgroundPosition: "center", cursor: "pointer" },
  itemContent: { padding: "16px 20px" },
  itemName: { fontFamily: "'Cormorant Garamond',serif", fontSize: 23, fontWeight: 600, lineHeight: 1.3 },
  itemDesc: { color: "#9a92b0", fontSize: 14, lineHeight: 1.6, marginTop: 6 },
  priceTag: { background: "rgba(169,120,232,0.1)", border: "1px solid rgba(169,120,232,0.2)", borderRadius: 8, padding: "2px 9px", fontSize: 14, color: "#cdb8ff", fontWeight: 600, whiteSpace: "nowrap" },
  linksRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  linkPill: { fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", textDecoration: "none", whiteSpace: "nowrap", fontFamily: "'Raleway',sans-serif" },
  itemFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 8, flexWrap: "wrap" },
  bookedBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#cdb8ff", flexWrap: "wrap" },
  bookBtn: { border: "none", borderRadius: 10, padding: "9px 20px", fontFamily: "'Raleway',sans-serif", fontWeight: 700, fontSize: 14 },
  basketBtn: { border: "1px solid", borderRadius: 10, padding: "8px 14px", fontFamily: "'Raleway',sans-serif", fontWeight: 600, fontSize: 13, background: "transparent" },
  detailBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "7px 11px", fontSize: 14 },
  tinyBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 10px", color: "#aaa", fontSize: 12, fontFamily: "'Raleway',sans-serif" },
  addInCatBtn: { width: "100%", padding: "14px", border: "1px dashed", borderRadius: 14, background: "transparent", fontFamily: "'Raleway',sans-serif", fontSize: 14, fontWeight: 600, marginTop: 12 },
  basketFab: { position: "fixed", bottom: 24, right: 24, width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(135deg, #a978e8, #6e4ab8)", border: "2px solid rgba(169,120,232,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 100, animation: "borderGlow 2s ease infinite", transition: "all 0.2s ease" },
  basketCount: { position: "absolute", top: -4, right: -4, background: "#d97a9a", color: "#fff", fontSize: 12, fontWeight: 700, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  footer: { textAlign: "center", padding: "20px 20px 40px", position: "relative", zIndex: 2 },
  footerLine: { width: 40, height: 1, background: "linear-gradient(90deg, transparent, rgba(169,120,232,0.3), transparent)", margin: "0 auto 16px" },
  footerText: { color: "#555068", fontSize: 14 },
  overlay: { position: "fixed", inset: 0, background: "rgba(8,6,18,0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000, animation: "fadeIn 0.2s ease" },
  modal: { background: "linear-gradient(170deg, #1a1430, #110d22)", border: "1px solid rgba(169,120,232,0.22)", borderRadius: 18, padding: 24, maxWidth: 480, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(20,8,40,0.6)" },
  modalTitle: { fontFamily: "'Cinzel',serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: 0.5 },
  label: { display: "block", color: "#9a92b0", fontSize: 12, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#eee", fontSize: 15, fontFamily: "'Raleway',sans-serif", marginBottom: 14, transition: "all 0.2s ease" },
  primaryBtn: { background: "linear-gradient(135deg, #a978e8, #6e4ab8)", border: "none", borderRadius: 10, padding: "11px 24px", color: "#fff", fontFamily: "'Raleway',sans-serif", fontWeight: 700, fontSize: 15, flex: 1 },
  secondaryBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 20px", color: "#aaa", fontFamily: "'Raleway',sans-serif", fontWeight: 600, fontSize: 15 },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "11px 24px", borderRadius: 12, border: "1px solid", fontSize: 15, fontFamily: "'Raleway',sans-serif", fontWeight: 600, zIndex: 2000, animation: "toastIn 0.3s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" },
  connError: { position: "relative", zIndex: 3, maxWidth: 620, margin: "16px auto 0", padding: "12px 18px", borderRadius: 12, background: "rgba(217,122,154,0.12)", border: "1px solid rgba(217,122,154,0.4)", color: "#f0b0c0", fontSize: 14, fontWeight: 600, textAlign: "center", fontFamily: "'Raleway',sans-serif" },
};
