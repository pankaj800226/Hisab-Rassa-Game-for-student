import { useEffect, useState, useCallback, useRef, type JSX } from "react";

const NumberGames = (): JSX.Element => {
    const [board, setBoard] = useState<number[][]>([]);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() => {
        const saved = localStorage.getItem("2048-best-score");
        return saved ? parseInt(saved) : 0;
    });
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [showRules, setShowRules] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Add random tile (2 or 4)
    const addRandomTile = useCallback((board: number[][]) => {
        const emptyCells: { row: number; col: number }[] = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    }, []);

    // Initialize game
    const initGame = useCallback(() => {
        const newBoard = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];

        addRandomTile(newBoard);
        addRandomTile(newBoard);

        setBoard(newBoard);
        setScore(0);
        setGameOver(false);
        setWon(false);
    }, [addRandomTile]);

    // Check if move is possible
    const isMovePossible = useCallback((board: number[][]): boolean => {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] === 0) return true;
            }
        }

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (j < 3 && board[i][j] === board[i][j + 1]) return true;
                if (i < 3 && board[i][j] === board[i + 1][j]) return true;
            }
        }

        return false;
    }, []);

    // Move tiles
    const move = useCallback((direction: "up" | "down" | "left" | "right") => {
        if (gameOver || won) return;

        let newBoard = board.map(row => [...row]);
        let scoreAdded = 0;

        const moveLeft = (board: number[][]): { newBoard: number[][], score: number } => {
            let score = 0;
            const newBoard = board.map(row => {
                let filtered = row.filter(num => num !== 0);
                for (let i = 0; i < filtered.length - 1; i++) {
                    if (filtered[i] === filtered[i + 1]) {
                        filtered[i] *= 2;
                        score += filtered[i];
                        filtered.splice(i + 1, 1);
                    }
                }
                while (filtered.length < 4) {
                    filtered.push(0);
                }
                return filtered;
            });
            return { newBoard, score };
        };

        const moveRight = (board: number[][]): { newBoard: number[][], score: number } => {
            const reversed = board.map(row => [...row].reverse());
            const result = moveLeft(reversed);
            return {
                newBoard: result.newBoard.map(row => row.reverse()),
                score: result.score
            };
        };

        const moveUp = (board: number[][]): { newBoard: number[][], score: number } => {
            const transposed = board[0].map((_, col) => board.map(row => row[col]));
            const result = moveLeft(transposed);
            return {
                newBoard: result.newBoard[0].map((_, col) => result.newBoard.map(row => row[col])),
                score: result.score
            };
        };

        const moveDown = (board: number[][]): { newBoard: number[][], score: number } => {
            const transposed = board[0].map((_, col) => board.map(row => row[col]));
            const result = moveRight(transposed);
            return {
                newBoard: result.newBoard[0].map((_, col) => result.newBoard.map(row => row[col])),
                score: result.score
            };
        };

        let result;
        switch (direction) {
            case "left": result = moveLeft(newBoard); break;
            case "right": result = moveRight(newBoard); break;
            case "up": result = moveUp(newBoard); break;
            case "down": result = moveDown(newBoard); break;
            default: return;
        }

        newBoard = result.newBoard;
        scoreAdded = result.score;

        let changed = false;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] !== newBoard[i][j]) {
                    changed = true;
                    break;
                }
            }
        }

        if (changed) {
            addRandomTile(newBoard);
            setBoard(newBoard);
            setScore(prev => prev + scoreAdded);

            const newScore = score + scoreAdded;
            if (newScore > bestScore) {
                setBestScore(newScore);
                localStorage.setItem("2048-best-score", newScore.toString());
            }

            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    if (newBoard[i][j] === 2048) {
                        setWon(true);
                    }
                }
            }

            if (!isMovePossible(newBoard)) {
                setGameOver(true);
            }
        }
    }, [board, gameOver, won, addRandomTile, score, bestScore, isMovePossible]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft": move("left"); break;
                case "ArrowRight": move("right"); break;
                case "ArrowUp": move("up"); break;
                case "ArrowDown": move("down"); break;
                default: return;
            }
            e.preventDefault();
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [move]);

    // Touch controls
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;

        const touchEnd = e.changedTouches[0];
        const dx = touchEnd.clientX - touchStart.x;
        const dy = touchEnd.clientY - touchStart.y;

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) move("right");
            else move("left");
        } else {
            if (dy > 0) move("down");
            else move("up");
        }

        setTouchStart(null);
    };

    useEffect(() => {
        initGame();
    }, [initGame]);

    // Enhanced tile colors matching original 2048 aesthetic perfectly
    const getTileColor = (value: number): string => {
        const colors: Record<number, string> = {
            0: "#cdc1b4",
            2: "#eee4da",
            4: "#ede0c8",
            8: "#f2b179",
            16: "#f59563",
            32: "#f67c5f",
            64: "#f65e3b",
            128: "#edcf72",
            256: "#edcc61",
            512: "#edc850",
            1024: "#edc53f",
            2048: "#edc22e",
        };
        return colors[value] || "#3c3a32";
    };

    const getTextColor = (value: number): string => {
        return value <= 4 ? "#776e65" : "#f9f6f2";
    };

    const getTextSize = (value: number): string => {
        if (value >= 1000) return "24px";
        if (value >= 100) return "28px";
        return "32px";
    };

    return (
        <>
            <style>{css}</style>
            <div className="game2048-root">
                <div className="game2048-container" ref={containerRef}>

                    {/* Rules Panel - Shows first time */}
                    {showRules && (
                        <div className="game2048-rules-panel">
                            <div className="game2048-rules-header">
                                <span>🎮</span>
                                <h3>How to Play 2048?</h3>
                                <button className="game2048-rules-close" onClick={() => setShowRules(false)}>✕</button>
                            </div>
                            <div className="game2048-rules-content">
                                <div className="game2048-rule-item">
                                    <span className="game2048-rule-icon">🎯</span>
                                    <div>
                                        <strong>Goal:</strong>
                                        <p>Merge numbers to create <span style={{ color: "#edc22e" }}>2048</span> tile!</p>
                                    </div>
                                </div>
                                <div className="game2048-rule-item">
                                    <span className="game2048-rule-icon">🕹️</span>
                                    <div>
                                        <strong>Controls:</strong>
                                        <p>Use <strong>Arrow Keys (←↑→↓)</strong> or <strong>Swipe</strong> on mobile</p>
                                    </div>
                                </div>
                                <div className="game2048-rule-item">
                                    <span className="game2048-rule-icon">✨</span>
                                    <div>
                                        <strong>Rules:</strong>
                                        <p>Same numbers merge: <strong>2+2=4, 4+4=8, 8+8=16...</strong></p>
                                    </div>
                                </div>
                                <div className="game2048-rule-item">
                                    <span className="game2048-rule-icon">💡</span>
                                    <div>
                                        <strong>Tips:</strong>
                                        <p>Keep largest number in corner • Plan your moves • Don't rush!</p>
                                    </div>
                                </div>
                            </div>
                            <button className="game2048-rules-btn" onClick={() => setShowRules(false)}>Start Playing →</button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="game2048-header">
                        <div className="game2048-logo">
                            <span className="game2048-logo-2048">2048</span>
                            <span className="game2048-logo-badge">Number Puzzle Game</span>
                        </div>
                        <div className="game2048-scores">
                            <div className="game2048-score-card">
                                <div className="game2048-score-label">SCORE</div>
                                <div className="game2048-score-value">{score}</div>
                            </div>
                            <div className="game2048-score-card">
                                <div className="game2048-score-label">BEST</div>
                                <div className="game2048-score-value">{bestScore}</div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions for Mobile */}
                    <div className="game2048-instructions">
                        <div className="game2048-instru-box">
                            <span>⌨️ Keyboard</span>
                            <span className="game2048-keys">← ↑ → ↓</span>
                        </div>
                        <div className="game2048-instru-box">
                            <span>👆 Mobile</span>
                            <span>Swipe anywhere</span>
                        </div>
                        <div className="game2048-instru-box">
                            <span>🎯 Goal</span>
                            <span>Make 2048!</span>
                        </div>
                    </div>

                    {/* Game Board */}
                    <div
                        className="game2048-board"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {board.map((row, i) => (
                            <div key={i} className="game2048-row">
                                {row.map((cell, j) => (
                                    <div
                                        key={`${i}-${j}`}
                                        className="game2048-cell"
                                        style={{
                                            backgroundColor: getTileColor(cell),
                                            boxShadow: cell !== 0 ? "0 0 10px rgba(0,0,0,0.1)" : "none"
                                        }}
                                    >
                                        {cell !== 0 && (
                                            <span
                                                className="game2048-cell-value"
                                                style={{
                                                    color: getTextColor(cell),
                                                    fontSize: getTextSize(cell)
                                                }}
                                            >
                                                {cell}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Mobile Arrow Controls */}
                    <div className="game2048-mobile-controls">
                        <div className="game2048-arrow-row">
                            <button className="game2048-arrow-btn" onClick={() => move("up")}>⬆️</button>
                        </div>
                        <div className="game2048-arrow-row">
                            <button className="game2048-arrow-btn" onClick={() => move("left")}>⬅️</button>
                            <button className="game2048-arrow-btn" onClick={() => move("down")}>⬇️</button>
                            <button className="game2048-arrow-btn" onClick={() => move("right")}>➡️</button>
                        </div>
                    </div>

                    {/* New Game Button */}
                    <button className="game2048-new-btn" onClick={initGame}>
                        🔄 New Game
                    </button>

                    {/* How to Play Section - Always visible */}
                    <div className="game2048-howto">
                        <div className="game2048-howto-header" onClick={() => {
                            const content = document.querySelector('.game2048-howto-content');
                            content?.classList.toggle('show');
                        }}>
                            <span>📖</span>
                            <span>How to Play? (Click to expand)</span>
                            <span>▼</span>
                        </div>
                        <div className="game2048-howto-content">
                            <div className="game2048-howto-grid">
                                <div className="game2048-howto-card">
                                    <div className="game2048-howto-icon">🎯</div>
                                    <h4>What is the Goal?</h4>
                                    <p>Merge same numbers to create the <strong className="gold">2048 tile</strong>! When you make 2048, you WIN! 🏆</p>
                                </div>
                                <div className="game2048-howto-card">
                                    <div className="game2048-howto-icon">🕹️</div>
                                    <h4>How to Control?</h4>
                                    <p><strong>Desktop:</strong> Use Arrow Keys (← ↑ → ↓)<br /><strong>Mobile:</strong> Swipe on screen or use arrow buttons below</p>
                                </div>
                                <div className="game2048-howto-card">
                                    <div className="game2048-howto-icon">✨</div>
                                    <h4>How Numbers Merge?</h4>
                                    <p>When two <strong>SAME numbers</strong> touch, they merge into <strong>DOUBLE</strong>:<br />2+2=4, 4+4=8, 8+8=16, and so on!</p>
                                </div>
                                <div className="game2048-howto-card">
                                    <div className="game2048-howto-icon">💡</div>
                                    <h4>Pro Tips to Win!</h4>
                                    <p>✅ Keep largest number in corner<br />✅ Build numbers in one direction<br />✅ Don't rush - plan your moves!<br />✅ Always leave empty space</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Win/Lose Overlay */}
                    {(gameOver || won) && (
                        <div className="game2048-overlay">
                            <div className="game2048-overlay-card" style={{
                                borderColor: won ? "#edc22e" : "#f65e3b"
                            }}>
                                <div className="game2048-overlay-icon">
                                    {won ? "🏆" : "💀"}
                                </div>
                                <h2 className="game2048-overlay-title" style={{
                                    color: won ? "#edc22e" : "#f65e3b"
                                }}>
                                    {won ? "Congratulations! You Won! 🎉" : "Game Over! 😢"}
                                </h2>
                                {won ? (
                                    <>
                                        <p className="game2048-overlay-text">
                                            Amazing! You reached 2048!
                                        </p>
                                        <div className="game2048-overlay-stats">
                                            <div>🎯 Score: {score}</div>
                                            <div>🏆 Best: {bestScore}</div>
                                        </div>
                                        <p className="game2048-overlay-small">Want to play more? Try reaching 4096!</p>
                                        <button className="game2048-overlay-btn" onClick={initGame}>
                                            Play Again →
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="game2048-overlay-text">
                                            No more moves possible!
                                        </p>
                                        <div className="game2048-overlay-stats">
                                            <div>📊 Final Score: {score}</div>
                                            <div>🏆 Best Score: {bestScore}</div>
                                        </div>
                                        <p className="game2048-overlay-small">💡 Tip: Keep largest number in corner!</p>
                                        <button className="game2048-overlay-btn" onClick={initGame}>
                                            Try Again →
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    }
    
    /* Fixed background color: #080810 with matching grid pattern */
    .game2048-root {
        font-family: 'Inter', sans-serif;
        min-height: 100vh;
        background: #080810;
        background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 40px 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    
    .game2048-container {
        max-width: 600px;
        width: 100%;
        margin: 0 auto;
    }
    
    /* Rules Panel */
    .game2048-rules-panel {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 20px;
        animation: slideDown 0.4s ease;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .game2048-rules-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .game2048-rules-header h3 {
        color: white;
        font-size: 18px;
    }
    
    .game2048-rules-header span:first-child {
        font-size: 28px;
    }
    
    .game2048-rules-close {
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 16px;
    }
    
    .game2048-rules-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
    }
    
    .game2048-rule-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }
    
    .game2048-rule-icon {
        font-size: 24px;
        min-width: 40px;
        text-align: center;
    }
    
    .game2048-rule-item strong {
        display: block;
        color: #feca57;
        font-size: 14px;
        margin-bottom: 4px;
    }
    
    .game2048-rule-item p {
        color: #ccc;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .game2048-rules-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #feca57, #ff6b6b);
        border: none;
        border-radius: 12px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
        font-size: 16px;
    }
    
    /* Header */
    .game2048-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 16px;
    }
    
    .game2048-logo {
        display: flex;
        flex-direction: column;
    }
    
    .game2048-logo-2048 {
        font-size: 48px;
        font-weight: 900;
        background: linear-gradient(135deg, #feca57, #ff6b6b);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1;
    }
    
    .game2048-logo-badge {
        font-size: 10px;
        color: rgba(255,255,255,0.7);
        margin-top: 4px;
    }
    
    .game2048-scores {
        display: flex;
        gap: 12px;
    }
    
    .game2048-score-card {
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        padding: 8px 16px;
        text-align: center;
        min-width: 80px;
    }
    
    .game2048-score-label {
        font-size: 10px;
        font-weight: 600;
        color: rgba(255,255,255,0.7);
        letter-spacing: 1px;
    }
    
    .game2048-score-value {
        font-size: 24px;
        font-weight: 800;
        color: #feca57;
        margin-top: 4px;
    }
    
    /* Instructions */
    .game2048-instructions {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
    
    .game2048-instru-box {
        background: rgba(0,0,0,0.3);
        border-radius: 10px;
        padding: 8px 15px;
        text-align: center;
    }
    
    .game2048-instru-box span:first-child {
        display: block;
        font-size: 11px;
        color: rgba(255,255,255,0.6);
        margin-bottom: 4px;
    }
    
    .game2048-instru-box span:last-child {
        font-size: 13px;
        font-weight: 600;
        color: white;
    }
    
    .game2048-keys {
        font-family: monospace;
        font-size: 16px !important;
    }
    
    /* Board */
    .game2048-board {
        background: #bbada0;
        border-radius: 16px;
        padding: 12px;
        margin-bottom: 15px;
    }
    
    .game2048-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .game2048-row:last-child {
        margin-bottom: 0;
    }
    
    .game2048-cell {
        flex: 1;
        aspect-ratio: 1;
        background: rgba(255,255,255,0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.1s ease;
        animation: pop 0.12s ease-in-out;
    }
    
    @keyframes pop {
        0% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }
    
    .game2048-cell-value {
        font-weight: 800;
        transition: all 0.05s linear;
    }
    
    /* Mobile Controls */
    .game2048-mobile-controls {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .game2048-arrow-row {
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    
    .game2048-arrow-btn {
        width: 65px;
        padding: 12px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 12px;
        font-size: 28px;
        cursor: pointer;
        transition: all 0.1s;
    }
    
    .game2048-arrow-btn:active {
        transform: scale(0.95);
        background: rgba(0,0,0,0.6);
    }
    
    /* New Game Button */
    .game2048-new-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #feca57, #ff6b6b);
        border: none;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
        margin-bottom: 20px;
        font-family: 'Inter', sans-serif;
        transition: transform 0.1s;
    }
    
    .game2048-new-btn:active {
        transform: scale(0.98);
    }
    
    /* How to Play Section */
    .game2048-howto {
        background: rgba(0,0,0,0.3);
        border-radius: 16px;
        overflow: hidden;
        margin-top: 10px;
    }
    
    .game2048-howto-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 20px;
        cursor: pointer;
        background: rgba(0,0,0,0.2);
        color: white;
        font-weight: 600;
    }
    
    .game2048-howto-header span:first-child {
        font-size: 20px;
    }
    
    .game2048-howto-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.4s ease;
    }
    
    .game2048-howto-content.show {
        max-height: 600px;
    }
    
    .game2048-howto-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
    }
    
    .game2048-howto-card {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 12px;
        text-align: center;
    }
    
    .game2048-howto-icon {
        font-size: 28px;
        margin-bottom: 8px;
    }
    
    .game2048-howto-card h4 {
        color: #feca57;
        font-size: 13px;
        margin-bottom: 8px;
    }
    
    .game2048-howto-card p {
        color: rgba(255,255,255,0.8);
        font-size: 11px;
        line-height: 1.4;
    }
    
    .gold {
        color: #feca57;
    }
    
    /* Overlay */
    .game2048-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .game2048-overlay-card {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 24px;
        padding: 28px;
        text-align: center;
        max-width: 320px;
        width: 90%;
        border: 2px solid;
        animation: scaleIn 0.3s ease;
    }
    
    @keyframes scaleIn {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .game2048-overlay-icon {
        font-size: 56px;
        margin-bottom: 12px;
    }
    
    .game2048-overlay-title {
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 12px;
    }
    
    .game2048-overlay-text {
        color: rgba(255,255,255,0.7);
        margin-bottom: 16px;
        font-size: 14px;
    }
    
    .game2048-overlay-stats {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-around;
        font-weight: 600;
        color: #feca57;
    }
    
    .game2048-overlay-small {
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        margin-bottom: 16px;
    }
    
    .game2048-overlay-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #feca57, #ff6b6b);
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
    }
    
    /* Mobile Responsive */
    @media (max-width: 550px) {
        .game2048-logo-2048 {
            font-size: 36px;
        }
        
        .game2048-score-card {
            padding: 5px 12px;
            min-width: 65px;
        }
        
        .game2048-score-value {
            font-size: 20px;
        }
        
        .game2048-row {
            gap: 8px;
        }
        
        .game2048-board {
            padding: 8px;
        }
        
        .game2048-cell-value {
            font-size: 24px !important;
        }
        
        .game2048-instructions {
            display: none;
        }
        
        .game2048-mobile-controls {
            display: flex;
        }
        
        .game2048-howto-grid {
            grid-template-columns: 1fr;
        }
        
        .game2048-arrow-btn {
            width: 55px;
            font-size: 24px;
            padding: 10px;
        }
    }
    
    /* Desktop hover effects */
    @media (min-width: 551px) {
        .game2048-arrow-btn {
            display: none;
        }
        
        .game2048-mobile-controls {
            display: none;
        }
        
        .game2048-new-btn:hover {
            transform: scale(1.01);
            filter: brightness(1.05);
        }
    }
`;

export default NumberGames;