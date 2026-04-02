import { useState, useEffect, useRef } from "react";

// ─── TYPE DEFINITIONS ───────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard";

type Operation = "+" | "−" | "×";

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

const DIFFS: Record<Difficulty, DiffConfig> = {
  easy: { label: "EASY", note: "Addition only", ops: ["+"] },
  medium: { label: "MEDIUM", note: "Add & Subtract", ops: ["+", "−"] },
  hard: { label: "HARD", note: "All Operations", ops: ["+", "−", "×"] },
};

type FlashType = "ok" | "err" | null;

// ─── HELPERS ─────────────────────────────────────────────────────
function genQ(diff: Difficulty): Question {
  const ops = DIFFS[diff].ops;
  const op = ops[Math.floor(Math.random() * ops.length)];
  if (op === "+") {
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;
    return { a, b, op, ans: a + b };
  }
  if (op === "−") {
    const b = Math.floor(Math.random() * 9) + 2;
    const ans = Math.floor(Math.random() * 9) + 2;
    return { a: ans + b, b, op, ans };
  }
  // op === "×"
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return { a, b, op, ans: a * b };
}

function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
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

  const particles: Particle[] = Array.from({ length: 160 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 11,
    vy: Math.random() * -13 - 2,
    r: Math.random() * 6 + 3,
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
    <div className="grid grid-cols-3 gap-1.5 flex-1" style={{ gridTemplateRows: "repeat(4,1fr)" }}>
      {KS.map((k) => (
        <button
          key={k}
          onPointerDown={(e) => { e.preventDefault(); onKey(k); }}
          className={`rounded-xl font-bold w-full h-full transition-transform duration-75 active:scale-90 ${k === "0" ? "col-span-2" : ""}`}
          style={{
            fontSize: "clamp(16px, 3vw, 22px)",
            background: k === "C" || k === "⌫" ? "rgba(255,255,255,0.06)" : color + "22",
            border: `1px solid ${k === "C" || k === "⌫" ? "rgba(255,255,255,0.1)" : color + "44"}`,
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
  player: 1 | 2;
  question: Question;
  input: string;
  onKey: (key: string) => void;
  color: string;
  flash: FlashType;
  score: number;
  streak: number;
}

function Card({ player, question, input, onKey, color, flash, score, streak }: CardProps) {
  const borderColor = flash === "ok" ? color : flash === "err" ? "#ef4444" : color + "28";
  const glowStyle = flash === "ok"
    ? `0 0 24px ${color}55`
    : flash === "err"
      ? "0 0 24px #ef444455"
      : "none";

  return (
    <div
      className="flex flex-col rounded-3xl p-3 h-full transition-all duration-150"
      style={{ background: color + "0c", border: `1px solid ${borderColor}`, boxShadow: glowStyle }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color, opacity: 0.55 }}>
            Fighter {player}
          </span>
          {streak >= 3 && (
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: color + "33", color, border: `1px solid ${color}55` }}
            >
              🔥×{streak}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full border transition-all"
              style={{ background: i < score ? color : "transparent", borderColor: color + "55" }}
            />
          ))}
        </div>
      </div>

      <div className="text-center my-1">
        <span
          style={{
            color,
            fontFamily: "monospace",
            fontSize: "clamp(28px, 6vw, 40px)",
            fontWeight: 900,
            letterSpacing: "-1px",
          }}
        >
          {question.a} {question.op} {question.b}
        </span>
      </div>

      <div
        className="rounded-2xl mb-2 flex items-center justify-center font-bold"
        style={{
          minHeight: "3rem",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${flash === "err" ? "#ef444455" : color + "22"}`,
          color: flash === "err" ? "#ef4444" : "#fff",
          fontFamily: "monospace",
          fontSize: "clamp(24px, 5vw, 32px)",
        }}
      >
        {input || <span style={{ opacity: 0.15 }}>_</span>}
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
  const pct = 50 + (pos / WIN_POS) * 38;
  const danger = Math.abs(pos) > 70;
  const activeColor = pos < 0 ? C1 : C2;

  return (
    <div className="relative w-full flex-shrink-0 flex items-center" style={{ height: "52px" }}>
      <div
        className="absolute rounded-full"
        style={{
          left: "32px",
          right: "32px",
          top: "50%",
          transform: "translateY(-50%)",
          height: "6px",
          background: "rgba(255,255,255,0.07)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: "32px",
          right: "32px",
          top: "50%",
          transform: "translateY(-50%)",
          height: "6px",
          background: `linear-gradient(to right, ${C1}, white 50%, ${C2})`,
        }}
      />
      {danger && (
        <div
          className="absolute rounded-full transition-opacity"
          style={{
            left: "32px",
            right: "32px",
            top: "50%",
            transform: "translateY(-50%)",
            height: "12px",
            opacity: 0.3,
            boxShadow: `0 0 12px 4px ${activeColor}`,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        className="absolute top-1/2 z-10 transition-all"
        style={{
          left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div
          className="bg-white rounded-md rotate-45 border-[3px] border-[#060a18]"
          style={{
            width: "30px",
            height: "30px",
            boxShadow: `0 0 16px rgba(255,255,255,0.85)${danger ? `, 0 0 28px ${activeColor}` : ""}`,
          }}
        />
      </div>
      <span className="absolute text-[10px] font-black" style={{ left: "4px", top: "50%", transform: "translateY(-50%)", color: C1, opacity: 0.6 }}>
        ◄P1
      </span>
      <span className="absolute text-[10px] font-black" style={{ right: "4px", top: "50%", transform: "translateY(-50%)", color: C2, opacity: 0.6 }}>
        P2►
      </span>
    </div>
  );
}

// ─── ROPE METER ─────────────────────────────────────────────────
function RopeMeter({ pos }: RopeProps) {
  const normalized = (pos + WIN_POS) / (WIN_POS * 2);
  const widthPercent = Math.max(2, Math.min(98, normalized * 100));
  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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

// ─── MENU SCREEN ────────────────────────────────────────────────
interface MenuProps {
  onStart: (diff: Difficulty) => void;
}

function Menu({ onStart }: MenuProps) {
  const [diff, setDiff] = useState<Difficulty>("easy");
  const diffColors: Record<Difficulty, string> = { easy: C1, medium: "#a78bfa", hard: "#fb923c" };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-5 text-white" style={{ background: "#060a18" }}>
      <div className="text-center mb-8">
        <div style={{ fontSize: "clamp(40px, 10vw, 60px)", marginBottom: "8px" }}>⚔️</div>
        <h1
          className="font-black italic tracking-tight"
          style={{
            fontSize: "clamp(36px, 9vw, 56px)",
            background: `linear-gradient(to right, ${C1}, ${C2})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          HISAB-RASSA
        </h1>
        <p className="uppercase tracking-widest mt-1" style={{ color: "#475569", fontSize: "11px" }}>
          Math Tug of War • 2 Players
        </p>
      </div>

      <div className="w-full mb-5" style={{ maxWidth: "320px" }}>
        <p className="text-center uppercase tracking-widest mb-3" style={{ color: "#475569", fontSize: "11px" }}>
          Difficulty
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(DIFFS) as [Difficulty, DiffConfig][]).map(([k, v]) => {
            const dc = diffColors[k];
            return (
              <button
                key={k}
                onClick={() => setDiff(k)}
                className="py-3 rounded-2xl font-bold transition-all active:scale-95"
                style={{
                  fontSize: "13px",
                  background: diff === k ? dc + "25" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${diff === k ? dc : "transparent"}`,
                  color: diff === k ? dc : "#475569",
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <p className="text-center mt-2" style={{ color: "#475569", fontSize: "12px" }}>
          {DIFFS[diff].note}
        </p>
      </div>

      <div
        className="w-full mb-7 rounded-2xl p-4"
        style={{
          maxWidth: "320px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          fontSize: "12px",
          color: "#64748b",
          lineHeight: "1.9",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "#94a3b8" }}>📖 How to Play</p>
        <p>• 2 players on the same device</p>
        <p>• Solve math to pull the rope your way</p>
        <p>• Pull rope fully to win a round</p>
        <p>• First to win <strong style={{ color: "#94a3b8" }}>3 rounds</strong> wins the game</p>
        <p className="mt-2" style={{ color: "#334155" }}>
          🖥️ Desktop: P1 = Numpad &nbsp;·&nbsp; P2 = Number Row
        </p>
        <p style={{ color: "#334155" }}>
          📱 Mobile: Hold device flat, play face to face
        </p>
      </div>

      <button
        onClick={() => onStart(diff)}
        className="font-black text-xl text-white transition-all active:scale-95 hover:brightness-110"
        style={{
          padding: "16px 56px",
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #0ea5e9, #e11d48)",
          boxShadow: "0 0 40px rgba(14,165,233,0.2)",
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

type Screen = "menu" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
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
  const isMobile = useMobile();

  const flashTimeoutsRef = useRef<[ReturnType<typeof setTimeout> | null, ReturnType<typeof setTimeout> | null]>([null, null]);
  const handlerRef = useRef<((player: 1 | 2, key: string) => void) | null>(null);

  // Core game logic: handle answer submission
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

    // Prevent leading zero
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
      }, 360);
    };

    if (parsed === answer) {
      // Correct answer
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
      // Wrong answer
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
      // Partial input, keep building
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

  // Countdown animation for next round
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
      }, 700);
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

  if (screen === "menu") {
    return <Menu onStart={handleStartGame} />;
  }

  const player1Props: CardProps = {
    player: 1,
    question: questions[0],
    input: inputs[0],
    onKey: (k) => handlerRef.current?.(1, k),
    color: C1,
    flash: flashes[0],
    score: scores[0],
    streak: streaks[0],
  };

  const player2Props: CardProps = {
    player: 2,
    question: questions[1],
    input: inputs[1],
    onKey: (k) => handlerRef.current?.(2, k),
    color: C2,
    flash: flashes[1],
    score: scores[1],
    streak: streaks[1],
  };

  return (
    <div className="h-screen w-full text-white overflow-hidden select-none flex flex-col" style={{ background: "#060a18", touchAction: "none" }}>
      {/* Score Bar */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: BEST_OF }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{ background: i < scores[0] ? C1 : "rgba(255,255,255,0.1)" }}
            />
          ))}
          <span className="ml-1 text-[10px] font-bold" style={{ color: C1, opacity: 0.6 }}>P1</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black italic tracking-widest" style={{ color: "#1e293b" }}>
            HISAB-RASSA
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{
              background: difficulty === "easy" ? C1 + "22" : difficulty === "hard" ? "#fb923c22" : "#a78bfa22",
              color: difficulty === "easy" ? C1 : difficulty === "hard" ? "#fb923c" : "#a78bfa",
              border: `1px solid ${difficulty === "easy" ? C1 + "44" : difficulty === "hard" ? "#fb923c44" : "#a78bfa44"}`,
            }}
          >
            {DIFFS[difficulty].label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[10px] font-bold" style={{ color: C2, opacity: 0.6 }}>P2</span>
          {Array.from({ length: BEST_OF }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{ background: i < scores[1] ? C2 : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>
      </div>

      {/* Rope Meter */}
      <div className="px-3 mb-1 flex-shrink-0">
        <RopeMeter pos={ropePos} />
      </div>

      {/* Game Area - Responsive Layout */}
      {isMobile ? (
        <div className="flex-1 flex flex-col gap-2 px-2 pb-2 min-h-0">
          <div className="flex-1 min-h-0" style={{ transform: "rotate(180deg)" }}>
            <Card {...player2Props} />
          </div>
          <Rope pos={ropePos} />
          <div className="flex-1 min-h-0">
            <Card {...player1Props} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-3 px-3 pb-3 min-h-0">
          <div className="flex-1 min-w-0" style={{ maxWidth: "480px" }}>
            <Card {...player1Props} />
          </div>
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "120px" }}>
            <div className="w-full">
              <Rope pos={ropePos} />
            </div>
          </div>
          <div className="flex-1 min-w-0" style={{ maxWidth: "480px" }}>
            <Card {...player2Props} />
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-30 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="text-center">
            <div
              className="font-black"
              style={{
                fontSize: "120px",
                lineHeight: 1,
                background: `linear-gradient(to bottom, white, ${countdown === 1 ? C2 : C1})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {countdown}
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", letterSpacing: "0.2em" }}>GET READY</p>
          </div>
        </div>
      )}

      {/* Round Win Modal */}
      {roundWinner !== null && gameWinner === null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}>
          <div className="text-center" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "64px", marginBottom: "12px" }}>{roundWinner === 0 ? "🔵" : "🔴"}</div>
            <h2
              className="font-black italic"
              style={{
                fontSize: "clamp(28px, 7vw, 42px)",
                marginBottom: "8px",
                color: roundWinner === 0 ? C1 : C2,
              }}
            >
              Player {roundWinner + 1} wins the round!
            </h2>
            <p style={{ color: "#64748b", fontSize: "clamp(16px, 4vw, 22px)", marginBottom: "28px" }}>
              {scores[0]} — {scores[1]}
            </p>
            <button
              onClick={nextRound}
              className="font-black text-black transition-all active:scale-95"
              style={{
                padding: "14px 48px",
                borderRadius: "9999px",
                background: "#fff",
                fontSize: "clamp(15px, 4vw, 18px)",
              }}
            >
              NEXT ROUND →
            </button>
          </div>
        </div>
      )}

      {/* Game Win Modal */}
      {gameWinner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}>
          <div className="text-center" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "clamp(60px, 15vw, 90px)", marginBottom: "12px" }}>🏆</div>
            <h2
              className="font-black italic"
              style={{
                fontSize: "clamp(36px, 9vw, 64px)",
                marginBottom: "8px",
                color: gameWinner === 0 ? C1 : C2,
                textShadow: `0 0 40px ${gameWinner === 0 ? C1 : C2}55`,
              }}
            >
              PLAYER {gameWinner + 1} WINS!
            </h2>
            <p style={{ color: "#64748b", fontSize: "clamp(16px, 4vw, 22px)", marginBottom: "32px" }}>
              Final Score: {scores[0]} — {scores[1]}
            </p>
            <button
              onClick={restartGame}
              className="font-black text-white transition-all active:scale-95 hover:brightness-110"
              style={{
                padding: "16px 56px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg, #0ea5e9, #e11d48)",
                fontSize: "clamp(16px, 4vw, 20px)",
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}