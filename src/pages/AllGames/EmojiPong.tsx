import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Position { x: number; y: number; }
interface Velocity { dx: number; dy: number; }
interface Popup { id: number; x: number; y: number; val: number; }

// ─── Data ───────────────────────────────────────────────────────────
const EMOJI_OPTIONS = [
    { emoji: '😃', label: 'Happy', color: '#FF6B35' },
    { emoji: '🔥', label: 'Fire', color: '#FF4D4D' },
    { emoji: '⚡', label: 'Zap', color: '#00E5FF' },
    { emoji: '💎', label: 'Diamond', color: '#A259FF' },
    { emoji: '❤️‍🩹', label: 'Heart', color: '#39FF14' },
    { emoji: '🎯', label: 'Target', color: '#FF4D8D' },
    { emoji: '👾', label: 'Alien', color: '#FFD700' },
    { emoji: '🏆', label: 'Trophy', color: '#FFB800' },
];

const BG_SOLIDS = [
    { label: 'Night', value: '#080810' },
    { label: 'Indigo', value: '#0f0c29' },
    { label: 'Forest', value: '#0a1a0a' },
    { label: 'Rose', value: '#1a080f' },
    { label: 'Ocean', value: '#061020' },
    { label: 'Ash', value: '#111114' },
    { label: 'Pink', value: 'pink' },
];

const BG_GRADIENTS = [
    { label: 'Nebula', value: 'linear-gradient(135deg,#0d001a 0%,#001a2e 100%)' },
    { label: 'Sunset', value: 'linear-gradient(135deg,#1a0500 0%,#0d0020 100%)' },
    { label: 'Aurora', value: 'linear-gradient(135deg,#001a12 0%,#0a0020 100%)' },
    { label: 'Deep Sea', value: 'linear-gradient(135deg,#000d1a 0%,#001a14 100%)' },
    { label: 'Volcano', value: 'linear-gradient(135deg,#1a0000 0%,#0d0800 100%)' },
    { label: 'Cosmic', value: 'linear-gradient(135deg,#08001a 0%,#001208 100%)' },
    { label: 'Midnight', value: 'linear-gradient(135deg,#000428 0%,#004e92 100%)' },
    { label: 'Lava', value: 'linear-gradient(135deg,#200122 0%,#6f0000 100%)' },
];

const EMOJI_SIZE = 48;
const PADDLE_H = 12;

const vib = (pattern: number | number[]) => {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { }
};

// ─── Component ──────────────────────────────────────────────────────
const EmojiGame: React.FC = () => {
    const [phase, setPhase] = useState<'select' | 'play' | 'over'>('select');
    const [selectedEmoji, setSelected] = useState(EMOJI_OPTIONS[0]);
    const [bgValue, setBgValue] = useState(BG_SOLIDS[0].value);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('eg_hi') || 0));
    const [combo, setCombo] = useState(0);
    const [popups, setPopups] = useState<Popup[]>([]);
    const [trail, setTrail] = useState<Position[]>([]);
    const [scoreFlash, setScoreFlash] = useState(false);
    const [, forceRender] = useState(0);

    const emojiPos = useRef<Position>({ x: 160, y: 120 });
    const velocity = useRef<Velocity>({ dx: 4.5, dy: 4.5 });
    const paddleX = useRef<number>(0);
    const targetPaddleX = useRef<number>(0);
    const rafRef = useRef<number>(0);
    const paddleRafRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);
    const popupIdRef = useRef(0);
    const gameActive = useRef(false);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { comboRef.current = combo; }, [combo]);

    const addPopup = (x: number, y: number, val: number) => {
        const id = popupIdRef.current++;
        setPopups(p => [...p, { id, x, y, val }]);
        setTimeout(() => setPopups(p => p.filter(pp => pp.id !== id)), 900);
    };

    const flashScore = () => {
        setScoreFlash(true);
        setTimeout(() => setScoreFlash(false), 200);
    };

    // Lock body scroll when game is active
    useEffect(() => {
        if (phase === 'play') {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        };
    }, [phase]);

    // Smooth paddle animation loop
    useEffect(() => {
        if (phase !== 'play') {
            if (paddleRafRef.current) cancelAnimationFrame(paddleRafRef.current);
            return;
        }

        const smoothPaddle = () => {
            const diff = targetPaddleX.current - paddleX.current;
            paddleX.current += diff * 0.28;
            forceRender(n => n + 1);
            paddleRafRef.current = requestAnimationFrame(smoothPaddle);
        };

        paddleRafRef.current = requestAnimationFrame(smoothPaddle);
        return () => {
            if (paddleRafRef.current) cancelAnimationFrame(paddleRafRef.current);
        };
    }, [phase]);

    // ── Start Game ──────────────────────────────────────────────────
    const startGame = useCallback(() => {
        vib([40, 60, 40, 60, 100]);

        const w = window.innerWidth;
        const h = window.innerHeight;
        emojiPos.current = { x: w / 2 - EMOJI_SIZE / 2, y: h / 3 };
        velocity.current = { dx: 4.5, dy: 4.5 };
        const initialPaddleW = Math.min(110 + comboRef.current * 1.2, 180);
        const startX = w / 2 - initialPaddleW / 2;
        paddleX.current = startX;
        targetPaddleX.current = startX;
        scoreRef.current = 0;
        comboRef.current = 0;
        setScore(0);
        setCombo(0);
        setPopups([]);
        setTrail([]);
        gameActive.current = true;
        setPhase('play');
    }, []);

    // ── Game Loop ────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'play') {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }
        gameActive.current = true;

        const loop = () => {
            if (!gameActive.current) return;

            const w = window.innerWidth;
            const h = window.innerHeight;
            const paddleW = Math.min(110 + comboRef.current * 1.2, 180);
            let { x, y } = emojiPos.current;
            let { dx, dy } = velocity.current;

            x += dx; y += dy;

            // Wall bounces
            if (x <= 0) {
                x = 0;
                dx = Math.abs(dx);
                vib(8);
            }
            if (x + EMOJI_SIZE >= w) {
                x = w - EMOJI_SIZE;
                dx = -Math.abs(dx);
                vib(8);
            }
            if (y <= 0) {
                y = 0;
                dy = Math.abs(dy);
                vib(8);
            }

            // Paddle collision
            const paddleY = h - 42;
            if (
                dy > 0 &&
                y + EMOJI_SIZE >= paddleY &&
                y + EMOJI_SIZE <= paddleY + PADDLE_H + Math.abs(dy) + 4 &&
                x + EMOJI_SIZE > paddleX.current &&
                x < paddleX.current + paddleW
            ) {
                const hitPos = (x + EMOJI_SIZE / 2) - (paddleX.current + paddleW / 2);
                const angleFactor = hitPos / (paddleW / 2) * 0.7;

                dy = -Math.abs(dy);
                dx += angleFactor * 2.5;

                dx = Math.min(Math.max(dx, -12), 12);
                dy = Math.min(Math.max(dy, -12), 12);

                if (Math.abs(dx) < 3) dx = dx > 0 ? 3 : -3;

                y = paddleY - EMOJI_SIZE;
                const newCombo = comboRef.current + 1;
                comboRef.current = newCombo;
                const pts = 1 + Math.floor(newCombo / 4);
                scoreRef.current += pts;
                setScore(scoreRef.current);
                setCombo(newCombo);
                addPopup(x, y - 15, pts);
                flashScore();
                vib(newCombo >= 5 ? 50 : 18);
            }

            // Bottom → game over
            if (y + EMOJI_SIZE > h) {
                gameActive.current = false;
                setPhase('over');
                vib([80, 40, 80]);
                if (scoreRef.current > highScore) {
                    setHighScore(scoreRef.current);
                    localStorage.setItem('eg_hi', String(scoreRef.current));
                }
                return;
            }

            emojiPos.current = { x, y };
            velocity.current = { dx, dy };
            setTrail(t => [...t.slice(-8), { x: x + EMOJI_SIZE / 2, y: y + EMOJI_SIZE / 2 }]);
            forceRender(n => n + 1);
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            gameActive.current = false;
        };
    }, [phase, highScore]);

    // ── Global event handlers for paddle control ─────────────────────
    useEffect(() => {
        if (phase !== 'play') return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            let clientX: number;

            if ('touches' in e) {
                if (e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                } else {
                    return;
                }
            } else {
                clientX = e.clientX;
            }

            const paddleW = Math.min(110 + comboRef.current * 1.2, 180);
            let next = clientX - paddleW / 2;
            const maxX = window.innerWidth - paddleW;
            next = Math.max(0, Math.min(next, maxX));
            targetPaddleX.current = next;
        };

        const handleStart = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            let clientX: number;

            if ('touches' in e) {
                if (e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                } else {
                    return;
                }
            } else {
                clientX = e.clientX;
            }

            const paddleW = Math.min(110 + comboRef.current * 1.2, 180);
            let next = clientX - paddleW / 2;
            const maxX = window.innerWidth - paddleW;
            next = Math.max(0, Math.min(next, maxX));
            targetPaddleX.current = next;
        };

        const handleEnd = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            // Optional: Add any end logic here
        };

        // Add event listeners to window for better mobile support
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('mousedown', handleStart);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('mousedown', handleStart);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchstart', handleStart);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [phase]);

    const paddleW = Math.min(110 + combo * 1.2, 180);
    const accent = selectedEmoji.color;

    // ── SELECT SCREEN ────────────────────────────────────────────────
    if (phase === 'select') return (
        <>
            <style>{css}</style>
            <div className="eg-root" style={{ background: bgValue }}>
                <div className="eg-grid-bg" />
                <div className="eg-select-wrap">
                    <div className="eg-brand">
                        <span className="eg-brand-dot" style={{ background: accent }} />
                        <span>EmojiDrop</span>
                    </div>

                    {highScore > 0 && (
                        <div className="eg-hi-pill">🏆 Best: {highScore}</div>
                    )}

                    <h2 className="eg-section-title">
                        Choose Your <span style={{ color: accent }}>Emoji</span>
                    </h2>
                    <div className="eg-emoji-grid">
                        {EMOJI_OPTIONS.map(opt => {
                            const active = selectedEmoji.emoji === opt.emoji;
                            return (
                                <button key={opt.emoji} className="eg-emoji-opt"
                                    style={active ? {
                                        borderColor: opt.color,
                                        background: opt.color + '18',
                                        boxShadow: `0 0 18px ${opt.color}28`,
                                    } : {}}
                                    onClick={() => setSelected(opt)}>
                                    <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                                    <span style={{
                                        fontSize: 9, fontWeight: 600, letterSpacing: '.04em',
                                        color: active ? opt.color : 'rgba(255,255,255,.38)',
                                    }}>
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <h2 className="eg-section-title" style={{ marginTop: 10 }}>
                        Background <span style={{ color: accent }}>Color</span>
                    </h2>

                    <div className="eg-swatch-section">
                        <p className="eg-swatch-label">Solid</p>
                        <div className="eg-swatch-row">
                            {BG_SOLIDS.map(bg => (
                                <button key={bg.value} className="eg-swatch"
                                    style={{
                                        background: bg.value,
                                        borderColor: bgValue === bg.value ? accent : 'rgba(255,255,255,.12)',
                                        boxShadow: bgValue === bg.value ? `0 0 10px ${accent}55` : 'none',
                                    }}
                                    title={bg.label}
                                    onClick={() => setBgValue(bg.value)} />
                            ))}
                        </div>
                    </div>

                    <div className="eg-swatch-section">
                        <p className="eg-swatch-label">Gradient</p>
                        <div className="eg-swatch-row">
                            {BG_GRADIENTS.map(bg => (
                                <button key={bg.value} className="eg-swatch"
                                    style={{
                                        background: bg.value,
                                        borderColor: bgValue === bg.value ? accent : 'rgba(255,255,255,.12)',
                                        boxShadow: bgValue === bg.value ? `0 0 10px ${accent}55` : 'none',
                                    }}
                                    title={bg.label}
                                    onClick={() => setBgValue(bg.value)} />
                            ))}
                        </div>
                    </div>

                    <div className="eg-swatch-section">
                        <p className="eg-swatch-label">Custom</p>
                        <label className="eg-custom-lbl" style={{ borderColor: accent + '50' }}>
                            🎨
                            <input
                                type="color"
                                value={bgValue.startsWith('linear') ? '#080810' : bgValue}
                                onChange={e => setBgValue(e.target.value)}
                                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                            />
                        </label>
                    </div>

                    <button className="eg-play-btn" style={{ background: accent }} onClick={startGame}>
                        ▶ Play Now
                    </button>
                    <p className="eg-hint">👆 Move finger or mouse to slide paddle</p>
                </div>
            </div>
        </>
    );

    // ── GAME OVER SCREEN ─────────────────────────────────────────────
    if (phase === 'over') return (
        <>
            <style>{css}</style>
            <div className="eg-root" style={{ background: bgValue }}>
                <div className="eg-grid-bg" />
                <div className="eg-over-wrap">
                    <div className="eg-over-card" style={{ borderColor: accent + '45' }}>
                        <div style={{ fontSize: 56 }}>{selectedEmoji.emoji}</div>
                        <h1 className="eg-over-title" style={{ color: accent }}>Game Over!</h1>
                        <div className="eg-over-stats">
                            <div className="eg-over-stat">
                                <span>🏆 Score</span>
                                <strong style={{ color: accent }}>{score}</strong>
                            </div>
                            <div className="eg-over-stat">
                                <span>⭐ Best</span>
                                <strong style={{ color: '#FFD700' }}>{highScore}</strong>
                            </div>
                            <div className="eg-over-stat">
                                <span>⚡ Combo</span>
                                <strong style={{ color: '#fff' }}>x{combo}</strong>
                            </div>
                        </div>
                        {score >= highScore && score > 0 && (
                            <div className="eg-new-best"
                                style={{ color: accent, borderColor: accent + '50', background: accent + '12' }}>
                                🎉 New High Score!
                            </div>
                        )}
                        <button className="eg-play-btn" style={{ background: accent }} onClick={startGame}>
                            Play Again →
                        </button>
                        <button className="eg-outline-btn"
                            style={{ borderColor: accent + '60', color: accent }}
                            onClick={() => setPhase('select')}>
                            Change Emoji
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    // ── PLAY SCREEN ──────────────────────────────────────────────────
    return (
        <>
            <style>{css}</style>
            <div
                className="eg-root"
                style={{ background: bgValue, cursor: 'none', touchAction: 'none' }}
            >
                <div className="eg-grid-bg" />

                <div
                    className="eg-center-score"
                    style={{
                        color: accent,
                        opacity: scoreFlash ? 0.32 : 0.18,
                    }}
                >
                    {score}
                </div>

                <div className="eg-top-hud">
                    {combo >= 2 && (
                        <div className="eg-combo-badge"
                            style={{ color: accent, borderColor: accent + '50', background: accent + '12' }}>
                            🔥 x{combo}
                        </div>
                    )}
                    <div style={{ flex: 1 }} />
                    <div className="eg-hud-hi">Best {highScore}</div>
                </div>

                {trail.map((pos, i) => (
                    <div key={i} className="eg-trail" style={{
                        left: pos.x - 4,
                        top: pos.y - 4,
                        opacity: (i / trail.length) * 0.3,
                        background: accent,
                        transform: `scale(${0.3 + (i / trail.length) * 0.7})`,
                    }} />
                ))}

                <div className="eg-ball" style={{
                    left: emojiPos.current.x,
                    top: emojiPos.current.y,
                    filter: `drop-shadow(0 0 12px ${accent}90)`,
                }}>
                    {selectedEmoji.emoji}
                </div>

                {popups.map(p => (
                    <div key={p.id} className="eg-popup" style={{ left: p.x, top: p.y, color: accent }}>
                        +{p.val}
                    </div>
                ))}

                <div
                    className="eg-paddle"
                    style={{
                        left: paddleX.current,
                        width: paddleW,
                        background: `linear-gradient(90deg,${accent}cc,${accent})`,
                        boxShadow: `0 0 18px ${accent}80, 0 0 32px ${accent}40`,
                    }}
                />

                <div className="eg-danger"
                    style={{ background: `linear-gradient(to top,${accent}08,transparent)` }} />
            </div>
        </>
    );
};

// ─── CSS ─────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .eg-root {
    position: fixed; inset: 0;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
  }
  
  .eg-grid-bg {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ── SELECT ── */
  .eg-select-wrap {
    position: relative; z-index: 1;
    height: 100%; overflow-y: auto;
    display: flex; flex-direction: column; align-items: center;
    padding: 98px 20px 56px;
    gap: 10px;
  }
  .eg-select-wrap::-webkit-scrollbar { width: 0; }

  .eg-brand {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800; color: #fff;
  }
  .eg-brand-dot {
    width: 10px; height: 10px; border-radius: 50%;
    animation: egPulse 1.8s ease-in-out infinite;
  }
  @keyframes egPulse {
    0%,100% { opacity:.35; transform:scale(1); }
    50%     { opacity:1;   transform:scale(1.35); }
  }

  .eg-hi-pill {
    padding: 5px 14px; border-radius: 50px;
    font-size: 12px; font-weight: 700;
    color: #FFD700; border: 1px solid #FFD70040; background: #FFD70010;
    font-family: 'Syne', sans-serif;
  }

  .eg-section-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(18px, 4.5vw, 24px); font-weight: 800;
    letter-spacing: -.5px; color: #fff; text-align: center;
  }

  .eg-emoji-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 9px; width: 100%; max-width: 360px;
  }
  .eg-emoji-opt {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 11px 6px; border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    cursor: pointer; transition: all .2s;
  }
  .eg-emoji-opt:hover { background: rgba(255,255,255,0.09); transform: translateY(-2px); }

  .eg-swatch-section {
    width: 100%; max-width: 360px;
    display: flex; flex-direction: column; gap: 7px;
  }
  .eg-swatch-label {
    font-size: 9px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: rgba(255,255,255,.28);
  }
  .eg-swatch-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .eg-swatch {
    width: 32px; height: 32px; border-radius: 50%;
    border: 2px solid; cursor: pointer;
    transition: transform .18s, box-shadow .18s;
  }
  .eg-swatch:hover { transform: scale(1.18); }

  .eg-custom-lbl {
    width: 32px; height: 32px; border-radius: 50%;
    border: 2px dashed; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; position: relative;
    background: rgba(255,255,255,0.04);
    transition: transform .18s;
  }
  .eg-custom-lbl:hover { transform: scale(1.18); }

  .eg-play-btn {
    padding: 14px 32px; border-radius: 50px; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
    color: #000; width: 100%; max-width: 270px; margin-top: 6px;
    transition: transform .15s, opacity .15s;
  }
  .eg-play-btn:hover  { transform: scale(1.03); opacity: .9; }
  .eg-play-btn:active { transform: scale(.97); }

  .eg-hint {
    font-size: 11px; color: rgba(255,255,255,.28); text-align: center;
  }

  /* ── GAME OVER ── */
  .eg-over-wrap {
    position: relative; z-index: 1;
    height: 100%; display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  @keyframes overCardIn {
    from { opacity:0; transform:scale(.88); }
    to   { opacity:1; transform:scale(1); }
  }
  .eg-over-card {
    background: rgba(10,10,20,0.96); border: 1px solid;
    border-radius: 24px; padding: 30px 22px;
    text-align: center; max-width: 330px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 13px;
    animation: overCardIn .4s ease;
  }
  .eg-over-title {
    font-family: 'Syne', sans-serif;
    font-size: 30px; font-weight: 800; letter-spacing: -1px;
  }
  .eg-over-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 8px; width: 100%;
  }
  .eg-over-stat {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 10px 6px;
    display: flex; flex-direction: column; gap: 5px;
    font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.38);
  }
  .eg-over-stat strong {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
  }
  .eg-new-best {
    padding: 5px 16px; border-radius: 50px;
    font-size: 12px; font-weight: 700; border: 1px solid;
    font-family: 'Syne', sans-serif;
  }
  .eg-outline-btn {
    padding: 12px 24px; border-radius: 50px;
    background: transparent; border: 1px solid; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    width: 100%; max-width: 270px;
    transition: transform .15s, opacity .15s;
  }
  .eg-outline-btn:hover { opacity: .8; transform: scale(1.02); }

  /* ── PLAY ── */
  .eg-center-score {
    position: absolute;
    left: 50%; top: 38%;
    transform: translate(-50%, -50%);
    font-family: 'Syne', sans-serif;
    font-size: clamp(88px, 20vw, 150px);
    font-weight: 800;
    letter-spacing: -4px;
    line-height: 1;
    pointer-events: none;
    z-index: 2;
    user-select: none;
    transition: opacity .2s;
  }

  .eg-top-hud {
    position: absolute; top: 0; left: 0; right: 0; z-index: 10;
    display: flex; align-items: center;
    padding: 14px 16px;
    pointer-events: none;
  }
  .eg-combo-badge {
    padding: 5px 12px; border-radius: 50px;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800;
    border: 1px solid;
  }
  .eg-hud-hi {
    font-size: 11px; font-weight: 600; color: rgba(255,255,255,.28);
  }

  .eg-trail {
    position: absolute; width: 8px; height: 8px; border-radius: 50%;
    pointer-events: none; z-index: 1;
  }

  .eg-ball {
    position: absolute; z-index: 5;
    font-size: 42px; line-height: 1;
    width: 48px; height: 48px;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }

  @keyframes popupFly {
    0%   { opacity:1; transform:translateY(0) scale(1); }
    100% { opacity:0; transform:translateY(-50px) scale(1.4); }
  }
  .eg-popup {
    position: absolute; z-index: 20; pointer-events: none;
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
    animation: popupFly .85s ease forwards;
  }

  .eg-paddle {
    position: absolute;
    bottom: 28px;
    height: 12px;
    border-radius: 99px;
    z-index: 5;
    will-change: left;
  }

  .eg-danger {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 60px;
    pointer-events: none; z-index: 1;
  }

  @media (max-width: 600px) {
    .eg-ball { font-size: 36px; width: 44px; height: 44px; }
    .eg-paddle { bottom: 22px; height: 10px; }
    .eg-danger { height: 50px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

export default EmojiGame;