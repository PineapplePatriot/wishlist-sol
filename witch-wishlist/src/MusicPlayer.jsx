import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Place your MP3 files in /public/music/
 * Then list them here with display names.
 * Example file structure:
 *   public/
 *     music/
 *       fatui-ambience.mp3
 *       snezhnaya-nights.mp3
 *       harbinger-waltz.mp3
 */
const TRACKS = [
  { src: "music/Historic Drama - The Midnight Waltz.mp3", title: "Інтрига 1" },
  { src: "music/Cunning Banker - The Merchant's Ledger.mp3", title: "Панталоне" },
  { src: "music/Sumerian Heretic - The Alchemist's Game.mp3", title: "Дотторе" },
  { src: "music/Smooth Jazz - Shadows in the Smoke.mp3", title: "Джаз" },
  { src: "music/Winter Walk - Whispers in the Snow.mp3", title: "Зимовий ранок" },
  { src: "music/Latin Ballad - Nocte Sanguinis.mp3", title: "Балада" },
  { src: "music/Victorian Intrigue - The Devil's Waltz.mp3", title: "Інтрига 2" },
  { src: "music/Cyberpunk - Echoes of the Mall.mp3", title: "Кіберпанк" },
  { src: "music/Desert Song - A Night in the Desert.mp3", title: "Пустельний танець" },
  { src: "music/Ambient Guzheng - Moonlit Whispers.mp3", title: "Чарівна гуцінь" },
  { src: "music/Fantasy Battle - Shadows of the Fates.mp3", title: "Епічна баталія" },
  { src: "music/Morning in a Garden - Luce del Mattino.mp3", title: "Італійський ранок" }
  // Add as many as you want! Just drop files in public/music/
];

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const track = TRACKS[trackIdx];

  const play = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) pause(); else play();
  }, [playing, play, pause]);

  const changeTrack = useCallback((newIdx) => {
    const idx = (newIdx + TRACKS.length) % TRACKS.length;
    setTrackIdx(idx);
    setProgress(0);
    setLoaded(false);
    // Will auto-play in onLoadedData if was playing
  }, []);

  const next = useCallback(() => changeTrack(trackIdx + 1), [trackIdx, changeTrack]);
  const prev = useCallback(() => changeTrack(trackIdx - 1), [trackIdx, changeTrack]);

  // Update progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime);
    const onDuration = () => { setDuration(audio.duration); setLoaded(true); };
    const onEnded = () => next(); // Auto-advance to next track
    const onLoad = () => {
      setDuration(audio.duration || 0);
      setLoaded(true);
      if (playing) audio.play().catch(() => {});
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("loadeddata", onLoad);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("loadeddata", onLoad);
      audio.removeEventListener("ended", onEnded);
    };
  }, [trackIdx, playing, next]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current && duration) {
      audioRef.current.currentTime = pct * duration;
      setProgress(pct * duration);
    }
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Collapsed: just a button
  if (!showPlayer) {
    return (
      <button
        className="btn music-btn"
        onClick={() => { setShowPlayer(true); }}
        style={styles.toggleBtn}
      >
        🎵 Музика
      </button>
    );
  }

  return (
    <div style={styles.player}>
      <audio ref={audioRef} src={track?.src} preload="metadata" />

      {/* Header row with close */}
      <div style={styles.header}>
        <span style={styles.nowPlaying}>
          {playing ? "🎵" : "🔇"} {track?.title || "—"}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={styles.trackNum}>{trackIdx + 1}/{TRACKS.length}</span>
          <button
            className="btn"
            onClick={() => { pause(); setShowPlayer(false); }}
            style={styles.closeBtn}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button className="btn" onClick={prev} style={styles.controlBtn}>⏮</button>
        <button className="btn" onClick={togglePlay} style={styles.playBtn}>
          {playing ? "⏸" : "▶"}
        </button>
        <button className="btn" onClick={next} style={styles.controlBtn}>⏭</button>
      </div>

      {/* Progress bar */}
      <div style={styles.progressRow}>
        <span style={styles.time}>{fmt(progress)}</span>
        <div style={styles.progressTrack} onClick={seek}>
          <div
            style={{
              ...styles.progressFill,
              width: duration ? `${(progress / duration) * 100}%` : "0%",
            }}
          />
          {duration > 0 && (
            <div
              style={{
                ...styles.progressThumb,
                left: `${(progress / duration) * 100}%`,
              }}
            />
          )}
        </div>
        <span style={styles.time}>{fmt(duration)}</span>
      </div>

      {/* Volume */}
      <div style={styles.volumeRow}>
        <span style={{ fontSize: 12, opacity: 0.6 }}>{volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={styles.volumeSlider}
        />
      </div>

      {/* Track list */}
      {TRACKS.length > 1 && (
        <div style={styles.trackList}>
          {TRACKS.map((t, i) => (
            <button
              key={i}
              className="btn"
              onClick={() => { changeTrack(i); if (!playing) play(); }}
              style={{
                ...styles.trackItem,
                color: i === trackIdx ? "#d4a853" : "#888",
                background: i === trackIdx ? "rgba(212,168,83,0.1)" : "transparent",
                borderColor: i === trackIdx ? "rgba(212,168,83,0.25)" : "rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.5, width: 18 }}>{i + 1}.</span>
              <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.title}
              </span>
              {i === trackIdx && playing && <span style={{ fontSize: 10, animation: "pulse 1.5s ease infinite" }}>♪</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  toggleBtn: {
    background: "rgba(212,168,83,0.1)",
    border: "1px solid rgba(212,168,83,0.25)",
    borderRadius: 20,
    padding: "8px 20px",
    color: "#d4a853",
    fontSize: 13,
    fontFamily: "'Raleway',sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  player: {
    background: "rgba(10,10,20,0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(212,168,83,0.2)",
    borderRadius: 16,
    padding: "14px 18px",
    maxWidth: 320,
    margin: "16px auto 0",
    animation: "fadeUp 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  nowPlaying: {
    fontSize: 14,
    fontFamily: "'Playfair Display',serif",
    fontWeight: 600,
    color: "#eee",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    marginRight: 8,
  },
  trackNum: {
    fontSize: 11,
    color: "#666",
    fontFamily: "'Raleway',sans-serif",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "2px 8px",
    color: "#888",
    fontSize: 12,
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
  },
  controlBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 14,
    color: "#ccc",
    cursor: "pointer",
  },
  playBtn: {
    background: "linear-gradient(135deg, #d4a853, #b8903f)",
    border: "none",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#0a0a14",
    cursor: "pointer",
  },
  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    color: "#666",
    fontFamily: "'Raleway',sans-serif",
    fontVariantNumeric: "tabular-nums",
    minWidth: 32,
    textAlign: "center",
  },
  progressTrack: {
    flex: 1,
    height: 4,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    cursor: "pointer",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #d4a853, #f5d380)",
    borderRadius: 2,
    transition: "width 0.1s linear",
  },
  progressThumb: {
    position: "absolute",
    top: -3,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#d4a853",
    transform: "translateX(-50%)",
    boxShadow: "0 0 6px rgba(212,168,83,0.4)",
    transition: "left 0.1s linear",
  },
  volumeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  volumeSlider: {
    flex: 1,
    height: 3,
    WebkitAppearance: "none",
    appearance: "none",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    outline: "none",
    cursor: "pointer",
    accentColor: "#d4a853",
  },
  trackList: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    maxHeight: 140,
    overflow: "auto",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  trackItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 8,
    border: "1px solid",
    background: "transparent",
    fontSize: 13,
    fontFamily: "'Raleway',sans-serif",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
  },
};
