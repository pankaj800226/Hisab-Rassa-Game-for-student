import { useState } from "react";
import hisab from "../gamesImg/hisab.png";
import puzzel from "../gamesImg/puzzel.png";
import memory from '../gamesImg/memorygames.png'
import tictactoe from '../gamesImg/tictactoe.png'
import buirdgame from '../gamesImg/buirdgame.png'
import sudoku from '../gamesImg/sudoku.png'
import numbergame from '../gamesImg/numbergames.png'


import { Link } from "react-router-dom";

const games = [
  {
    id: 1,
    name: "Hisab Game",
    tag: "Math Battle",
    emoji: "🧮",
    color: "#FF6B35", // Orange
    glow: "rgba(255,107,53,0.35)",
    img: hisab,
    desc: "Do-khiladi ka zabardast number battle! Fastest math wins the tug.",
    players: "2 Players",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/hisabgame",
  },
  {
    id: 2,
    name: "Puzzel Game",
    tag: "Mind Puzzle",
    emoji: "🧩",
    color: "#A259FF", // Purple
    glow: "rgba(162,89,255,0.35)",
    img: puzzel,
    desc: "Socho, samjho, jeeto! Har puzzle ek naya challenge hai.",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/puzzelgame",
  },
  {
    id: 3,
    name: "Memory Game",
    tag: "Memory Game",
    emoji: "🧠",
    color: "#FF4D6D", // Pink/Red
    glow: "rgba(255,77,109,0.35)",
    img: memory,
    desc: "Yaadasht ka imtihan! Find the matching pairs to win.",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/memorygame",
  },
  {
    id: 4,
    name: "Tic Tac Toe",
    tag: "Classic Duel",
    emoji: "❌",
    color: "#4CC9F0", // Sky Blue
    glow: "rgba(76,201,240,0.35)",
    img: tictactoe,
    desc: "The ultimate X vs O battle. Can you get three in a row?",
    players: "2 Players",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/tictactoi",
  },
  {
    id: 5,
    name: "Flappy Bird",
    tag: "Arcade",
    emoji: "🐦",
    color: "#FFB703", // Yellow/Gold
    glow: "rgba(255,183,3,0.35)",
    img: buirdgame,
    desc: "Tap to fly and dodge the pipes. How far can you go?",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/flappybird",
  },
  {
    id: 6,
    name: "Sudoku",
    tag: "Logic",
    emoji: "🔢",
    color: "#2EC4B6", // Teal
    glow: "rgba(46,196,182,0.35)",
    img: sudoku,
    desc: "Fill the grid with logic. No math, just pure brain power.",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/sudoku",
  },
  {
    id: 7,
    name: "Number Game",
    tag: "Strategy",
    emoji: "🎯",
    color: "#7209B7", // Deep Violet
    glow: "rgba(114,9,183,0.35)",
    img: numbergame,
    desc: "Master the numbers and beat the high score.",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/numbergame",
  },
];

const GameCard = ({ game, index }: { game: (typeof games)[0]; index: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="ag-card"
      style={{ animationDelay: `${index * 0.12}s`, "--accent": game.color, "--glow": game.glow } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* top accent line */}
      <div className="ag-card-line" style={{ background: game.color }} />

      {/* Image area */}
      <div className="ag-img-wrap">
        <img src={game.img} alt={game.name} className="ag-img" />
        {/* overlay */}
        <div className="ag-img-overlay" style={{ opacity: hovered ? 1 : 0 }} />
        {/* emoji badge */}
        <div className="ag-emoji" style={{ background: `${game.color}22`, borderColor: `${game.color}50` }}>
          {game.emoji}
        </div>
        {/* tag pill */}
        <div className="ag-tag" style={{ color: game.color, background: `${game.color}18`, borderColor: `${game.color}40` }}>
          {game.tag}
        </div>
      </div>

      {/* Body */}
      <div className="ag-body">
        <h3 className="ag-name">{game.name}</h3>
        <p className="ag-desc">{game.desc}</p>

        {/* meta row */}
        <div className="ag-meta">
          <span className="ag-meta-pill">👥 {game.players}</span>
          <span className="ag-meta-pill">⚡
            {game.difficulty.map((diff, i) => (
              <span key={i} className={`ag-meta-pill ${diff === "Hard" ? "text-red-500" : diff === "Medium" ? "text-yellow-500" : "text-green-500"}`}>{diff}</span>
            ))}
          </span>
        </div>

        {/* CTA */}
        <Link to={game.path} className="ag-btn" style={{ background: game.color, boxShadow: `0 0 18px ${game.glow}` }}>
          Khelo Abhi
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      {/* hover glow */}
      <div className="ag-card-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${game.glow}, transparent 70%)`, opacity: hovered ? 1 : 0 }} />
    </div>
  );
};

const AllGames = () => {
  return (
    <>
      <style>{css}</style>
      <div className="ag-root">
        {/* section header */}
        <div className="ag-header">
          <div className="ag-header-pill">
            <span className="ag-header-dot" />
            Sabhi Games
          </div>
          <h2 className="ag-title">
            Apna Game <span className="ag-title-accent">Chuno</span>
          </h2>
          <p className="ag-subtitle">
            Har game ek naya challenge — math se mind tak, sab kuch ek jagah.
          </p>
        </div>

        {/* grid */}
        <div className="ag-grid">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .ag-root {
    font-family: 'DM Sans', sans-serif;
    padding: 48px 24px 64px;
    min-height: 100vh;
    background: #080810;
    position: relative;
  }
  .ag-root::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ── Header ── */
  .ag-header {
    position: relative; z-index: 1;
    text-align: center; margin-bottom: 48px;
  }
  .ag-header-pill {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,107,53,0.1);
    border: 1px solid rgba(255,107,53,0.3);
    border-radius: 50px; padding: 5px 14px;
    font-size: 11px; font-weight: 600;
    color: #FF6B35; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 16px;
  }
  .ag-header-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #FF6B35;
    animation: agPulse 1.5s ease-in-out infinite;
  }
  @keyframes agPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }

  .ag-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 800; letter-spacing: -1.5px;
    color: #fff; margin: 0 0 12px;
    line-height: 1.1;
  }
  .ag-title-accent { color: #FF6B35; }
  .ag-subtitle {
    font-size: 15px; color: rgba(255,255,255,0.45);
    max-width: 420px; margin: 0 auto; line-height: 1.7;
  }

  /* ── Grid ── */
  .ag-grid {
    position: relative; z-index: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    max-width: 900px; margin: 0 auto;
  }

  /* ── Card ── */
  @keyframes agCardIn {
    from { opacity: 0; transform: translateY(28px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ag-card {
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; overflow: hidden;
    display: flex; flex-direction: column;
    transition: transform 0.28s cubic-bezier(.22,.68,0,1.2), border-color 0.25s, box-shadow 0.25s;
    animation: agCardIn 0.55s ease both;
    cursor: pointer;
  }
  .ag-card:hover {
    transform: translateY(-6px) scale(1.01);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  .ag-card-line {
    height: 2px; width: 100%; flex-shrink: 0;
    transition: opacity 0.25s;
    opacity: 0.7;
  }
  .ag-card:hover .ag-card-line { opacity: 1; }

  /* hover radial glow */
  .ag-card-glow {
    position: absolute; inset: 0; top: -40%; pointer-events: none;
    transition: opacity 0.35s;
    border-radius: 20px;
  }

  /* ── Image ── */
  .ag-img-wrap {
    position: relative; width: 100%; height: 200px;
    overflow: hidden;
  }
  .ag-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.5s cubic-bezier(.22,.68,0,1.2);
    display: block;
  }
  .ag-card:hover .ag-img { transform: scale(1.07); }

  .ag-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(8,8,16,0.85) 100%);
    transition: opacity 0.3s;
  }

  .ag-emoji {
    position: absolute; top: 12px; right: 12px;
    width: 38px; height: 38px; border-radius: 10px;
    border: 1px solid;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    backdrop-filter: blur(8px);
  }

  .ag-tag {
    position: absolute; bottom: 12px; left: 12px;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 50px;
    border: 1px solid;
    backdrop-filter: blur(8px);
  }

  /* ── Body ── */
  .ag-body {
    position: relative; z-index: 1;
    padding: 18px 20px 20px;
    display: flex; flex-direction: column; gap: 10px;
    flex: 1;
  }

  .ag-name {
    font-family: 'Syne', sans-serif;
    font-size: 20px; font-weight: 800;
    letter-spacing: -0.5px; color: #fff; margin: 0;
  }

  .ag-desc {
    font-size: 13px; color: rgba(255,255,255,0.45);
    line-height: 1.65; margin: 0;
  }

  .ag-meta {
    display: flex; gap: 7px; flex-wrap: wrap;
    margin-top: 2px;
  }
  .ag-meta-pill {
    font-size: 11px; font-weight: 600;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.5);
    padding: 4px 10px; border-radius: 50px;
    letter-spacing: 0.03em;
  }

  .ag-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    color: #000; text-decoration: none;
    padding: 12px 20px; border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 700;
    margin-top: 6px;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  }
  .ag-btn:hover  { transform: scale(1.03); opacity: 0.92; }
  .ag-btn:active { transform: scale(0.97); }
`;

export default AllGames;