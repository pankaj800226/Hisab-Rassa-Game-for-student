import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const games = [
    {
        id: 1,
        title: "Hisab-Rassi",
        emoji: "🧮",
        tag: "Math Tug-of-War",
        color: "#FF6B35",
        bg: "#1a0a00",
        desc: "Do-khiladi ka zabardast number battle!",
    },
    {
        id: 2,
        title: "Photo Puzzle",
        emoji: "🧠",
        tag: "Brain Puzzle",
        color: "#A259FF",
        bg: "#0d001a",
        desc: "Socho, samjho, jeeto!",
    },
    {
        id: 3,
        title: "Memory Games",
        emoji: "⚡",
        tag: "Mind Memory Increase",
        color: "#00E5FF",
        bg: "#001a1a",
        desc: "Fastest fingers wins!",
    },
    {
        id: 4,
        title: "Tic Tac Toe",
        emoji: "📝",
        tag: "Tic Tac Toe",
        color: "#FF0000",
        bg: "#001200",
        desc: "Tic Tac Toe is a classic game",
    },
    {
        id: 5,
        title: "Flappy Bird",
        emoji: "🐦",
        tag: "Flappy Bird",
        color: "yellow",
        bg: "#001200",
        desc: "Flappy Bird is a classic game",
    },
    {
        id: 6,
        title: "Sudoku",
        emoji: "🧩",
        tag: "Sudoku",
        color: "#A259FF",
        bg: "#0d001a",
        desc: "Sudoku is a classic game",
    },
    {
        id: 7,
        title: "Number Games",
        emoji: "🧩",
        tag: "Number Games",
        color: "#A259FF",
        bg: "#0d001a",
        desc: "Number Games is a classic game",
    },
];

const FloatingOrb = ({
    x,
    y,
    size,
    color,
    delay,
}: {
    x: number;
    y: number;
    size: number;
    color: string;
    delay: number;
}) => (
    <div
        style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            background: color,
            opacity: 0.12,
            filter: "blur(60px)",
            animation: `floatOrb 8s ease-in-out ${delay}s infinite alternate`,
            pointerEvents: "none",
        }}
    />
);

const Banner = () => {
    const [active, setActive] = useState(0);
    const [visible, setVisible] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setTimeout(() => setVisible(true), 50);
        intervalRef.current = setInterval(() => {
            setActive((prev) => (prev + 1) % games.length);
        }, 3200);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const current = games[active];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        @keyframes floatOrb {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-40px) scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes gameCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .game-chip {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .game-chip:hover {
          transform: translateY(-3px);
        }
        .cta-btn {
          cursor: pointer;
          transition: transform 0.18s, opacity 0.18s;
          border: none;
          outline: none;
        }
        .cta-btn:hover {
          transform: scale(1.04);
          opacity: 0.92;
        }
        .cta-btn:active {
          transform: scale(0.97);
        }
      `}</style>

            <div
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    position: "relative",
                    width: "100%",
                    minHeight: 560,
                    background: "#080810",
                    overflow: "hidden",
                    borderRadius: 24,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Animated background orbs */}
                <FloatingOrb x={10} y={20} size={320} color={current.color} delay={0} />
                <FloatingOrb x={70} y={60} size={260} color="#A259FF" delay={2} />
                <FloatingOrb x={50} y={10} size={200} color="#00E5FF" delay={4} />

                {/* Subtle grid texture */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                        pointerEvents: "none",
                    }}
                />

                {/* Nav bar */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px 32px 0",
                    }}
                >


                </div>

                {/* Main hero content */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "32px 24px 24px",
                        textAlign: "center",
                        opacity: visible ? 1 : 0,
                        animation: visible ? "fadeUp 0.7s ease forwards" : "none",
                    }}
                >
                    {/* Tag pill */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: `${current.color}20`,
                            border: `1px solid ${current.color}50`,
                            borderRadius: 50,
                            padding: "5px 14px",
                            marginBottom: 20,
                            transition: "all 0.4s",
                        }}
                    >
                        <span
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: current.color,
                                display: "inline-block",
                                animation: "pulse-ring 1.4s ease infinite",
                            }}
                        />
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: current.color,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        >
                            Now Playing
                        </span>
                    </div>

                    {/* Headline */}
                    <h1
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 800,
                            fontSize: "clamp(38px, 6vw, 72px)",
                            color: "#fff",
                            lineHeight: 1.05,
                            letterSpacing: "-2px",
                            margin: "0 0 12px",
                            maxWidth: 680,
                        }}
                    >
                        Khelo.{" "}
                        <span
                            style={{
                                color: current.color,
                                transition: "color 0.5s",
                            }}
                        >
                            Jeeto.
                        </span>{" "}
                        Champion Bano.
                    </h1>

                    <p
                        style={{
                            fontSize: 17,
                            color: "rgba(255,255,255,0.5)",
                            maxWidth: 440,
                            margin: "0 0 32px",
                            lineHeight: 1.7,
                        }}
                    >
                        Math battles, mind puzzles, word wars — ek platform pe sabse
                        behtareen multiplayer games.
                    </p>

                    {/* CTA buttons */}
                    <div
                        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
                    >
                        <Link to={'/allgames'}>
                            <button
                                className="cta-btn"
                                style={{
                                    background: current.color,
                                    color: "#000",
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 15,
                                    padding: "13px 28px",
                                    borderRadius: 50,
                                }}
                            >
                                Start Play →
                            </button>
                        </Link>
                        {/* <button
                            className="cta-btn"
                            style={{
                                background: "rgba(255,255,255,0.07)",
                                color: "#fff",
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 500,
                                fontSize: 15,
                                padding: "13px 28px",
                                borderRadius: 50,
                                border: "1px solid rgba(255,255,255,0.15)",
                            }}
                        >
                            Leaderboard Dekho
                        </button> */}
                    </div>
                </div>

                {/* Game selector cards */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        display: "flex",
                        gap: 12,
                        padding: "0 24px 28px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    {games.map((game, i) => (
                        <div
                            key={game.id}
                            className="game-chip"
                            onClick={() => {
                                setActive(i);
                                if (intervalRef.current) clearInterval(intervalRef.current);
                            }}
                            style={{
                                background:
                                    active === i
                                        ? `${game.color}18`
                                        : "rgba(255,255,255,0.04)",
                                border: `1px solid ${active === i ? game.color + "60" : "rgba(255,255,255,0.1)"
                                    }`,
                                borderRadius: 16,
                                padding: "12px 18px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minWidth: 160,
                                animation: `gameCardIn 0.5s ease ${i * 0.08}s both`,
                                transition: "background 0.4s, border 0.4s",
                            }}
                        >
                            <span style={{ fontSize: 24 }}>{game.emoji}</span>
                            <div>
                                <div
                                    style={{
                                        fontFamily: "'Syne', sans-serif",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: active === i ? game.color : "#fff",
                                        transition: "color 0.3s",
                                    }}
                                >
                                    {game.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.4)",
                                        marginTop: 2,
                                    }}
                                >
                                    {game.tag}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scrolling marquee */}
                <div
                    style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        overflow: "hidden",
                        padding: "10px 0",
                        position: "relative",
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 0,
                            animation: "marquee 18s linear infinite",
                            width: "max-content",
                        }}
                    >
                        {[...Array(2)].map((_, ri) =>
                            games.map((g, i) => (
                                <span
                                    key={`${ri}-${i}`}
                                    style={{
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.25)",
                                        letterSpacing: "0.1em",
                                        padding: "0 24px",
                                        whiteSpace: "nowrap",
                                        fontWeight: 500,
                                    }}
                                >
                                    {g.emoji} {g.title.toUpperCase()} ·
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Banner;