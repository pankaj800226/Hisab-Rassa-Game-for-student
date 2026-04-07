import { useState } from "react";
import hisab from "../gamesImg/hisab.png";
import puzzel from "../gamesImg/puzzel.png";
import memory from '../gamesImg/memorygames.png';
import tictactoe from '../gamesImg/tictactoe.png';
import buirdgame from '../gamesImg/buirdgame.png';
import sudoku from '../gamesImg/sudoku.png';
import numbergame from '../gamesImg/numbergames.png';
import emojigame from '../gamesImg/emojigame.png'

import { Link } from "react-router-dom";

const games = [
  {
    id: 1,
    name: "Hisab Game",
    tag: "Math Battle",
    emoji: "🧮",
    color: "#FF6B35",
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
    color: "#A259FF",
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
    color: "#FF4D6D",
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
    color: "#4CC9F0",
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
    color: "#FFB703",
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
    color: "#2EC4B6",
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
    color: "#7209B7",
    glow: "rgba(114,9,183,0.35)",
    img: numbergame,
    desc: "Master the numbers and beat the high score.",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/numbergame",
  },
  {
    id: 8,
    name: "Emoji Pong",
    tag: "Arcade",
    emoji: "👾",
    color: "#FF6B35",
    glow: "rgba(255,107,53,0.35)",
    img: emojigame,
    desc: "Bounce the emoji and score points!",
    players: "1 Player",
    difficulty: ["Medium", "Low", "Hard"],
    path: "/emojipong",
  }
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
      <div className="ag-card-line" style={{ background: game.color }} />
      <div className="ag-img-wrap">
        <img src={game.img} alt={game.name} className="ag-img" />
        <div className="ag-img-overlay" style={{ opacity: hovered ? 1 : 0 }} />
        <div className="ag-emoji" style={{ background: `${game.color}22`, borderColor: `${game.color}50` }}>
          {game.emoji}
        </div>
        <div className="ag-tag" style={{ color: game.color, background: `${game.color}18`, borderColor: `${game.color}40` }}>
          {game.tag}
        </div>
      </div>
      <div className="ag-body">
        <h3 className="ag-name">{game.name}</h3>
        <p className="ag-desc">{game.desc}</p>
        <div className="ag-meta">
          <span className="ag-meta-pill">👥 {game.players}</span>
          <span className="ag-meta-pill">
            ⚡ {game.difficulty.map((diff, i) => (
              <span key={i} className={`${diff === "Hard" ? "text-red-500" : diff === "Medium" ? "text-yellow-500" : "text-green-500"}`}>
                {diff}{i !== game.difficulty.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </div>
        <Link to={game.path} className="ag-btn" style={{ background: game.color, boxShadow: `0 0 18px ${game.glow}` }}>
          Khelo Abhi
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
      <div className="ag-card-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${game.glow}, transparent 70%)`, opacity: hovered ? 1 : 0 }} />
    </div>
  );
};

const AllGames = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{css}</style>
      <div className="ag-root">
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

        {/* Search Bar */}
        <div className="ag-search-container">
          <div className="ag-search-wrapper">
            <svg className="ag-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="7.5" />
              <line x1="16" y1="16" x2="22" y2="22" />
            </svg>
            <input
              type="text"
              className="ag-search-input"
              placeholder="Search games by name, tag or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="ag-search-clear" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="ag-results-count">
          {filteredGames.length} game{filteredGames.length !== 1 ? "s" : ""} found
        </div>

        {/* Grid - 3 cards per row */}
        <div className="ag-grid">
          {filteredGames.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        {/* No results message */}
        {filteredGames.length === 0 && (
          <div className="ag-no-results">
            <span className="ag-no-results-emoji">🔍</span>
            <p>No games found matching "{searchTerm}"</p>
            <button className="ag-no-results-btn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        )}
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

  /* Header */
  .ag-header {
    position: relative; z-index: 1;
    text-align: center; margin-bottom: 32px;
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

  /* Search Bar */
  .ag-search-container {
    position: relative; z-index: 1;
    max-width: 500px; margin: 0 auto 20px;
  }
  .ag-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .ag-search-icon {
    position: absolute;
    left: 16px;
    color: rgba(255,255,255,0.4);
    pointer-events: none;
  }
  .ag-search-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 60px;
    padding: 14px 20px 14px 46px;
    font-size: 14px;
    color: white;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .ag-search-input:focus {
    outline: none;
    border-color: #FF6B35;
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.2);
  }
  .ag-search-input::placeholder {
    color: rgba(255,255,255,0.3);
  }
  .ag-search-clear {
    position: absolute;
    right: 16px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  .ag-search-clear:hover {
    background: rgba(255,255,255,0.2);
    color: white;
  }

  /* Results Count */
  .ag-results-count {
    text-align: center;
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    margin-bottom: 28px;
    letter-spacing: 0.03em;
  }

  /* Grid - 3 cards per row */
  .ag-grid {
    position: relative; z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
    max-width: 1100px;
    margin: 0 auto;
  }

  /* Responsive: 2 cards on tablet, 1 on mobile */
  @media (max-width: 900px) {
    .ag-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
  @media (max-width: 600px) {
    .ag-grid {
      grid-template-columns: 1fr;
      gap: 18px;
    }
  }

  /* No Results */
  .ag-no-results {
    text-align: center;
    padding: 60px 20px;
    background: rgba(255,255,255,0.02);
    border-radius: 24px;
    margin-top: 20px;
  }
  .ag-no-results-emoji {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
  }
  .ag-no-results p {
    color: rgba(255,255,255,0.5);
    font-size: 16px;
    margin-bottom: 20px;
  }
  .ag-no-results-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 8px 20px;
    border-radius: 40px;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ag-no-results-btn:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }

  /* Card Styles */
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

  .ag-card-glow {
    position: absolute; inset: 0; top: -40%; pointer-events: none;
    transition: opacity 0.35s;
    border-radius: 20px;
  }

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

  .text-red-500 { color: #f87171; }
  .text-yellow-500 { color: #fbbf24; }
  .text-green-500 { color: #4ade80; }

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