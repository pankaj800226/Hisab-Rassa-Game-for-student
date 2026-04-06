import { useEffect, useState, useCallback, useRef, type JSX } from "react";

type Player = "X" | "O";
type CellValue = Player | null;
type GameMode = "ai" | "twoPlayer";
type Difficulty = "easy" | "medium" | "hard";

interface GameStats {
    xWins: number;
    oWins: number;
    draws: number;
}

const TicTacToeAI = (): JSX.Element => {
    const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
    const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
    const [winner, setWinner] = useState<Player | "draw" | null>(null);
    const [winningLine, setWinningLine] = useState<number[] | null>(null);
    const [gameMode, setGameMode] = useState<GameMode>("ai");
    const [difficulty, setDifficulty] = useState<Difficulty>("hard");
    const [stats, setStats] = useState<GameStats>(() => {
        const saved = localStorage.getItem("ttt-stats");
        return saved ? JSON.parse(saved) : { xWins: 0, oWins: 0, draws: 0 };
    });
    const [showSettings, setShowSettings] = useState(false);
    const [soundOn, setSoundOn] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [lastMove, setLastMove] = useState<number | null>(null);
    const [hoverCell, setHoverCell] = useState<number | null>(null);


    const boardRef = useRef<HTMLDivElement>(null);

    // Sound effects
    const playSound = useCallback((type: "move" | "win" | "draw" | "click") => {
        if (!soundOn) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            switch (type) {
                case "move":
                    osc.frequency.value = 523.25;
                    osc.type = "sine";
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.15);
                    break;
                case "win":
                    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                        setTimeout(() => {
                            const o = ctx.createOscillator();
                            const g = ctx.createGain();
                            o.connect(g);
                            g.connect(ctx.destination);
                            o.frequency.value = freq;
                            o.type = "sine";
                            g.gain.setValueAtTime(0.15, ctx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                            o.start();
                            o.stop(ctx.currentTime + 0.3);
                        }, i * 100);
                    });
                    break;
                case "draw":
                    osc.frequency.value = 440;
                    osc.type = "sawtooth";
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                    break;
                case "click":
                    osc.frequency.value = 880;
                    osc.type = "triangle";
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                    break;
            }
        } catch (e) { }
    }, [soundOn]);

    // Check winner
    const checkWinner = useCallback((boardState: CellValue[]): { winner: Player | "draw" | null; line: number[] | null } => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const line of lines) {
            const [a, b, c] = line;
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                return { winner: boardState[a] as Player, line };
            }
        }

        if (boardState.every(cell => cell !== null)) {
            return { winner: "draw", line: null };
        }

        return { winner: null, line: null };
    }, []);

    // Minimax AI algorithm
    const minimax = useCallback((
        boardState: CellValue[],
        depth: number,
        isMaximizing: boolean,
        alpha: number = -Infinity,
        beta: number = Infinity
    ): number => {
        const { winner: gameWinner } = checkWinner(boardState);

        if (gameWinner === "O") return 10 - depth;
        if (gameWinner === "X") return -10 + depth;
        if (gameWinner === "draw") return 0;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === null) {
                    boardState[i] = "O";
                    const evalScore = minimax(boardState, depth + 1, false, alpha, beta);
                    boardState[i] = null;
                    maxEval = Math.max(maxEval, evalScore);
                    alpha = Math.max(alpha, evalScore);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 9; i++) {
                if (boardState[i] === null) {
                    boardState[i] = "X";
                    const evalScore = minimax(boardState, depth + 1, true, alpha, beta);
                    boardState[i] = null;
                    minEval = Math.min(minEval, evalScore);
                    beta = Math.min(beta, evalScore);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }, [checkWinner]);

    // Easy AI (random moves)
    const getEasyAIMove = useCallback((boardState: CellValue[]): number => {
        const emptyCells = boardState.reduce<number[]>((acc, cell, idx) => {
            if (cell === null) acc.push(idx);
            return acc;
        }, []);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }, []);

    // Medium AI (block wins + random)
    const getMediumAIMove = useCallback((boardState: CellValue[]): number => {
        // Check if AI can win
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === null) {
                boardState[i] = "O";
                const { winner } = checkWinner(boardState);
                boardState[i] = null;
                if (winner === "O") return i;
            }
        }

        // Block player win
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === null) {
                boardState[i] = "X";
                const { winner } = checkWinner(boardState);
                boardState[i] = null;
                if (winner === "X") return i;
            }
        }

        // Random move
        return getEasyAIMove(boardState);
    }, [checkWinner, getEasyAIMove]);

    // Hard AI (minimax)
    const getHardAIMove = useCallback((boardState: CellValue[]): number => {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (boardState[i] === null) {
                boardState[i] = "O";
                const score = minimax(boardState, 0, false);
                boardState[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }, [minimax]);

    // AI Move
    const makeAIMove = useCallback(async () => {
        if (winner || currentPlayer !== "O" || gameMode !== "ai") return;

        setIsThinking(true);
        await new Promise(resolve => setTimeout(resolve, 300)); // Natural delay

        let moveIndex = -1;
        switch (difficulty) {
            case "easy":
                moveIndex = getEasyAIMove(board);
                break;
            case "medium":
                moveIndex = getMediumAIMove(board);
                break;
            case "hard":
                moveIndex = getHardAIMove(board);
                break;
        }

        if (moveIndex !== -1 && board[moveIndex] === null) {
            const newBoard = [...board];
            newBoard[moveIndex] = "O";
            setBoard(newBoard);
            setLastMove(moveIndex);
            playSound("move");

            const { winner: gameWinner, line } = checkWinner(newBoard);
            if (gameWinner) {
                setWinner(gameWinner);
                setWinningLine(line);
                if (gameWinner === "draw") {
                    playSound("draw");
                    setStats(prev => {
                        const newStats = { ...prev, draws: prev.draws + 1 };
                        localStorage.setItem("ttt-stats", JSON.stringify(newStats));
                        return newStats;
                    });
                } else {
                    playSound("win");
                    setStats(prev => {
                        const newStats = {
                            ...prev,
                            [gameWinner === "X" ? "xWins" : "oWins"]:
                                gameWinner === "X" ? prev.xWins + 1 : prev.oWins + 1
                        };
                        localStorage.setItem("ttt-stats", JSON.stringify(newStats));
                        return newStats;
                    });
                }
            } else {
                setCurrentPlayer("X");
            }
        }
        setIsThinking(false);
    }, [board, currentPlayer, winner, gameMode, difficulty, getEasyAIMove, getMediumAIMove, getHardAIMove, checkWinner, playSound]);

    useEffect(() => {
        if (gameMode === "ai" && currentPlayer === "O" && !winner && !isThinking) {
            makeAIMove();
        }
    }, [currentPlayer, gameMode, winner, makeAIMove, isThinking]);

    // Handle cell click
    const handleCellClick = (index: number) => {
        if (winner || board[index] !== null || (gameMode === "ai" && currentPlayer !== "X") || isThinking) {
            return;
        }

        playSound("click");
        const newBoard = [...board];
        newBoard[index] = currentPlayer;
        setBoard(newBoard);
        setLastMove(index);
        playSound("move");

        const { winner: gameWinner, line } = checkWinner(newBoard);
        if (gameWinner) {
            setWinner(gameWinner);
            setWinningLine(line);
            if (gameWinner === "draw") {
                playSound("draw");
                setStats(prev => {
                    const newStats = { ...prev, draws: prev.draws + 1 };
                    localStorage.setItem("ttt-stats", JSON.stringify(newStats));
                    return newStats;
                });
            } else {
                playSound("win");
                setStats(prev => {
                    const newStats = {
                        ...prev,
                        [gameWinner === "X" ? "xWins" : "oWins"]:
                            gameWinner === "X" ? prev.xWins + 1 : prev.oWins + 1
                    };
                    localStorage.setItem("ttt-stats", JSON.stringify(newStats));
                    return newStats;
                });
            }
        } else {
            setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
        }
    };

    // Reset game
    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setCurrentPlayer("X");
        setWinner(null);
        setWinningLine(null);
        setLastMove(null);

        playSound("click");
    };

    // Clear stats
    const clearStats = () => {
        setStats({ xWins: 0, oWins: 0, draws: 0 });
        localStorage.setItem("ttt-stats", JSON.stringify({ xWins: 0, oWins: 0, draws: 0 }));
        playSound("click");
    };

    // Get winner message
    const getWinnerMessage = () => {
        if (winner === "X") return "🏆 Player X Wins! 🏆";
        if (winner === "O") return gameMode === "ai" ? "🤖 AI Wins! 🤖" : "🏆 Player O Wins! 🏆";
        if (winner === "draw") return "🤝 Game Draw! 🤝";
        return `${currentPlayer}'s Turn`;
    };

    return (
        <>
            <style>{css}</style>
            <div className="ttt-root">
                <div className="ttt-bg-pattern" />

                <div className="ttt-container">
                    {/* Header */}
                    <div className="ttt-header">
                        <div className="ttt-logo">
                            <span className="ttt-logo-icon">⭕</span>
                            <span className="ttt-logo-text">Tic Tac Toe</span>
                            <span className="ttt-logo-icon">❌</span>
                        </div>

                        <div className="ttt-header-actions">
                            <button
                                className="ttt-icon-btn"
                                onClick={() => setSoundOn(!soundOn)}
                                title={soundOn ? "Sound On" : "Sound Off"}
                            >
                                {soundOn ? "🔊" : "🔇"}
                            </button>
                            <button
                                className="ttt-icon-btn"
                                onClick={() => setShowSettings(!showSettings)}
                                title="Settings"
                            >
                                ⚙️
                            </button>
                            <button className="ttt-reset-btn" onClick={resetGame}>
                                ↺ New Game
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="ttt-settings-panel">
                            <div className="ttt-setting-group">
                                <label>Game Mode</label>
                                <div className="ttt-toggle-group">
                                    <button
                                        className={`ttt-toggle-btn ${gameMode === "ai" ? "active" : ""}`}
                                        onClick={() => { setGameMode("ai"); setShowSettings(false); resetGame(); }}
                                    >
                                        🤖 vs AI
                                    </button>
                                    <button
                                        className={`ttt-toggle-btn ${gameMode === "twoPlayer" ? "active" : ""}`}
                                        onClick={() => { setGameMode("twoPlayer"); setShowSettings(false); resetGame(); }}
                                    >
                                        👥 2 Player
                                    </button>
                                </div>
                            </div>

                            {gameMode === "ai" && (
                                <div className="ttt-setting-group">
                                    <label>AI Difficulty</label>
                                    <div className="ttt-toggle-group">
                                        {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                                            <button
                                                key={d}
                                                className={`ttt-toggle-btn ${difficulty === d ? "active" : ""}`}
                                                onClick={() => { setDifficulty(d); setShowSettings(false); resetGame(); }}
                                            >
                                                {d === "easy" && "🎯 Easy"}
                                                {d === "medium" && "⚡ Medium"}
                                                {d === "hard" && "🔥 Hard"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button className="ttt-clear-stats" onClick={clearStats}>
                                🗑️ Clear Stats
                            </button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="ttt-stats">
                        <div className="ttt-stat-card">
                            <span className="ttt-stat-label">❌ X Wins</span>
                            <span className="ttt-stat-value" style={{ color: "#FF6B6B" }}>{stats.xWins}</span>
                        </div>
                        <div className="ttt-stat-card">
                            <span className="ttt-stat-label">🤝 Draws</span>
                            <span className="ttt-stat-value" style={{ color: "#FFD93D" }}>{stats.draws}</span>
                        </div>
                        <div className="ttt-stat-card">
                            <span className="ttt-stat-label">⭕ O Wins</span>
                            <span className="ttt-stat-value" style={{ color: "#6BCF7F" }}>{stats.oWins}</span>
                        </div>
                    </div>

                    {/* Game Status */}
                    <div className="ttt-status">
                        <div className={`ttt-status-text ${winner ? "winner" : ""}`}>
                            {getWinnerMessage()}
                        </div>
                        {isThinking && (
                            <div className="ttt-thinking">
                                <span className="ttt-dot">.</span>
                                <span className="ttt-dot">.</span>
                                <span className="ttt-dot">.</span>
                            </div>
                        )}
                    </div>

                    {/* Board */}
                    <div className="ttt-board" ref={boardRef}>
                        {board.map((cell, index) => {
                            const isWinningCell = winningLine?.includes(index);
                            const isLastMoveCell = lastMove === index && !isWinningCell;
                            const isHovered = hoverCell === index && !cell && !winner && !(gameMode === "ai" && currentPlayer === "O" && !winner);

                            return (
                                <button
                                    key={index}
                                    className={`ttt-cell ${cell ? `ttt-cell--${cell.toLowerCase()}` : ""} 
                    ${isWinningCell ? "ttt-cell--winning" : ""} 
                    ${isLastMoveCell ? "ttt-cell--last" : ""}
                    ${isHovered ? "ttt-cell--hover" : ""}`}
                                    onClick={() => handleCellClick(index)}
                                    onMouseEnter={() => setHoverCell(index)}
                                    onMouseLeave={() => setHoverCell(null)}
                                    disabled={!!cell || !!winner || (gameMode === "ai" && currentPlayer === "O") || isThinking}
                                >
                                    {cell && (
                                        <span className={`ttt-cell-symbol ttt-cell-symbol--${cell.toLowerCase()}`}>
                                            {cell}
                                        </span>
                                    )}
                                    {!cell && isHovered && currentPlayer && !winner && (
                                        <span className="ttt-cell-preview">{currentPlayer}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Game Over Overlay */}
                    {winner && (
                        <div className="ttt-overlay">
                            <div className="ttt-overlay-content">
                                <div className="ttt-overlay-icon">
                                    {winner === "X" && "❌"}
                                    {winner === "O" && "⭕"}
                                    {winner === "draw" && "🤝"}
                                </div>
                                <h2 className="ttt-overlay-title">
                                    {winner === "X" && "Player X Wins!"}
                                    {winner === "O" && (gameMode === "ai" ? "AI Wins!" : "Player O Wins!")}
                                    {winner === "draw" && "Game Draw!"}
                                </h2>
                                <button className="ttt-overlay-btn" onClick={resetGame}>
                                    Play Again →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="ttt-footer">
                        <p className="ttt-footer-text">
                            {gameMode === "ai"
                                ? `🤖 AI Difficulty: ${difficulty.toUpperCase()} ${difficulty === "hard" ? "(Unbeatable!)" : ""}`
                                : "👥 Two Player Mode - Take turns!"}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .ttt-root {
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 50%, #0F0F1A 100%);
    position: relative;
    overflow-x: hidden;
  }

  .ttt-bg-pattern {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(107, 207, 127, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.03) 0%, transparent 50%);
  }

  .ttt-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px 20px 40px;
    position: relative;
    z-index: 1;
  }

  /* Header */
  .ttt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ttt-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #FF6B6B, #6BCF7F);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .ttt-logo-icon {
    font-size: 28px;
    background: none;
    -webkit-background-clip: unset;
    background-clip: unset;
    color: inherit;
  }

  .ttt-logo-text {
    font-size: 20px;
    letter-spacing: -0.5px;
  }

  .ttt-header-actions {
    display: flex;
    gap: 8px;
  }

  .ttt-icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ttt-icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }

  .ttt-reset-btn {
    padding: 8px 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(107, 207, 127, 0.2), rgba(255, 107, 107, 0.2));
    border: 1px solid rgba(107, 207, 127, 0.3);
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ttt-reset-btn:hover {
    background: linear-gradient(135deg, rgba(107, 207, 127, 0.3), rgba(255, 107, 107, 0.3));
    transform: scale(1.02);
  }

  /* Settings Panel */
  .ttt-settings-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ttt-setting-group {
    margin-bottom: 16px;
  }

  .ttt-setting-group label {
    display: block;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .ttt-toggle-group {
    display: flex;
    gap: 8px;
  }

  .ttt-toggle-btn {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ttt-toggle-btn.active {
    background: linear-gradient(135deg, #FF6B6B, #6BCF7F);
    border-color: transparent;
    color: white;
  }

  .ttt-toggle-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.08);
  }

  .ttt-clear-stats {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    background: rgba(255, 77, 77, 0.1);
    border: 1px solid rgba(255, 77, 77, 0.3);
    color: #FF4D4D;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ttt-clear-stats:hover {
    background: rgba(255, 77, 77, 0.2);
  }

  /* Stats */
  .ttt-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .ttt-stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 12px;
    text-align: center;
    transition: transform 0.2s ease;
  }

  .ttt-stat-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.05);
  }

  .ttt-stat-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  .ttt-stat-value {
    display: block;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }

  /* Status */
  .ttt-status {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .ttt-status-text {
    font-size: 18px;
    font-weight: 700;
    color: white;
    letter-spacing: -0.3px;
  }

  .ttt-status-text.winner {
    background: linear-gradient(135deg, #FFD93D, #FF6B6B);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .ttt-thinking {
    display: flex;
    gap: 4px;
  }

  .ttt-dot {
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .ttt-dot:nth-child(1) { animation-delay: -0.32s; }
  .ttt-dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  /* Board */
  .ttt-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    aspect-ratio: 1;
    margin-bottom: 24px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 24px;
    padding: 12px;
  }

  .ttt-cell {
    position: relative;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
  }

  .ttt-cell:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.02);
  }

  .ttt-cell:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }

  .ttt-cell--winning {
    background: linear-gradient(135deg, rgba(107, 207, 127, 0.2), rgba(255, 107, 107, 0.2));
    border-color: #FFD93D;
    animation: pulse 0.5s ease;
  }

  .ttt-cell--last {
    border-color: rgba(255, 217, 61, 0.5);
    box-shadow: 0 0 20px rgba(255, 217, 61, 0.2);
  }

  .ttt-cell--hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .ttt-cell-symbol {
    font-size: 56px;
    font-weight: 800;
    animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .ttt-cell-symbol--x {
    color: #FF6B6B;
    text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
  }

  .ttt-cell-symbol--o {
    color: #6BCF7F;
    text-shadow: 0 0 20px rgba(107, 207, 127, 0.5);
  }

  .ttt-cell-preview {
    font-size: 32px;
    font-weight: 600;
    opacity: 0.3;
    animation: fadeIn 0.2s ease;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 0.3;
    }
  }

  /* Overlay */
  .ttt-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .ttt-overlay-content {
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.95));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    animation: slideUp 0.4s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ttt-overlay-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  .ttt-overlay-title {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #FFD93D, #FF6B6B);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .ttt-overlay-btn {
    padding: 14px 32px;
    border-radius: 50px;
    background: linear-gradient(135deg, #FF6B6B, #6BCF7F);
    border: none;
    color: white;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ttt-overlay-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(107, 207, 127, 0.3);
  }

  /* Footer */
  .ttt-footer {
    text-align: center;
    padding-top: 20px;
  }

  .ttt-footer-text {
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    font-weight: 500;
  }

  /* Responsive */
  @media (max-width: 500px) {
    .ttt-container {
      padding: 16px;
    }

    .ttt-board {
      gap: 8px;
      padding: 8px;
    }

    .ttt-cell-symbol {
      font-size: 40px;
    }

    .ttt-cell-preview {
      font-size: 24px;
    }

    .ttt-stat-value {
      font-size: 22px;
    }

    .ttt-overlay-title {
      font-size: 24px;
    }

    .ttt-overlay-icon {
      font-size: 60px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default TicTacToeAI;