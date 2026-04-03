import { useState, useEffect, useRef } from "react";

// ─── TYPES ────────────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard";
type Operation = "+" | "−" | "×";
type FlashType = "ok" | "err" | null;
type PlayerIndex = 0 | 1;

interface Question {
  a: number;
  b: number;
  op: Operation;
  ans: number;
}

interface PlayerStats {
  wins: number;
  losses: number;
  games: number;
  streak: number;
  bestStreak: number;
}

interface Stats {
  [key: string]: PlayerStats;
}

interface PlayerNames {
  player1: string;
  player2: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────
const C1 = "#22d3ee";
const C2 = "#fb7185";
const WIN_POS = 100;
const PULL = 13;
const BEST_OF = 3;
const STATS_KEY = "hisab_stats_v2";
const NAMES_KEY = "hisab_names";

const DIFFS: Record<Difficulty, { label: string; note: string; ops: Operation[] }> = {
  easy: { label: "आसान", note: "सिर्फ जोड़", ops: ["+"] },
  medium: { label: "मध्यम", note: "जोड़ और घटाव", ops: ["+", "−"] },
  hard: { label: "कठिन", note: "सभी ऑपरेशन", ops: ["+", "−", "×"] },
};

const MSG = {
  round: [
    "शाबाश! आगे बढ़ो! 🎯",
    "वाह! तेज़ दिमाग! ⚡",
    "ज़बरदस्त! रुकना मत! 🔥",
    "क्या बात है! 💪",
    "गणित का उस्ताद! 🎓",
  ],
  win: [
    "असली गणित का राजा! 👑",
    "अजेय चैम्पियन! 🏆",
    "गुरु हो यार! ⭐",
    "बेमिसाल खिलाड़ी! 🌟",
    "दिल जीत लिया! 🎊",
  ],
  lose: [
    "हार से मत घबराओ! 💫",
    "अगली बार तुम्हारी बारी! 🎯",
    "हिम्मत रखो! 💪",
    "कोशिश जारी रखो! 🚀",
  ],
  cd: ["तैयार हो जाओ!", "लड़ाई शुरू!", "जाओ!"],
  streak: [
    "लगातार जा रहे हो! 🔥",
    "तूफ़ान हो तुम! ⚡",
    "कोई रोक नहीं सकता! 🚀",
  ],
  perfect: [
    "बिल्कुल सही! 🎯",
    "वाह! क्या बात है! ⭐",
    "शानदार जवाब! 💯",
    "कमाल कर दिया! 🔥",
  ],
  bonus: [
    "बोनस पुल! 💪",
    "ज़बरदस्त खिंचाव! ⚡",
    "बढ़त ले लो! 🚀",
  ]
};

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── STATS ────────────────────────────────────────────────────────
function loadStats(): Stats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : {};
  }
  catch { return {}; }
}

function saveStats(stats: Stats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function recordGameWin(winner: string, loser: string): void {
  const s = loadStats();

  if (!s[winner]) {
    s[winner] = { wins: 0, losses: 0, games: 0, streak: 0, bestStreak: 0 };
  }
  if (!s[loser]) {
    s[loser] = { wins: 0, losses: 0, games: 0, streak: 0, bestStreak: 0 };
  }

  s[winner].wins++;
  s[winner].games++;
  s[winner].streak++;
  s[winner].bestStreak = Math.max(s[winner].bestStreak, s[winner].streak);

  s[loser].losses++;
  s[loser].games++;
  s[loser].streak = 0;

  saveStats(s);
}

// ─── QUESTION GEN ─────────────────────────────────────────────────
function genQ(diff: Difficulty): Question {
  const ops = DIFFS[diff].ops;
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === "+") {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    return { a, b, op, ans: a + b };
  }
  if (op === "−") {
    const b = Math.floor(Math.random() * 8) + 2;
    const ans = Math.floor(Math.random() * 8) + 2;
    return { a: ans + b, b, op, ans };
  }
  const a = Math.floor(Math.random() * 7) + 2;
  const b = Math.floor(Math.random() * 7) + 2;
  return { a, b, op, ans: a * b };
}

function useMobile(): boolean {
  const [m, setM] = useState<boolean>(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

function burst(color: string): void {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d")!;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    c: string;
    ro: number;
    rv: number;
    lf: number;
  }

  const ps: Particle[] = Array.from({ length: 130 }, () => ({
    x: Math.random() * cv.width,
    y: Math.random() * cv.height * 0.4,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -14 - 2,
    r: Math.random() * 5 + 2,
    c: [color, "#fff", "#fbbf24"][Math.floor(Math.random() * 3)],
    ro: Math.random() * Math.PI * 2,
    rv: (Math.random() - 0.5) * 0.3,
    lf: 1,
  }));

  let id: number;
  const tick = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    for (const p of ps) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38;
      p.ro += p.rv;
      p.lf -= 0.013;
      if (p.lf <= 0) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.lf;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ro);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    }
    alive ? (id = requestAnimationFrame(tick)) : (cancelAnimationFrame(id), cv.remove());
  };
  id = requestAnimationFrame(tick);
}

// ─── PAD ─────────────────────────────────────────────────────────
const PAD_ROWS: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
];

interface PadProps {
  onKey: (key: string) => void;
  color: string;
}

function Pad({ onKey, color }: PadProps) {
  return (
    <div style={{
      flex: "1 1 0",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      marginTop: 5,
    }}>
      {PAD_ROWS.map((row, ri) => (
        <div key={ri} style={{ flex: "1 1 0", display: "flex", gap: 4 }}>
          {row.map(k => {
            const isCtrl = k === "C" || k === "⌫";
            return (
              <button
                key={k}
                onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onKey(k); }}
                style={{
                  flex: k === "0" ? 2 : 1,
                  borderRadius: 9,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: "clamp(12px, 3.8vw, 18px)",
                  background: isCtrl ? "rgba(255,255,255,0.05)" : color + "18",
                  border: `1px solid ${isCtrl ? "rgba(255,255,255,0.08)" : color + "2e"}`,
                  color: isCtrl ? "#64748b" : "#e2e8f0",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                  touchAction: "none",
                  fontFamily: "monospace",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────
interface CardProps {
  playerName: string;
  question: Question;
  input: string;
  onKey: (key: string) => void;
  color: string;
  flash: FlashType;
  score: number;
  streak: number;
  message?: string | null;
}

function Card({ playerName, question, input, onKey, color, flash, score, streak, message }: CardProps) {
  const borderCol = flash === "ok" ? color : flash === "err" ? "#ef4444" : color + "1e";
  const glow = flash === "ok"
    ? `0 0 18px ${color}44`
    : flash === "err"
      ? "0 0 18px #ef444433"
      : "none";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", boxSizing: "border-box",
      padding: "7px 7px 6px",
      background: color + "09",
      border: `1px solid ${borderCol}`,
      borderRadius: 14,
      boxShadow: glow,
      transition: "border-color 0.15s, box-shadow 0.15s",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 3, flexShrink: 0, height: 22,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          <span style={{
            color, opacity: 0.85, fontWeight: 800,
            fontSize: "clamp(9px,2.5vw,11px)", letterSpacing: "0.06em",
            textTransform: "uppercase", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90,
          }}>
            {playerName}
          </span>
          {streak >= 3 && (
            <span style={{
              fontSize: 8, fontWeight: 900, padding: "1px 4px",
              borderRadius: 99, background: color + "22",
              color, border: `1px solid ${color}40`, flexShrink: 0,
            }}>
              🔥{streak}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          {Array.from({ length: BEST_OF }).map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i < score ? color : "rgba(255,255,255,0.1)",
              border: `1px solid ${color}35`,
              transition: "background 0.2s",
            }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ textAlign: "center", flexShrink: 0, padding: "2px 0" }}>
        <span style={{
          color, fontFamily: "monospace",
          fontSize: "clamp(22px, 6vw, 36px)",
          fontWeight: 900, letterSpacing: 2,
        }}>
          {question.a} {question.op} {question.b}
        </span>
      </div>

      {/* Input display */}
      <div style={{
        background: "rgba(0,0,0,0.32)",
        border: `1px solid ${flash === "err" ? "#ef444450" : color + "1e"}`,
        borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "monospace", fontWeight: 800, flexShrink: 0,
        fontSize: "clamp(18px, 4.5vw, 26px)",
        height: 40,
        color: flash === "err" ? "#ef4444" : "#fff",
        transition: "color 0.15s, border-color 0.15s",
      }}>
        {input || <span style={{ opacity: 0.18 }}>?</span>}
      </div>

      {/* Message toast */}
      {message && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(8px)",
          padding: "6px 12px",
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700,
          color: color,
          border: `1px solid ${color}`,
          whiteSpace: "nowrap",
          zIndex: 20,
          animation: "fadeOut 1s ease-out forwards",
          pointerEvents: "none",
        }}>
          {message}
        </div>
      )}

      {/* Pad fills all remaining space */}
      <Pad onKey={onKey} color={color} />
    </div>
  );
}

// ─── ROPE ─────────────────────────────────────────────────────────
interface RopeProps {
  pos: number;
}

function Rope({ pos }: RopeProps) {
  const pct = 50 + (pos / WIN_POS) * 42;
  const ac = pos < 0 ? C1 : C2;
  return (
    <div style={{ position: "relative", width: "100%", padding: "3px 0" }}>
      <div style={{
        position: "relative", height: 5, borderRadius: 99,
        margin: "0 18px", background: "rgba(255,255,255,0.07)",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 99,
          background: `linear-gradient(to right,${C1},#fff 50%,${C2})`,
        }} />
        <div style={{
          position: "absolute", top: "50%", zIndex: 10,
          left: `${Math.min(93, Math.max(7, pct))}%`,
          transform: "translate(-50%,-50%)",
          transition: "left 0.28s ease",
        }}>
          <div style={{
            width: 18, height: 18, background: "white",
            borderRadius: 4, transform: "rotate(45deg)",
            border: "2px solid #060a18",
            boxShadow: `0 0 10px ${ac}90`,
          }} />
        </div>
      </div>
    </div>
  );
}

function RopeMeter({ pos }: RopeProps) {
  const w = Math.max(2, Math.min(98, ((pos + WIN_POS) / (WIN_POS * 2)) * 100));
  return (
    <div style={{
      height: 3, borderRadius: 99, overflow: "hidden",
      background: "rgba(255,255,255,0.06)", margin: "0 4px",
    }}>
      <div style={{
        height: "100%", borderRadius: 99, width: `${w}%`,
        background: `linear-gradient(to right,${C1},white 50%,${C2})`,
        transition: "width 0.3s ease",
      }} />
    </div>
  );
}

// ─── NAME MODAL ───────────────────────────────────────────────────
interface NameModalProps {
  names: PlayerNames;
  onSave: (names: PlayerNames) => void;
}

function NameModal({ names, onSave }: NameModalProps) {
  const [p1, setP1] = useState(names.player1);
  const [p2, setP2] = useState(names.player2);

  const save = () => onSave({
    player1: p1.trim() || "Player 1",
    player2: p2.trim() || "Player 2",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(0,0,0,0.97)", backdropFilter: "blur(10px)",
    }}>
      <div style={{
        background: "#0c1525", border: "1px solid #1a2540",
        borderRadius: 22, width: "100%", maxWidth: 320, padding: "22px 18px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            fontSize: 48, marginBottom: 6,
            filter: "drop-shadow(0 0 20px rgba(34,211,238,0.4))",
          }}>⚔️</div>
          <h2 style={{
            color: "#fff", fontWeight: 900, fontSize: 22,
            margin: "0 0 4px", letterSpacing: "-0.02em",
          }}>HISAB-RASSA</h2>
          <p style={{
            color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0,
            letterSpacing: "0.15em",
          }}>गणित का रस्साकशी</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{
              display: "block", fontSize: 10,
              letterSpacing: "0.08em", color: C1, marginBottom: 5, fontWeight: 700,
            }}>खिलाड़ी 1 (नीला)</label>
            <input
              value={p1}
              onChange={e => setP1(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") document.getElementById("p2-input")?.focus(); }}
              placeholder="Player 1"
              maxLength={14}
              autoFocus
              style={{
                width: "100%", padding: "11px 13px", borderRadius: 11,
                background: "rgba(255,255,255,0.07)", border: `1.5px solid ${C1}44`,
                color: "#fff", fontSize: 15, outline: "none",
                boxSizing: "border-box", fontWeight: 600,
              }}
            />
          </div>
          <div>
            <label style={{
              display: "block", fontSize: 10,
              letterSpacing: "0.08em", color: C2, marginBottom: 5, fontWeight: 700,
            }}>खिलाड़ी 2 (लाल)</label>
            <input
              id="p2-input"
              value={p2}
              onChange={e => setP2(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); }}
              placeholder="Player 2"
              maxLength={14}
              style={{
                width: "100%", padding: "11px 13px", borderRadius: 11,
                background: "rgba(255,255,255,0.07)", border: `1.5px solid ${C2}44`,
                color: "#fff", fontSize: 15, outline: "none",
                boxSizing: "border-box", fontWeight: 600,
              }}
            />
          </div>
          <button
            onClick={save}
            style={{
              background: `linear-gradient(135deg,${C1},${C2})`,
              color: "#fff", fontWeight: 900, padding: "13px 0",
              borderRadius: 12, fontSize: 15, border: "none", cursor: "pointer",
              marginTop: 2,
            }}
          >
            ⚡ आगे बढ़ो
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STATS MODAL ──────────────────────────────────────────────────
interface StatsModalProps {
  names: PlayerNames;
  onClose: () => void;
}

function StatsModal({ names, onClose }: StatsModalProps) {
  const [stats, setStats] = useState<Stats>(() => loadStats());

  const refreshStats = () => {
    setStats(loadStats());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const getMsg = (s?: PlayerStats): string => {
    if (!s || s.games === 0) return "अभी खेलना शुरू करें! 🎮";
    const r = s.wins / s.games;
    if (r >= 0.8) return "छा गए हो! तुम अजेय हो! 👑";
    if (r >= 0.6) return "शानदार! आगे बढ़ते रहो! 🔥";
    if (r >= 0.4) return "अच्छा प्रयास! मेहनत जारी रखो! 💪";
    return "हार मत मानो! अभ्यास से सब होता है! 🌱";
  };

  const clearAll = () => {
    if (window.confirm("सभी आंकड़े हमेशा के लिए मिटा दें?")) {
      localStorage.removeItem(STATS_KEY);
      refreshStats();
      onClose();
    }
  };

  const players = [
    { name: names.player1, color: C1, emoji: "🔵" },
    { name: names.player2, color: C2, emoji: "🔴" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(14px)",
    }}>
      <div style={{
        background: "#0c1525", border: "1px solid #1a2540",
        borderRadius: 22, width: "100%", maxWidth: 340,
        padding: "18px 16px", maxHeight: "88dvh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 16,
        }}>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0 }}>
            📊 खेल आंकड़े
          </h2>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)", width: 30, height: 30,
            borderRadius: 8, cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Comparison bar */}
        {(() => {
          const s1 = stats[names.player1];
          const s2 = stats[names.player2];
          const w1 = s1?.wins || 0;
          const w2 = s2?.wins || 0;
          const total = w1 + w2;
          if (total === 0) return null;
          const pct1 = Math.round((w1 / total) * 100);
          return (
            <div style={{
              marginBottom: 14, padding: "10px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 11,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 6, fontSize: 10,
              }}>
                <span style={{ color: C1, fontWeight: 700 }}>{names.player1}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>कुल जीत</span>
                <span style={{ color: C2, fontWeight: 700 }}>{names.player2}</span>
              </div>
              <div style={{
                height: 8, borderRadius: 99, overflow: "hidden",
                display: "flex", background: C2 + "44",
              }}>
                <div style={{
                  width: `${pct1}%`, background: C1,
                  borderRadius: "99px 0 0 99px",
                  transition: "width 0.6s ease",
                  minWidth: w1 > 0 ? 4 : 0,
                }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: 5, fontSize: 11, fontWeight: 900,
              }}>
                <span style={{ color: C1 }}>{w1}</span>
                <span style={{ color: C2 }}>{w2}</span>
              </div>
            </div>
          );
        })()}

        {/* Player cards */}
        {players.map(({ name, color, emoji }) => {
          const s = stats[name];
          const games = s?.games || 0;
          const wins = s?.wins || 0;
          const losses = s?.losses || 0;
          const wr = games > 0 ? Math.round((wins / games) * 100) : 0;

          return (
            <div key={name} style={{
              background: color + "0b",
              border: `1px solid ${color}22`,
              borderRadius: 15, padding: 13, marginBottom: 12,
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: 8, marginBottom: 10,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: color + "20",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20, flexShrink: 0,
                }}>{emoji}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    color, fontWeight: 800, fontSize: 15,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{name}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                    {games} खेल खेले
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 26, lineHeight: 1 }}>{wins}</div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>जीत</div>
                </div>
              </div>

              {games > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>जीत की दर</span>
                    <span style={{ color, fontSize: 10, fontWeight: 700 }}>{wr}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      background: color, width: `${wr}%`,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              )}

              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                gap: 5, marginBottom: 10,
              }}>
                {[
                  { l: "जीत 🏆", v: wins, c: color },
                  { l: "हार 💔", v: losses, c: "#64748b" },
                  { l: "सर्वश्रेष्ठ 🔥", v: s?.bestStreak || 0, c: "#fbbf24" },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{
                    textAlign: "center", background: "rgba(0,0,0,0.22)",
                    borderRadius: 9, padding: "7px 4px",
                  }}>
                    <div style={{ color: c, fontWeight: 900, fontSize: 20 }}>{v}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8.5, marginTop: 1 }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: "rgba(0,0,0,0.2)", borderRadius: 8,
                padding: "6px 10px", fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                textAlign: "center", fontStyle: "italic", lineHeight: 1.5,
              }}>
                {getMsg(s)}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, background: `linear-gradient(135deg,${C1},${C2})`,
            color: "#fff", fontWeight: 800, padding: "12px 0",
            borderRadius: 11, border: "none", cursor: "pointer", fontSize: 14,
          }}>
            वापस जाएं
          </button>
          <button onClick={clearAll} style={{
            padding: "12px 14px", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(255,255,255,0.3)", borderRadius: 11,
            cursor: "pointer", fontSize: 11,
          }}>
            रीसेट
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────
interface MenuProps {
  onStart: (diff: Difficulty) => void;
  playerNames: PlayerNames;
  onEditNames: () => void;
  onStats: () => void;
}

function Menu({ onStart, playerNames, onEditNames, onStats }: MenuProps) {
  const [diff, setDiff] = useState<Difficulty>("easy");
  const dc = { easy: C1, medium: "#a78bfa", hard: "#fb923c" };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "16px 16px 28px", background: "#060a18",
      color: "#fff", boxSizing: "border-box", position: "relative",
    }}>
      {/* Stats button */}
      <button onClick={onStats} style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.4)",
        padding: "6px 12px", borderRadius: 10, cursor: "pointer",
        fontSize: 13, display: "flex", alignItems: "center", gap: 5,
      }}>
        🏆 <span style={{ fontSize: 11 }}>आंकड़े</span>
      </button>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{
          fontSize: 48, marginBottom: 6,
          filter: `drop-shadow(0 0 20px ${C1}44)`,
        }}>⚔️</div>
        <h1 style={{
          fontWeight: 900, fontStyle: "italic",
          fontSize: "clamp(30px,8vw,44px)", margin: "0 0 5px",
          background: `linear-gradient(135deg,${C1},${C2})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: "-0.02em",
        }}>
          HISAB-RASSA
        </h1>
        <p style={{
          color: "#1e3a50", fontSize: "clamp(8px,2vw,10px)",
          letterSpacing: "0.22em", textTransform: "uppercase",
          margin: 0, fontWeight: 700,
        }}>गणित का रस्साकशी</p>
      </div>

      {/* Player names */}
      <div style={{ width: "100%", maxWidth: 300, marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 13,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginBottom: 2, letterSpacing: "0.1em" }}>खिलाड़ी 1</div>
            <div style={{ color: C1, fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {playerNames.player1}
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>VS</div>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginBottom: 2, letterSpacing: "0.1em" }}>खिलाड़ी 2</div>
            <div style={{ color: C2, fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {playerNames.player2}
            </div>
          </div>
        </div>
        <button onClick={onEditNames} style={{
          width: "100%", marginTop: 6, background: "none", border: "none",
          color: "rgba(255,255,255,0.2)", fontSize: 10, cursor: "pointer", padding: "4px 0",
        }}>
          ✏️ नाम बदलें
        </button>
      </div>

      {/* Difficulty */}
      <div style={{ width: "100%", maxWidth: 300, marginBottom: 16 }}>
        <p style={{
          textAlign: "center", fontSize: 9, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "#1e3a50",
          marginBottom: 8, fontWeight: 700,
        }}>कठिनाई चुनें</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {(Object.entries(DIFFS) as [Difficulty, typeof DIFFS[Difficulty]][]).map(([k, v]) => (
            <button key={k} onClick={() => setDiff(k)} style={{
              padding: "10px 4px", borderRadius: 11, fontWeight: 700,
              fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              background: diff === k ? dc[k] + "22" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${diff === k ? dc[k] : "transparent"}`,
              color: diff === k ? dc[k] : "#334155",
            }}>{v.label}</button>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 7, fontSize: 10, color: "#334155" }}>
          {DIFFS[diff].note}
        </p>
      </div>

      {/* How to play */}
      <div style={{
        width: "100%", maxWidth: 300, marginBottom: 22,
        padding: "11px 13px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        fontSize: 10, color: "#334155", lineHeight: 1.9,
      }}>
        <div style={{ color: "#475569", marginBottom: 4, fontSize: 10, fontWeight: 700 }}>
          📖 खेलने का तरीका
        </div>
        <div>• एक डिवाइस पर 2 खिलाड़ी खेलते हैं</div>
        <div>• सही जवाब दो और रस्सा अपनी तरफ खींचो</div>
        <div>• पहले 3 राउंड जीतने वाला चैम्पियन!</div>
        <div>• लगातार 3 सही = बोनस पुल! 🔥</div>
      </div>

      <button onClick={() => onStart(diff)} style={{
        fontWeight: 900, color: "#fff", padding: "14px 44px",
        borderRadius: 99, fontSize: 15, border: "none", cursor: "pointer",
        background: `linear-gradient(135deg,${C1},${C2})`,
        boxShadow: `0 0 32px ${C1}30`,
      }}>
        ⚡ युद्ध शुरू करें
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<"nameInput" | "menu" | "game">("nameInput");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [ropePos, setRopePos] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [questions, setQuestions] = useState<[Question, Question]>([genQ("easy"), genQ("easy")]);
  const [inputs, setInputs] = useState<[string, string]>(["", ""]);
  const [flashes, setFlashes] = useState<[FlashType, FlashType]>([null, null]);
  const [streaks, setStreaks] = useState<[number, number]>([0, 0]);
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [gameWinner, setGameWinner] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [roundMsg, setRoundMsg] = useState("");
  const [winMsg, setWinMsg] = useState("");
  const [loseMsg, setLoseMsg] = useState("");
  const [playerMessages, setPlayerMessages] = useState<[string | null, string | null]>([null, null]);

  const [playerNames, setPlayerNames] = useState<PlayerNames>(() => {
    try {
      const s = localStorage.getItem(NAMES_KEY);
      return s ? JSON.parse(s) : { player1: "Player 1", player2: "Player 2" };
    } catch { return { player1: "Player 1", player2: "Player 2" }; }
  });

  const isMobile = useMobile();
  const flashTO = useRef<[ReturnType<typeof setTimeout> | null, ReturnType<typeof setTimeout> | null]>([null, null]);
  const messageTO = useRef<[ReturnType<typeof setTimeout> | null, ReturnType<typeof setTimeout> | null]>([null, null]);
  const handlerRef = useRef<((player: number, key: string) => void) | null>(null);

  useEffect(() => {
    localStorage.setItem(NAMES_KEY, JSON.stringify(playerNames));
  }, [playerNames]);

  const showPlayerMessage = (player: PlayerIndex, message: string) => {
    if (messageTO.current[player]) clearTimeout(messageTO.current[player]!);
    setPlayerMessages(prev => {
      const newMsg: [string | null, string | null] = [...prev];
      newMsg[player] = message;
      return newMsg;
    });
    messageTO.current[player] = setTimeout(() => {
      setPlayerMessages(prev => {
        const newMsg: [string | null, string | null] = [...prev];
        newMsg[player] = null;
        return newMsg;
      });
    }, 1000);
  };

  // Core input handler
  const handleKeyPress = (player: number, key: string) => {
    if (roundWinner !== null || gameWinner !== null || countdown !== null) return;
    const idx = (player - 1) as PlayerIndex;

    if (key === "C") {
      setInputs(p => { const n: [string, string] = [...p]; n[idx] = ""; return n; });
      return;
    }
    if (key === "⌫") {
      setInputs(p => { const n: [string, string] = [...p]; n[idx] = n[idx].slice(0, -1); return n; });
      return;
    }
    if (key === "0" && inputs[idx] === "") return;

    const newInput = inputs[idx] + key;
    const parsed = parseInt(newInput, 10);
    const answer = questions[idx].ans;

    const triggerFlash = (type: FlashType) => {
      if (flashTO.current[idx]) clearTimeout(flashTO.current[idx]!);
      setFlashes(p => { const n: [FlashType, FlashType] = [...p]; n[idx] = type; return n; });
      flashTO.current[idx] = setTimeout(() => {
        setFlashes(p => { const n: [FlashType, FlashType] = [...p]; n[idx] = null; return n; });
      }, 280);
    };

    if (parsed === answer) {
      // Correct answer
      triggerFlash("ok");
      showPlayerMessage(idx, rnd(MSG.perfect));

      const bonus = streaks[idx] >= 2 ? 5 : 0;
      const pullAmount = PULL + bonus;

      if (bonus > 0) {
        showPlayerMessage(idx, `${rnd(MSG.bonus)} +${bonus} पुल!`);
      }

      setStreaks(p => { const n: [number, number] = [...p]; n[idx]++; return n; });

      const newStreak = streaks[idx] + 1;
      if (newStreak === 3) {
        showPlayerMessage(idx, rnd(MSG.streak));
      }

      setRopePos(p => p + (player === 1 ? -pullAmount : pullAmount));
      setQuestions(p => { const n: [Question, Question] = [...p]; n[idx] = genQ(difficulty); return n; });
      setInputs(p => { const n: [string, string] = [...p]; n[idx] = ""; return n; });
    } else if (newInput.length >= String(answer).length || parsed > answer) {
      // Wrong answer
      triggerFlash("err");
      showPlayerMessage(idx, "❌ गलत!");
      setStreaks(p => { const n: [number, number] = [...p]; n[idx] = 0; return n; });
      setInputs(p => { const n: [string, string] = [...p]; n[idx] = ""; return n; });
    } else {
      // Partial input
      setInputs(p => { const n: [string, string] = [...p]; n[idx] = newInput; return n; });
    }
  };

  handlerRef.current = handleKeyPress;

  // Round win detection
  useEffect(() => {
    if (roundWinner !== null || gameWinner !== null) return;
    let w: number | null = null;
    if (ropePos <= -WIN_POS) w = 0;
    if (ropePos >= WIN_POS) w = 1;
    if (w === null) return;

    setRoundMsg(rnd(MSG.round));
    setRoundWinner(w);
    setScores(prev => {
      const n: [number, number] = [...prev];
      n[w]++;
      if (n[w] >= BEST_OF) {
        const wName = w === 0 ? playerNames.player1 : playerNames.player2;
        const lName = w === 0 ? playerNames.player2 : playerNames.player1;
        recordGameWin(wName, lName);
        setGameWinner(w);
        setWinMsg(rnd(MSG.win));
        setLoseMsg(rnd(MSG.lose));
        burst(w === 0 ? C1 : C2);
      }
      return n;
    });
  }, [ropePos, roundWinner, gameWinner, playerNames]);

  // Keyboard support
  useEffect(() => {
    if (screen !== "game") return;
    const h = (e: KeyboardEvent) => {
      if (e.code.startsWith("Digit")) { e.preventDefault(); handlerRef.current?.(2, e.code.replace("Digit", "")); }
      if (e.code === "Backspace") { e.preventDefault(); handlerRef.current?.(2, "⌫"); }
      if (e.code.startsWith("Numpad")) {
        e.preventDefault();
        const k = e.code.replace("Numpad", "");
        if (/^\d$/.test(k)) handlerRef.current?.(1, k);
        if (k === "Decimal" || k === "Subtract") handlerRef.current?.(1, "C");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [screen]);

  const startCountdown = () => {
    setCountdown(3);
    const tick = (n: number) => {
      if (n <= 0) { setCountdown(null); return; }
      setTimeout(() => { setCountdown(n - 1); tick(n - 1); }, 600);
    };
    tick(3);
  };

  const nextRound = () => {
    setRopePos(0);
    setInputs(["", ""]);
    setRoundWinner(null);
    setStreaks([0, 0]);
    setQuestions([genQ(difficulty), genQ(difficulty)]);
    startCountdown();
  };

  const restartGame = () => {
    setScreen("menu");
    setRopePos(0);
    setScores([0, 0]);
    setInputs(["", ""]);
    setRoundWinner(null);
    setGameWinner(null);
    setStreaks([0, 0]);
  };

  const handleStartGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setQuestions([genQ(diff), genQ(diff)]);
    setScreen("game");
    startCountdown();
  };

  const handleSaveNames = (names: PlayerNames) => {
    setPlayerNames(names);
    setScreen("menu");
    setShowNameModal(false);
  };

  // ── RENDER ─────────────────────────────────────────────────────
  if (screen === "nameInput") return <NameModal names={playerNames} onSave={handleSaveNames} />;

  return (
    <>
      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>

      {/* MENU */}
      {screen === "menu" && (
        <Menu
          onStart={handleStartGame}
          playerNames={playerNames}
          onEditNames={() => setShowNameModal(true)}
          onStats={() => setShowStats(true)}
        />
      )}

      {/* GAME SCREEN */}
      {screen === "game" && (
        <div style={{
          height: "100dvh", width: "100%", color: "#fff",
          overflow: "hidden", userSelect: "none",
          display: "flex", flexDirection: "column",
          background: "#060a18", touchAction: "none",
          boxSizing: "border-box",
        }}>
          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "4px 8px", flexShrink: 0, height: 34,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0, flex: 1 }}>
              {Array.from({ length: BEST_OF }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: i < scores[0] ? C1 : "rgba(255,255,255,0.1)", flexShrink: 0,
                }} />
              ))}
              <span style={{
                marginLeft: 3, fontSize: 9, fontWeight: 800, color: C1, opacity: 0.8,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{playerNames.player1}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <button onClick={() => setShowStats(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, padding: "0 2px", lineHeight: 1,
              }}>🏆</button>
              <span style={{
                fontSize: 8, padding: "2px 6px", borderRadius: 99, fontWeight: 700,
                background: difficulty === "easy" ? C1 + "18" : difficulty === "hard" ? "#fb923c18" : "#a78bfa18",
                color: difficulty === "easy" ? C1 : difficulty === "hard" ? "#fb923c" : "#a78bfa",
              }}>
                {DIFFS[difficulty].label}
              </span>
              <button onClick={restartGame} style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,0.2)", cursor: "pointer",
                fontSize: 13, padding: "0 2px", lineHeight: 1,
              }}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
              <span style={{
                marginRight: 3, fontSize: 9, fontWeight: 800, color: C2, opacity: 0.8,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{playerNames.player2}</span>
              {Array.from({ length: BEST_OF }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: i < scores[1] ? C2 : "rgba(255,255,255,0.1)", flexShrink: 0,
                }} />
              ))}
            </div>
          </div>

          {/* Rope meter strip */}
          <div style={{ padding: "0 6px", flexShrink: 0, marginBottom: 2 }}>
            <RopeMeter pos={ropePos} />
          </div>

          {/* ── MOBILE: stacked vertical ── */}
          {isMobile ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              gap: 5, padding: "2px 5px 5px", minHeight: 0,
            }}>
              {/* Player 2 — rotated 180° so they face downward */}
              <div style={{ flex: "1 1 0", minHeight: 0, transform: "rotate(180deg)" }}>
                <Card
                  playerName={playerNames.player2}
                  question={questions[1]}
                  input={inputs[1]}
                  onKey={k => handlerRef.current?.(2, k)}
                  color={C2} flash={flashes[1]}
                  score={scores[1]} streak={streaks[1]}
                  message={playerMessages[1]}
                />
              </div>
              <div style={{ flexShrink: 0 }}>
                <Rope pos={ropePos} />
              </div>
              {/* Player 1 — normal orientation */}
              <div style={{ flex: "1 1 0", minHeight: 0 }}>
                <Card
                  playerName={playerNames.player1}
                  question={questions[0]}
                  input={inputs[0]}
                  onKey={k => handlerRef.current?.(1, k)}
                  color={C1} flash={flashes[0]}
                  score={scores[0]} streak={streaks[0]}
                  message={playerMessages[0]}
                />
              </div>
            </div>
          ) : (
            /* ── DESKTOP: side by side ── */
            <div style={{
              flex: 1, display: "flex", gap: 10,
              padding: "6px 10px 10px", minHeight: 0,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card
                  playerName={playerNames.player1}
                  question={questions[0]}
                  input={inputs[0]}
                  onKey={k => handlerRef.current?.(1, k)}
                  color={C1} flash={flashes[0]}
                  score={scores[0]} streak={streaks[0]}
                  message={playerMessages[0]}
                />
              </div>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 70 }}>
                <Rope pos={ropePos} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card
                  playerName={playerNames.player2}
                  question={questions[1]}
                  input={inputs[1]}
                  onKey={k => handlerRef.current?.(2, k)}
                  color={C2} flash={flashes[1]}
                  score={scores[1]} streak={streaks[1]}
                  message={playerMessages[1]}
                />
              </div>
            </div>
          )}

          {/* ── COUNTDOWN OVERLAY ── */}
          {countdown !== null && countdown > 0 && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontWeight: 900, fontSize: "clamp(72px,15vw,96px)", lineHeight: 1,
                  background: `linear-gradient(to bottom,white,${countdown === 1 ? C2 : C1})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {countdown}
                </div>
                <p style={{
                  color: "#1e3a50", fontSize: 10,
                  letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 8,
                }}>
                  {MSG.cd[3 - countdown] || "तैयार!"}
                </p>
              </div>
            </div>
          )}

          {/* ── ROUND WIN OVERLAY ── */}
          {roundWinner !== null && gameWinner === null && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>{roundWinner === 0 ? "🔵" : "🔴"}</div>
                <h2 style={{
                  fontWeight: 900, fontSize: "clamp(18px,5vw,24px)",
                  marginBottom: 6, color: roundWinner === 0 ? C1 : C2,
                }}>
                  {roundWinner === 0 ? playerNames.player1 : playerNames.player2} ने राउंड जीता!
                </h2>
                <p style={{
                  color: "rgba(255,255,255,0.45)", fontSize: 13,
                  margin: "0 0 6px", fontStyle: "italic",
                }}>{roundMsg}</p>
                <p style={{
                  color: "rgba(255,255,255,0.25)", fontSize: 14,
                  margin: "0 0 24px", fontWeight: 800,
                }}>{scores[0]} — {scores[1]}</p>
                <button onClick={nextRound} style={{
                  fontWeight: 800, color: "#fff", padding: "12px 36px",
                  borderRadius: 99, fontSize: 14, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg,${C1},${C2})`,
                }}>
                  अगला राउंड →
                </button>
              </div>
            </div>
          )}

          {/* ── GAME WIN OVERLAY ── */}
          {gameWinner !== null && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16, background: "rgba(0,0,0,0.97)", backdropFilter: "blur(16px)",
            }}>
              <div style={{ textAlign: "center", maxWidth: 320 }}>
                <div style={{ fontSize: 62, marginBottom: 8 }}>🏆</div>
                <h2 style={{
                  fontWeight: 900, fontSize: "clamp(22px,6vw,32px)",
                  marginBottom: 4, color: gameWinner === 0 ? C1 : C2,
                }}>
                  {gameWinner === 0 ? playerNames.player1 : playerNames.player2} जीत गए!
                </h2>
                <p style={{
                  color: "rgba(255,255,255,0.55)", fontSize: 14,
                  margin: "0 0 8px", fontStyle: "italic",
                }}>{winMsg}</p>
                <div style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 10,
                  padding: "8px 14px", marginBottom: 8,
                  fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic",
                }}>
                  {gameWinner === 0 ? playerNames.player2 : playerNames.player1}: {loseMsg}
                </div>
                <p style={{
                  color: "rgba(255,255,255,0.2)", fontSize: 13,
                  margin: "0 0 22px", fontWeight: 700,
                }}>
                  अंतिम स्कोर: {scores[0]} — {scores[1]}
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button onClick={restartGame} style={{
                    fontWeight: 800, color: "#fff", padding: "12px 28px",
                    borderRadius: 99, fontSize: 14, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg,${C1},${C2})`,
                  }}>
                    फिर खेलें
                  </button>
                  <button onClick={() => setShowStats(true)} style={{
                    fontWeight: 700, color: "rgba(255,255,255,0.4)",
                    padding: "12px 18px", borderRadius: 99, fontSize: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer", background: "transparent",
                  }}>
                    🏆 आंकड़े
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OVERLAY MODALS ── */}
      {showNameModal && <NameModal names={playerNames} onSave={handleSaveNames} />}
      {showStats && <StatsModal names={playerNames} onClose={() => setShowStats(false)} />}
    </>
  );
}