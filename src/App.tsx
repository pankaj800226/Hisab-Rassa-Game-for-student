import { useState, useEffect, useRef } from "react";

// ─── TYPE DEFINITIONS ───────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard";
type Operation = "+" | "−" | "×";
type FlashType = "ok" | "err" | null;

interface Question {
  a: number;
  b: number;
  op: Operation;
  ans: number;
}

interface DiffConfig {
  label: string;
  note: string;
  ops: Operation[];
}

interface PlayerNames {
  player1: string;
  player2: string;
}

const DIFFS: Record<Difficulty, DiffConfig> = {
  easy: { label: "EASY", note: "Addition only", ops: ["+"] },
  medium: { label: "MEDIUM", note: "Add & Subtract", ops: ["+", "−"] },
  hard: { label: "HARD", note: "All Operations", ops: ["+", "−", "×"] },
};

// ─── HELPERS ─────────────────────────────────────────────────────
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
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

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

function burst(color: string): void {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const particles: Particle[] = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 11,
    vy: Math.random() * -13 - 2,
    r: Math.random() * 5 + 2,
    c: [color, "#fff", "#fbbf24"][Math.floor(Math.random() * 3)],
    ro: Math.random() * Math.PI * 2,
    rv: (Math.random() - 0.5) * 0.3,
    lf: 1,
  }));

  let animationId: number;

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38;
      p.ro += p.rv;
      p.lf -= 0.012;
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
    if (alive) {
      animationId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animationId);
      document.body.removeChild(canvas);
    }
  };

  animationId = requestAnimationFrame(tick);
}

// ─── KEYPAD ─────────────────────────────────────────────────────
const KS: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

interface PadProps {
  onKey: (key: string) => void;
  color: string;
}

function Pad({ onKey, color }: PadProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-2">
      {KS.map((k) => (
        <button
          key={k}
          onPointerDown={(e) => { e.preventDefault(); onKey(k); }}
          className={`rounded-xl font-bold py-2.5 transition-all duration-75 active:scale-90 ${k === "0" ? "col-span-2" : ""}`}
          style={{
            fontSize: "clamp(16px, 4vw, 20px)",
            background: k === "C" || k === "⌫" ? "rgba(255,255,255,0.05)" : color + "1a",
            border: `1px solid ${k === "C" || k === "⌫" ? "rgba(255,255,255,0.1)" : color + "33"}`,
            color: k === "C" || k === "⌫" ? "#94a3b8" : "#fff",
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── PLAYER CARD ────────────────────────────────────────────────
interface CardProps {
  playerName: string;
  question: Question;
  input: string;
  onKey: (key: string) => void;
  color: string;
  flash: FlashType;
  score: number;
  streak: number;
}

function Card({ playerName, question, input, onKey, color, flash, score, streak }: CardProps) {
  const borderColor = flash === "ok" ? color : flash === "err" ? "#ef4444" : color + "20";
  const glowStyle = flash === "ok"
    ? `0 0 20px ${color}44`
    : flash === "err"
      ? "0 0 20px #ef444444"
      : "none";

  return (
    <div
      className="flex flex-col rounded-2xl p-2.5 h-full transition-all duration-150"
      style={{ background: color + "08", border: `1px solid ${borderColor}`, boxShadow: glowStyle }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold uppercase tracking-wider truncate max-w-[100px]" style={{ color, opacity: 0.85 }}>
            {playerName}
          </span>
          {streak >= 3 && (
            <span
              className="text-[8px] font-black px-1 py-0.5 rounded-full"
              style={{ background: color + "33", color, border: `1px solid ${color}55` }}
            >
              🔥{streak}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < score ? color : "rgba(255,255,255,0.15)", border: `1px solid ${color}44` }}
            />
          ))}
        </div>
      </div>

      <div className="text-center py-2">
        <span
          style={{
            color,
            fontFamily: "monospace",
            fontSize: "clamp(32px, 7vw, 44px)",
            fontWeight: 900,
          }}
        >
          {question.a} {question.op} {question.b}
        </span>
      </div>

      <div
        className="rounded-xl mb-2 flex items-center justify-center font-bold py-2"
        style={{
          background: "rgba(0,0,0,0.35)",
          border: `1px solid ${flash === "err" ? "#ef444455" : color + "22"}`,
          color: flash === "err" ? "#ef4444" : "#fff",
          fontSize: "clamp(26px, 5vw, 34px)",
          fontFamily: "monospace",
          minHeight: "55px",
        }}
      >
        {input || <span style={{ opacity: 0.2 }}>?</span>}
      </div>

      <Pad onKey={onKey} color={color} />
    </div>
  );
}

// ─── ROPE ───────────────────────────────────────────────────────
const WIN_POS = 100;
const C1 = "#22d3ee";
const C2 = "#fb7185";

interface RopeProps {
  pos: number;
}

function Rope({ pos }: RopeProps) {
  const pct = 50 + (pos / WIN_POS) * 42;
  const activeColor = pos < 0 ? C1 : C2;

  return (
    <div className="relative w-full py-2">
      <div className="relative h-[5px] rounded-full mx-6" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="absolute inset-0 rounded-full" style={{
          background: `linear-gradient(to right, ${C1}, #fff 50%, ${C2})`,
        }} />

        <div className="absolute top-1/2 z-10 transition-all duration-300"
          style={{
            left: `${Math.min(95, Math.max(5, pct))}%`,
            transform: "translate(-50%, -50%)",
          }}>
          <div className="w-6 h-6 bg-white rounded-md rotate-45 border-2 border-[#0a0f1c]"
            style={{ boxShadow: `0 0 12px ${activeColor}88` }} />
        </div>
      </div>
    </div>
  );
}

// ─── ROPE METER ─────────────────────────────────────────────────
function RopeMeter({ pos }: RopeProps) {
  const normalized = (pos + WIN_POS) / (WIN_POS * 2);
  const widthPercent = Math.max(2, Math.min(98, normalized * 100));
  return (
    <div className="relative w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="absolute inset-y-0 left-0 transition-all"
        style={{
          width: `${widthPercent}%`,
          background: `linear-gradient(to right, ${C1}, white 50%, ${C2})`,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

// ─── NAME INPUT MODAL ───────────────────────────────────────────
interface NameModalProps {
  names: PlayerNames;
  onSave: (names: PlayerNames) => void;
}

function NameModal({ names, onSave }: NameModalProps) {
  const [player1, setPlayer1] = useState(names.player1);
  const [player2, setPlayer2] = useState(names.player2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      player1: player1.trim() || "Player 1",
      player2: player2.trim() || "Player 2",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl w-full max-w-sm p-5"
        style={{ background: "#0f172a", border: "1px solid #1e293b" }}>

        <div className="text-center mb-4">
          <div className="text-3xl mb-1">✏️</div>
          <h2 className="font-bold text-white text-lg">Enter Player Names</h2>
          <p className="text-[10px] text-white/40 mt-1">Names saved automatically</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1" style={{ color: C1 }}>
              Player 1 (Blue)
            </label>
            <input
              type="text"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              placeholder="Player 1"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${C1}44` }}
              maxLength={15}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1" style={{ color: C2 }}>
              Player 2 (Red)
            </label>
            <input
              type="text"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              placeholder="Player 2"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${C2}44` }}
              maxLength={15}
            />
          </div>

          <button
            type="submit"
            className="w-full font-bold text-white py-3 rounded-xl text-base transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #e11d48)" }}
          >
            ⚡ START GAME
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MENU SCREEN ────────────────────────────────────────────────
interface MenuProps {
  onStart: (diff: Difficulty) => void;
  playerNames: PlayerNames;
  onEditNames: () => void;
}

function Menu({ onStart, playerNames, onEditNames }: MenuProps) {
  const [diff, setDiff] = useState<Difficulty>("easy");
  const diffColors: Record<Difficulty, string> = { easy: C1, medium: "#a78bfa", hard: "#fb923c" };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white" style={{ background: "#060a18" }}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">⚔️</div>
        <h1
          className="font-black italic tracking-tight text-4xl sm:text-5xl"
          style={{
            background: `linear-gradient(to right, ${C1}, ${C2})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          HISAB-RASSA
        </h1>
        <p className="uppercase tracking-widest mt-1 text-slate-600 text-[9px] sm:text-[10px]">
          Math Tug of War
        </p>
      </div>

      {/* Player Names Display */}
      <div className="w-full max-w-xs mb-5">
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5">
          <div className="flex-1 text-center">
            <span className="text-[8px] text-white/40">PLAYER 1</span>
            <p className="font-bold text-sm truncate" style={{ color: C1 }}>{playerNames.player1}</p>
          </div>
          <div className="text-white/20 text-xs">VS</div>
          <div className="flex-1 text-center">
            <span className="text-[8px] text-white/40">PLAYER 2</span>
            <p className="font-bold text-sm truncate" style={{ color: C2 }}>{playerNames.player2}</p>
          </div>
        </div>
        <button
          onClick={onEditNames}
          className="w-full mt-2 text-[9px] text-white/40 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          ✏️ Edit Names
        </button>
      </div>

      <div className="w-full max-w-xs mb-5">
        <p className="text-center text-[9px] uppercase tracking-widest mb-2 text-slate-600">Difficulty</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(DIFFS) as [Difficulty, DiffConfig][]).map(([k, v]) => {
            const dc = diffColors[k];
            return (
              <button
                key={k}
                onClick={() => setDiff(k)}
                className="py-2 rounded-xl font-bold text-[11px] transition-all active:scale-95"
                style={{
                  background: diff === k ? dc + "20" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${diff === k ? dc : "transparent"}`,
                  color: diff === k ? dc : "#475569",
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <p className="text-center mt-2 text-[10px] text-slate-600">{DIFFS[diff].note}</p>
      </div>

      <div
        className="w-full max-w-xs mb-6 p-3 rounded-xl text-[10px] text-slate-500 leading-relaxed"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-slate-400 mb-1 text-[10px]">📖 How to Play</p>
        <p>• 2 players on same device</p>
        <p>• Solve math to pull the rope</p>
        <p>• First to win 3 rounds wins!</p>
      </div>

      <button
        onClick={() => onStart(diff)}
        className="font-black text-white py-3 px-8 rounded-full text-sm transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg, #0ea5e9, #e11d48)",
          boxShadow: "0 0 30px rgba(14,165,233,0.2)",
        }}
      >
        ⚡ START BATTLE
      </button>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────
const BEST_OF = 3;
const PULL = 13;

type Screen = "menu" | "game" | "nameInput";

export default function App() {
  const [screen, setScreen] = useState<Screen>("nameInput");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [ropePos, setRopePos] = useState<number>(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [questions, setQuestions] = useState<[Question, Question]>([genQ("easy"), genQ("easy")]);
  const [inputs, setInputs] = useState<[string, string]>(["", ""]);
  const [flashes, setFlashes] = useState<[FlashType, FlashType]>([null, null]);
  const [streaks, setStreaks] = useState<[number, number]>([0, 0]);
  const [roundWinner, setRoundWinner] = useState<0 | 1 | null>(null);
  const [gameWinner, setGameWinner] = useState<0 | 1 | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);

  const [playerNames, setPlayerNames] = useState<PlayerNames>(() => {
    const saved = localStorage.getItem("hisab_names");
    return saved ? JSON.parse(saved) : { player1: "Player 1", player2: "Player 2" };
  });

  const isMobile = useMobile();
  const flashTimeoutsRef = useRef<[ReturnType<typeof setTimeout> | null, ReturnType<typeof setTimeout> | null]>([null, null]);
  const handlerRef = useRef<((player: 1 | 2, key: string) => void) | null>(null);

  // Save names to localStorage
  useEffect(() => {
    localStorage.setItem("hisab_names", JSON.stringify(playerNames));
  }, [playerNames]);

  // Core game logic
  handlerRef.current = (player, key) => {
    if (roundWinner !== null || gameWinner !== null || countdown !== null) return;
    const idx = player - 1;

    if (key === "C") {
      setInputs((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[idx] = "";
        return next;
      });
      return;
    }

    if (key === "⌫") {
      setInputs((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[idx] = next[idx].slice(0, -1);
        return next;
      });
      return;
    }

    if (key === "0" && inputs[idx] === "") return;

    const currentInput = inputs[idx];
    const newInput = currentInput + key;
    const parsed = parseInt(newInput, 10);
    const answer = questions[idx].ans;

    const triggerFlash = (type: "ok" | "err") => {
      if (flashTimeoutsRef.current[idx]) clearTimeout(flashTimeoutsRef.current[idx]!);
      setFlashes((prev) => {
        const next: [FlashType, FlashType] = [...prev] as [FlashType, FlashType];
        next[idx] = type;
        return next;
      });
      flashTimeoutsRef.current[idx] = setTimeout(() => {
        setFlashes((prev) => {
          const next: [FlashType, FlashType] = [...prev] as [FlashType, FlashType];
          next[idx] = null;
          return next;
        });
      }, 300);
    };

    if (parsed === answer) {
      triggerFlash("ok");
      setStreaks((prev) => {
        const next: [number, number] = [...prev] as [number, number];
        next[idx]++;
        return next;
      });
      const bonus = streaks[idx] >= 2 ? 5 : 0;
      const pullAmount = PULL + bonus;
      setRopePos((prev) => prev + (player === 1 ? -pullAmount : pullAmount));
      setQuestions((prev) => {
        const next: [Question, Question] = [...prev] as [Question, Question];
        next[idx] = genQ(difficulty);
        return next;
      });
      setInputs((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[idx] = "";
        return next;
      });
    } else if (newInput.length >= String(answer).length || parsed > answer) {
      triggerFlash("err");
      setStreaks((prev) => {
        const next: [number, number] = [...prev] as [number, number];
        next[idx] = 0;
        return next;
      });
      setInputs((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[idx] = "";
        return next;
      });
    } else {
      setInputs((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[idx] = newInput;
        return next;
      });
    }
  };

  // Check for round win
  useEffect(() => {
    if (roundWinner !== null || gameWinner !== null) return;
    let winner: 0 | 1 | null = null;
    if (ropePos <= -WIN_POS) winner = 0;
    if (ropePos >= WIN_POS) winner = 1;
    if (winner === null) return;

    setRoundWinner(winner);
    setScores((prev) => {
      const newScores: [number, number] = [...prev] as [number, number];
      newScores[winner]++;
      if (newScores[winner] >= BEST_OF) {
        setGameWinner(winner);
        burst(winner === 0 ? C1 : C2);
      }
      return newScores;
    });
  }, [ropePos, roundWinner, gameWinner]);

  // Keyboard support
  useEffect(() => {
    if (screen !== "game") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code.startsWith("Digit")) {
        e.preventDefault();
        handlerRef.current?.(2, e.code.replace("Digit", ""));
      }
      if (e.code === "Backspace") {
        e.preventDefault();
        handlerRef.current?.(2, "⌫");
      }
      if (e.code.startsWith("Numpad")) {
        e.preventDefault();
        const key = e.code.replace("Numpad", "");
        if (/^\d$/.test(key)) handlerRef.current?.(1, key);
        if (key === "Decimal" || key === "Subtract") handlerRef.current?.(1, "C");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen]);

  const startCountdown = () => {
    setCountdown(3);
    const tick = (n: number) => {
      if (n <= 0) {
        setCountdown(null);
        return;
      }
      setTimeout(() => {
        setCountdown(n - 1);
        tick(n - 1);
      }, 600);
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

  // Name input screen
  if (screen === "nameInput") {
    return <NameModal names={playerNames} onSave={handleSaveNames} />;
  }

  // Menu screen
  if (screen === "menu") {
    return (
      <Menu
        onStart={handleStartGame}
        playerNames={playerNames}
        onEditNames={() => setShowNameModal(true)}
      />
    );
  }

  // Name edit modal (from menu)
  if (showNameModal) {
    return <NameModal names={playerNames} onSave={handleSaveNames} />;
  }

  // Game screen
  const player1Props = {
    playerName: playerNames.player1,
    question: questions[0],
    input: inputs[0],
    onKey: (k: string) => handlerRef.current?.(1, k),
    color: C1,
    flash: flashes[0],
    score: scores[0],
    streak: streaks[0],
  };

  const player2Props = {
    playerName: playerNames.player2,
    question: questions[1],
    input: inputs[1],
    onKey: (k: string) => handlerRef.current?.(2, k),
    color: C2,
    flash: flashes[1],
    score: scores[1],
    streak: streaks[1],
  };

  return (
    <div className="h-screen w-full text-white overflow-hidden select-none flex flex-col" style={{ background: "#060a18", touchAction: "none" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 flex-shrink-0">
        <div className="flex items-center gap-0.5 min-w-0">
          {Array.from({ length: BEST_OF }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < scores[0] ? C1 : "rgba(255,255,255,0.1)" }}
            />
          ))}
          <span className="ml-1 text-[9px] font-bold truncate max-w-[70px]" style={{ color: C1, opacity: 0.85 }}>
            {playerNames.player1}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[8px] font-black tracking-wider text-slate-700 hidden sm:inline">HISAB</span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: difficulty === "easy" ? C1 + "1a" : difficulty === "hard" ? "#fb923c1a" : "#a78bfa1a",
              color: difficulty === "easy" ? C1 : difficulty === "hard" ? "#fb923c" : "#a78bfa",
            }}
          >
            {DIFFS[difficulty].label}
          </span>
        </div>

        <div className="flex items-center gap-0.5 min-w-0">
          <span className="mr-1 text-[9px] font-bold truncate max-w-[70px]" style={{ color: C2, opacity: 0.85 }}>
            {playerNames.player2}
          </span>
          {Array.from({ length: BEST_OF }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < scores[1] ? C2 : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>
      </div>

      {/* Rope Meter */}
      <div className="px-2 flex-shrink-0">
        <RopeMeter pos={ropePos} />
      </div>

      {/* Game Area */}
      {isMobile ? (
        <div className="flex-1 flex flex-col gap-1 px-2 pb-2 min-h-0">
          <div className="flex-1 min-h-0 overflow-auto" style={{ transform: "rotate(180deg)" }}>
            <Card {...player2Props} />
          </div>
          <div className="flex-shrink-0">
            <Rope pos={ropePos} />
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <Card {...player1Props} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-3 px-3 pb-3 min-h-0">
          <div className="flex-1 min-w-0 overflow-auto">
            <Card {...player1Props} />
          </div>
          <div className="flex-shrink-0 flex items-center justify-center">
            <Rope pos={ropePos} />
          </div>
          <div className="flex-1 min-w-0 overflow-auto">
            <Card {...player2Props} />
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-30 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="text-center">
            <div
              className="font-black text-7xl sm:text-8xl"
              style={{
                background: `linear-gradient(to bottom, white, ${countdown === 1 ? C2 : C1})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {countdown}
            </div>
            <p className="text-slate-500 text-[10px] tracking-widest mt-2">GET READY</p>
          </div>
        </div>
      )}

      {/* Round Win Modal */}
      {roundWinner !== null && gameWinner === null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}>
          <div className="text-center">
            <div className="text-5xl mb-2">{roundWinner === 0 ? "🔵" : "🔴"}</div>
            <h2 className="font-black text-xl sm:text-2xl mb-1" style={{ color: roundWinner === 0 ? C1 : C2 }}>
              {roundWinner === 0 ? playerNames.player1 : playerNames.player2} wins round!
            </h2>
            <p className="text-slate-400 text-sm mb-4">{scores[0]} — {scores[1]}</p>
            <button
              onClick={nextRound}
              className="font-bold text-white px-6 py-2.5 rounded-full text-sm transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #e11d48)" }}
            >
              NEXT ROUND →
            </button>
          </div>
        </div>
      )}

      {/* Game Win Modal */}
      {gameWinner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(16px)" }}>
          <div className="text-center">
            <div className="text-6xl mb-2">🏆</div>
            <h2 className="font-black text-2xl sm:text-3xl mb-1" style={{ color: gameWinner === 0 ? C1 : C2 }}>
              {gameWinner === 0 ? playerNames.player1 : playerNames.player2} WINS!
            </h2>
            <p className="text-slate-400 text-sm mb-5">Final: {scores[0]} — {scores[1]}</p>
            <button
              onClick={restartGame}
              className="font-bold text-white px-6 py-2.5 rounded-full text-sm transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #e11d48)" }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}