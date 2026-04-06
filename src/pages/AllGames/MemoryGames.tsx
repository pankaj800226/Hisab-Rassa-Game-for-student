import { useEffect, useState, useRef, useCallback, type JSX } from "react";

type CardType = {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
};

type Difficulty = "easy" | "medium" | "hard";

const themes: Record<string, { items: string[]; label: string; emoji: string; color: string }> = {
    gaming: { items: ["🎮", "👾", "💣", "⚡", "🏆", "🔥", "🎯", "🕹️"], label: "Gaming", emoji: "🎮", color: "#FF6B35" },
    fruits: { items: ["🍎", "🍌", "🍇", "🍒", "🥝", "🍍", "🥭", "🍓"], label: "Fruits", emoji: "🍎", color: "#39FF14" },
    numbers: { items: ["1", "2", "3", "4", "5", "6", "7", "8"], label: "Numbers", emoji: "🔢", color: "#00E5FF" },
    hearts: { items: ["❤️", "💖", "💘", "💝", "💗", "💓", "💞", "💜"], label: "Hearts", emoji: "❤️", color: "#FF4D8D" },
    animals: { items: ["🦁", "🐯", "🦊", "🐺", "🦅", "🦋", "🐉", "🦄"], label: "Animals", emoji: "🦁", color: "#A259FF" },
    space: { items: ["🚀", "🌙", "⭐", "🪐", "☄️", "🌌", "👽", "🛸"], label: "Space", emoji: "🚀", color: "#00E5FF" },
};

const difficultyConfig: Record<Difficulty, { pairs: number; label: string; cols: number; time: number }> = {
    easy: { pairs: 6, label: "Easy", cols: 3, time: 90 },
    medium: { pairs: 8, label: "Medium", cols: 4, time: 60 },
    hard: { pairs: 12, label: "Hard", cols: 6, time: 45 },
};

const shuffleCards = (items: string[], pairs: number): CardType[] => {
    const selected = items.slice(0, pairs);
    return [...selected, ...selected]
        .map((item, index) => ({ id: index, value: item, isFlipped: false, isMatched: false }))
        .sort(() => Math.random() - 0.5);
};

// Simple audio via Web Audio API (no file needed)
const playBeep = (freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15) => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(); osc.stop(ctx.currentTime + duration);
    } catch { }
};
const sfx = {
    flip: () => playBeep(440, 0.08, "triangle", 0.12),
    match: () => { playBeep(523, 0.1, "sine", 0.18); setTimeout(() => playBeep(659, 0.15, "sine", 0.18), 100); },
    miss: () => playBeep(200, 0.12, "sawtooth", 0.08),
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playBeep(f, 0.2, "sine", 0.2), i * 120)); },
};

// ─── Particle burst ───────────────────────────────────────────
let particleId = 0;
type Particle = { id: number; x: number; y: number; color: string };

const MemoryGames = (): JSX.Element => {
    const [mode, setMode] = useState("gaming");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [cards, setCards] = useState<CardType[]>([]);
    const [first, setFirst] = useState<CardType | null>(null);
    const [second, setSecond] = useState<CardType | null>(null);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);
    const [moves, setMoves] = useState(0);
    const [win, setWin] = useState(false);
    const [timeLeft, setTimeLeft] = useState(difficultyConfig[difficulty].time);
    const [gameOver, setGameOver] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [showTheme, setShowTheme] = useState(false);
    const [soundOn, setSoundOn] = useState(true);
    const [shake, setShake] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cfg = difficultyConfig[difficulty];
    const themeData = themes[mode];

    const startGame = useCallback(() => {
        setCards(shuffleCards(themeData.items, cfg.pairs));
        setFirst(null); setSecond(null);
        setScore(0); setCombo(0); setBestCombo(0);
        setMoves(0); setWin(false); setGameOver(false);
        setTimeLeft(cfg.time);
    }, [mode, difficulty]);

    useEffect(() => { startGame(); }, [mode, difficulty]);

    // Timer
    useEffect(() => {
        if (win || gameOver) { if (timerRef.current) clearInterval(timerRef.current); return; }
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current!); setGameOver(true); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [win, gameOver, mode, difficulty]);

    // Match logic
    useEffect(() => {
        if (!first || !second) return;
        if (first.value === second.value) {
            if (soundOn) sfx.match();
            setCards(prev => prev.map(c => c.value === first.value ? { ...c, isMatched: true } : c));
            const newCombo = combo + 1;
            setCombo(newCombo);
            setBestCombo(b => Math.max(b, newCombo));
            setScore(prev => prev + 10 + newCombo * 3);
            // particles
            const color = themeData.color;
            const newPs: Particle[] = Array.from({ length: 8 }, () => ({
                id: particleId++, x: Math.random() * 100, y: Math.random() * 100, color,
            }));
            setParticles(ps => [...ps, ...newPs]);
            setTimeout(() => setParticles(ps => ps.filter(p => !newPs.find(n => n.id === p.id))), 800);
            setFirst(null); setSecond(null);
        } else {
            if (soundOn) sfx.miss();
            setCombo(0);
            setScore(prev => Math.max(0, prev - 2));
            setShake(first.id);
            setTimeout(() => setShake(null), 400);
            setTimeout(() => {
                setCards(prev => prev.map(c =>
                    c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
                ));
                setFirst(null); setSecond(null);
            }, 700);
        }
    }, [first, second]);

    // Win check
    useEffect(() => {
        if (cards.length && cards.every(c => c.isMatched)) {
            setWin(true);
            if (soundOn) sfx.win();
            setTimeLeft(t => t); // freeze
        }
    }, [cards]);

    const handleClick = (card: CardType) => {
        if (card.isFlipped || card.isMatched || second || gameOver) return;
        if (soundOn) sfx.flip();
        setMoves(m => m + 1);
        setCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c));
        if (!first) setFirst(card);
        else setSecond(card);
    };

    const timerPct = (timeLeft / cfg.time) * 100;
    const timerColor = timerPct > 50 ? themeData.color : timerPct > 25 ? "#FFD700" : "#FF4D4D";
    const matched = cards.filter(c => c.isMatched).length / 2;

    return (
        <>
            <style>{css}</style>
            <div className="mg-root">
                {/* grid bg */}
                <div className="mg-grid-bg" />
                {/* particles */}
                {particles.map(p => (
                    <div key={p.id} className="mg-particle"
                        style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.color }} />
                ))}

                <div className="mg-wrap">

                    {/* ── Header ── */}
                    <div className="mg-topbar">
                        <div className="mg-logo">
                            <span>{themeData.emoji}</span>
                            <span className="mg-logo-name">Memory Pro</span>
                        </div>
                        <div className="mg-topbar-actions">
                            <button className="mg-icon-btn" onClick={() => setSoundOn(s => !s)} title="Sound">
                                {soundOn ? "🔊" : "🔇"}
                            </button>
                            <button className="mg-icon-btn" onClick={() => setShowTheme(s => !s)} title="Theme">
                                🎨
                            </button>
                            <button className="mg-restart-btn" onClick={startGame}>
                                ↺ Restart
                            </button>
                        </div>
                    </div>

                    {/* ── Theme picker ── */}
                    {showTheme && (
                        <div className="mg-theme-panel">
                            <div className="mg-theme-section">
                                <p className="mg-panel-label">Theme</p>
                                <div className="mg-theme-row">
                                    {Object.entries(themes).map(([key, t]) => (
                                        <button key={key} className={`mg-theme-btn ${mode === key ? "mg-theme-btn--active" : ""}`}
                                            style={mode === key ? { borderColor: t.color, color: t.color, background: `${t.color}14` } : {}}
                                            onClick={() => { setMode(key); setShowTheme(false); }}>
                                            {t.emoji} {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mg-theme-section">
                                <p className="mg-panel-label">Difficulty</p>
                                <div className="mg-theme-row">
                                    {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                                        <button key={d} className={`mg-theme-btn ${difficulty === d ? "mg-theme-btn--active" : ""}`}
                                            style={difficulty === d ? { borderColor: themeData.color, color: themeData.color, background: `${themeData.color}14` } : {}}
                                            onClick={() => { setDifficulty(d); setShowTheme(false); }}>
                                            {difficultyConfig[d].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Stats ── */}
                    <div className="mg-stats">
                        <div className="mg-stat">
                            <span className="mg-stat-label">Score</span>
                            <span className="mg-stat-val" style={{ color: themeData.color }}>{score}</span>
                        </div>
                        <div className="mg-stat">
                            <span className="mg-stat-label">Combo</span>
                            <span className="mg-stat-val" style={{ color: combo > 2 ? "#FFD700" : "#fff" }}>
                                {combo > 0 ? `x${combo}` : "—"}
                            </span>
                        </div>
                        <div className="mg-stat">
                            <span className="mg-stat-label">Moves</span>
                            <span className="mg-stat-val">{moves}</span>
                        </div>
                        <div className="mg-stat">
                            <span className="mg-stat-label">Best Combo</span>
                            <span className="mg-stat-val" style={{ color: "#FFD700" }}>{bestCombo > 0 ? `x${bestCombo}` : "—"}</span>
                        </div>
                    </div>

                    {/* ── Timer & progress ── */}
                    <div className="mg-timer-wrap">
                        <div className="mg-timer-row">
                            <span className="mg-timer-label">⏱</span>
                            <div className="mg-timer-bar-bg">
                                <div className="mg-timer-bar" style={{ width: `${timerPct}%`, background: timerColor }} />
                            </div>
                            <span className="mg-timer-val" style={{ color: timerColor }}>{timeLeft}s</span>
                        </div>
                        <div className="mg-timer-row" style={{ marginTop: 6 }}>
                            <span className="mg-timer-label">🧩</span>
                            <div className="mg-timer-bar-bg">
                                <div className="mg-timer-bar" style={{ width: `${(matched / cfg.pairs) * 100}%`, background: themeData.color }} />
                            </div>
                            <span className="mg-timer-val" style={{ color: themeData.color }}>{matched}/{cfg.pairs}</span>
                        </div>
                    </div>

                    {/* ── Cards grid ── */}
                    <div className="mg-grid" style={{ "--cols": cfg.cols } as React.CSSProperties}>
                        {cards.map((card, i) => {
                            const isActive = card.isFlipped || card.isMatched;
                            const isShaking = shake === card.id || (second && first?.id !== card.id && card.id === second?.id && shake !== null);
                            return (
                                <div key={card.id} className={`mg-card-wrap ${isShaking ? "mg-shake" : ""}`}
                                    style={{ animationDelay: `${i * 0.03}s` }}
                                    onClick={() => handleClick(card)}>
                                    <div className={`mg-card ${isActive ? "mg-card--flipped" : ""}`}>
                                        {/* Front */}
                                        <div className="mg-card-front" style={{ borderColor: `${themeData.color}22` }}>
                                            <div className="mg-card-front-inner">
                                                <span className="mg-card-question">?</span>
                                                <div className="mg-card-shimmer" />
                                            </div>
                                        </div>
                                        {/* Back */}
                                        <div className={`mg-card-back ${card.isMatched ? "mg-card-back--matched" : ""}`}
                                            style={card.isMatched ? { borderColor: `${themeData.color}60`, background: `${themeData.color}10` } : {}}>
                                            <span className="mg-card-value">{card.value}</span>
                                            {card.isMatched && <div className="mg-card-matched-ring" style={{ borderColor: themeData.color }} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Win / Game Over overlay ── */}
                    {(win || gameOver) && (
                        <div className="mg-overlay">
                            <div className="mg-overlay-card" style={{ borderColor: win ? `${themeData.color}50` : "rgba(255,77,77,0.4)" }}>
                                <div className="mg-overlay-icon">{win ? "🏆" : "💀"}</div>
                                <h2 className="mg-overlay-title" style={{ color: win ? themeData.color : "#FF4D4D" }}>
                                    {win ? "Jeet Gaye!" : "Time Up!"}
                                </h2>
                                <p className="mg-overlay-sub">
                                    {win ? "Sab cards match ho gaye! 🎉" : "Agli baar aur tez khelo!"}
                                </p>
                                <div className="mg-overlay-stats">
                                    <div className="mg-overlay-stat">
                                        <span>🏆 Score</span><strong style={{ color: themeData.color }}>{score}</strong>
                                    </div>
                                    <div className="mg-overlay-stat">
                                        <span>🎯 Moves</span><strong>{moves}</strong>
                                    </div>
                                    <div className="mg-overlay-stat">
                                        <span>⚡ Best Combo</span><strong style={{ color: "#FFD700" }}>x{bestCombo}</strong>
                                    </div>
                                    {win && (
                                        <div className="mg-overlay-stat">
                                            <span>⏱ Time Left</span><strong style={{ color: "#39FF14" }}>{timeLeft}s</strong>
                                        </div>
                                    )}
                                </div>
                                <button className="mg-overlay-btn" style={{ background: win ? themeData.color : "#FF4D4D" }}
                                    onClick={startGame}>
                                    {win ? "Dobara Khelo" : "Try Again"} →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* combo toast */}
                    {combo >= 3 && (
                        <div className="mg-combo-toast" style={{ color: themeData.color, borderColor: `${themeData.color}50`, background: `${themeData.color}10` }}>
                            🔥 COMBO x{combo}!
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .mg-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #080810;
    position: relative;
    overflow-x: hidden;
  }
  .mg-grid-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .mg-wrap {
    position: relative; z-index: 1;
    max-width: 700px; margin: 0 auto;
    padding: 20px 16px 48px;
    display: flex; flex-direction: column; gap: 16px;
  }

  /* particles */
  @keyframes particleBurst {
    0%   { transform: scale(1) translate(0,0); opacity: 1; }
    100% { transform: scale(0) translate(var(--dx,20px), var(--dy,-30px)); opacity: 0; }
  }
  .mg-particle {
    position: fixed; width: 8px; height: 8px; border-radius: 50%;
    pointer-events: none; z-index: 999;
    animation: particleBurst 0.7s ease-out forwards;
  }

  /* topbar */
  .mg-topbar {
    display: flex; align-items: center; justify-content: space-between;
  }
  .mg-logo {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
    color: #fff;
  }
  .mg-logo-name { letter-spacing: -0.5px; }
  .mg-topbar-actions { display: flex; align-items: center; gap: 8px; }

  .mg-icon-btn {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    color: #fff; font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .mg-icon-btn:hover { background: rgba(255,255,255,0.1); }

  .mg-restart-btn {
    padding: 8px 16px; border-radius: 50px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7); font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s, color .15s;
  }
  .mg-restart-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

  /* theme panel */
  .mg-theme-panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 16px; padding: 16px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .mg-theme-section { display: flex; flex-direction: column; gap: 8px; }
  .mg-panel-label {
    font-size: 11px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: rgba(255,255,255,0.35); margin: 0;
  }
  .mg-theme-row { display: flex; gap: 7px; flex-wrap: wrap; }
  .mg-theme-btn {
    padding: 6px 13px; border-radius: 50px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all .15s;
  }
  .mg-theme-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
  .mg-theme-btn--active { font-weight: 700; }

  /* stats */
  .mg-stats {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 8px;
  }
  @media (max-width: 480px) { .mg-stats { grid-template-columns: repeat(2,1fr); } }
  .mg-stat {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 10px 12px;
    display: flex; flex-direction: column; gap: 3px;
  }
  .mg-stat-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35); letter-spacing: .04em; text-transform: uppercase; }
  .mg-stat-val   { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; line-height: 1; }

  /* timer */
  .mg-timer-wrap { display: flex; flex-direction: column; gap: 0; }
  .mg-timer-row  { display: flex; align-items: center; gap: 10px; }
  .mg-timer-label { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
  .mg-timer-val   { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; width: 36px; text-align: right; flex-shrink: 0; }
  .mg-timer-bar-bg {
    flex: 1; height: 6px; border-radius: 99px;
    background: rgba(255,255,255,0.07); overflow: hidden;
  }
  .mg-timer-bar {
    height: 100%; border-radius: 99px;
    transition: width .9s linear, background .5s;
  }

  /* cards grid */
  .mg-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols,4), 1fr);
    gap: 10px;
  }

  /* card */
  @keyframes mgCardIn {
    from { opacity:0; transform: scale(0.8) rotate(-4deg); }
    to   { opacity:1; transform: scale(1) rotate(0deg); }
  }
  @keyframes mgShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-5px) rotate(-2deg); }
    40%     { transform: translateX(5px) rotate(2deg); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px); }
  }
  .mg-card-wrap {
    aspect-ratio: 3/4;
    animation: mgCardIn .4s ease both;
    perspective: 600px;
  }
  .mg-shake { animation: mgShake 0.4s ease; }

  .mg-card {
    width: 100%; height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform .45s cubic-bezier(.22,.68,0,1.2);
    cursor: pointer;
  }
  .mg-card--flipped { transform: rotateY(180deg); }

  .mg-card-front, .mg-card-back {
    position: absolute; inset: 0;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    backface-visibility: hidden;
    border: 1px solid;
    overflow: hidden;
  }
  .mg-card-front {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }
  .mg-card-front-inner {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .mg-card-question {
    font-family: 'Syne', sans-serif; font-size: clamp(22px,4vw,32px); font-weight: 800;
    color: rgba(255,255,255,0.15);
  }
  .mg-card-shimmer {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%);
    background-size: 200% 200%;
    animation: shimmer 2.5s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%   { background-position: -100% -100%; }
    100% { background-position: 200% 200%; }
  }

  .mg-card-back {
    transform: rotateY(180deg);
    background: rgba(20,20,32,0.95);
    border-color: rgba(255,255,255,0.1);
  }
  .mg-card-back--matched { animation: matchPulse .5s ease; }
  @keyframes matchPulse {
    0%,100% { transform: rotateY(180deg) scale(1); }
    50%     { transform: rotateY(180deg) scale(1.08); }
  }
  .mg-card-value { font-size: clamp(22px,4vw,36px); position: relative; z-index: 1; }
  .mg-card-matched-ring {
    position: absolute; inset: -1px; border-radius: 14px;
    border: 2px solid; pointer-events: none;
    animation: ringPulse 1.5s ease-in-out infinite;
  }
  @keyframes ringPulse { 0%,100%{opacity:.6} 50%{opacity:1} }

  /* overlay */
  .mg-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(4,4,12,0.85); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .mg-overlay-card {
    background: #0c0c18; border: 1px solid;
    border-radius: 24px; padding: 32px 28px;
    text-align: center; max-width: 340px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .mg-overlay-icon { font-size: 56px; }
  .mg-overlay-title {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
    letter-spacing: -1px; margin: 0;
  }
  .mg-overlay-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin: 0; }
  .mg-overlay-stats {
    width: 100%; display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin: 4px 0;
  }
  .mg-overlay-stat {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 10px;
    display: flex; flex-direction: column; gap: 4px;
    font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 600;
  }
  .mg-overlay-stat strong { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; }
  .mg-overlay-btn {
    padding: 13px 28px; border-radius: 50px; border: none; cursor: pointer;
    color: #000; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
    transition: transform .15s, opacity .15s;
    width: 100%;
  }
  .mg-overlay-btn:hover  { opacity: .88; transform: scale(1.02); }
  .mg-overlay-btn:active { transform: scale(.97); }

  /* combo toast */
  @keyframes comboIn { from{opacity:0;transform:translateX(-50%) translateY(10px) scale(.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
  .mg-combo-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    padding: 8px 20px; border-radius: 50px; border: 1px solid;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800;
    letter-spacing: .04em; z-index: 50;
    animation: comboIn .3s ease;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

export default MemoryGames;