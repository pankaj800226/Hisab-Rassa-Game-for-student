import { ArrowBigDown, ArrowBigLeft, ArrowBigRight, ArrowBigUp, Target, Settings, RotateCcw, X } from "lucide-react";
import { useEffect, useState, useCallback, useRef, type JSX } from "react";

const NumberGames = (): JSX.Element => {
    const [board, setBoard] = useState<number[][]>([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() => {
        const saved = localStorage.getItem("2048-best-score");
        return saved ? parseInt(saved) : 0;
    });
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [showRules, setShowRules] = useState(true);
    const [targetNumber, setTargetNumber] = useState<number>(2048);
    const [customTarget, setCustomTarget] = useState<string>("2048");
    const [showTargetSelector, setShowTargetSelector] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Preset target options
    const targetPresets = [512, 1024, 2048, 4096, 8192];

    // Add random tile (2 or 4)
    const addRandomTile = useCallback((boardGrid: number[][]): number[][] => {
        const emptyCells: { row: number; col: number }[] = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (boardGrid[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newBoard = boardGrid.map(r => [...r]);
            newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
            return newBoard;
        }
        return boardGrid;
    }, []);

    // Initialize game
    const initGame = useCallback(() => {
        let newBoard = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        newBoard = addRandomTile(newBoard);
        newBoard = addRandomTile(newBoard);

        setBoard(newBoard);
        setScore(0);
        setGameOver(false);
        setWon(false);
    }, [addRandomTile]);

    // Check if move is possible
    const isMovePossible = useCallback((boardGrid: number[][]): boolean => {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (boardGrid[i][j] === 0) return true;
            }
        }

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (j < 3 && boardGrid[i][j] === boardGrid[i][j + 1]) return true;
                if (i < 3 && boardGrid[i][j] === boardGrid[i + 1][j]) return true;
            }
        }

        return false;
    }, []);

    // Check win condition based on target number
    const checkWinCondition = useCallback((boardGrid: number[][]): boolean => {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (boardGrid[i][j] >= targetNumber) {
                    return true;
                }
            }
        }
        return false;
    }, [targetNumber]);

    // Get highest tile value
    const getMaxTileValue = useCallback((boardGrid: number[][]): number => {
        let maxVal = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (boardGrid[i][j] > maxVal) maxVal = boardGrid[i][j];
            }
        }
        return maxVal;
    }, []);

    // Move tiles
    const move = useCallback((direction: "up" | "down" | "left" | "right") => {
        if (gameOver || won) return;

        let newBoard = board.map(row => [...row]);
        let scoreAdded = 0;

        const moveLeft = (boardGrid: number[][]): { newBoard: number[][], score: number } => {
            let scoreVal = 0;
            const resultBoard = boardGrid.map(row => {
                let filtered = row.filter(num => num !== 0);
                for (let i = 0; i < filtered.length - 1; i++) {
                    if (filtered[i] === filtered[i + 1]) {
                        filtered[i] *= 2;
                        scoreVal += filtered[i];
                        filtered.splice(i + 1, 1);
                    }
                }
                while (filtered.length < 4) {
                    filtered.push(0);
                }
                return filtered;
            });
            return { newBoard: resultBoard, score: scoreVal };
        };

        const moveRight = (boardGrid: number[][]): { newBoard: number[][], score: number } => {
            const reversed = boardGrid.map(row => [...row].reverse());
            const result = moveLeft(reversed);
            return {
                newBoard: result.newBoard.map(row => row.reverse()),
                score: result.score
            };
        };

        const moveUp = (boardGrid: number[][]): { newBoard: number[][], score: number } => {
            const transposed = boardGrid[0].map((_, col) => boardGrid.map(row => row[col]));
            const result = moveLeft(transposed);
            const untransposed = result.newBoard[0].map((_, col) => result.newBoard.map(row => row[col]));
            return {
                newBoard: untransposed,
                score: result.score
            };
        };

        const moveDown = (boardGrid: number[][]): { newBoard: number[][], score: number } => {
            const transposed = boardGrid[0].map((_, col) => boardGrid.map(row => row[col]));
            const result = moveRight(transposed);
            const untransposed = result.newBoard[0].map((_, col) => result.newBoard.map(row => row[col]));
            return {
                newBoard: untransposed,
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

        // Check if board changed
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
            newBoard = addRandomTile(newBoard);
            setBoard(newBoard);
            const newScore = score + scoreAdded;
            setScore(newScore);

            if (newScore > bestScore) {
                setBestScore(newScore);
                localStorage.setItem("2048-best-score", newScore.toString());
            }

            // Check win condition with target
            if (checkWinCondition(newBoard)) {
                setWon(true);
                return;
            }

            if (!isMovePossible(newBoard)) {
                setGameOver(true);
            }
        }
    }, [board, gameOver, won, addRandomTile, score, bestScore, isMovePossible, checkWinCondition]);

    // Apply new target and restart
    const applyTarget = () => {
        let newTarget = parseInt(customTarget);
        if (isNaN(newTarget) || newTarget < 4) {
            newTarget = 2048;
            setCustomTarget("2048");
        }
        setTargetNumber(newTarget);
        setShowTargetSelector(false);
        initGame();
    };

    const selectPresetTarget = (target: number) => {
        setTargetNumber(target);
        setCustomTarget(target.toString());
        setShowTargetSelector(false);
        initGame();
    };

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

    // Tile colors
    const getTileColor = (value: number): string => {
        const colors: Record<number, string> = {
            0: "rgba(255,255,255,0.05)",
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
        if (value > 2048) return "linear-gradient(135deg, #edc53f, #e67e22)";
        return colors[value] || "rgba(255,255,255,0.1)";
    };

    const getTextColor = (value: number): string => {
        return value <= 4 ? "#776e65" : "#f9f6f2";
    };

    const getTextSize = (value: number): string => {
        if (value >= 10000) return "18px";
        if (value >= 1000) return "22px";
        if (value >= 100) return "26px";
        return "32px";
    };

    const maxTileValue = getMaxTileValue(board);
    const progress = Math.min(100, (maxTileValue / targetNumber) * 100);

    return (
        <>
            <style>{css}</style>
            <div className="game2048-root">
                <div className="game2048-container" ref={containerRef}>

                    {/* Rules Panel */}
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
                                        <strong>Custom Target!</strong>
                                        <p>Set your own winning number - reach or exceed it to WIN!</p>
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
                            </div>
                            <button className="game2048-rules-btn" onClick={() => setShowRules(false)}>Start Playing →</button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="game2048-header">
                        <div className="game2048-logo">
                            <span className="game2048-logo-2048">2048</span>
                            <span className="game2048-logo-badge">Custom Target Mode</span>
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

                    {/* Target Display & Progress Bar */}
                    <div className="game2048-target-section">
                        <div className="game2048-target-info">
                            <div className="game2048-target-badge">
                                <Target size={18} />
                                <span>TARGET: {targetNumber.toLocaleString()}</span>
                            </div>
                            <button className="game2048-target-btn" onClick={() => setShowTargetSelector(true)}>
                                <Settings size={16} />
                                Change Target
                            </button>
                        </div>
                        <div className="game2048-progress-container">
                            <div className="game2048-progress-bar" style={{ width: `${progress}%` }}></div>
                            <div className="game2048-progress-text">
                                Highest Tile: {maxTileValue.toLocaleString()} / {targetNumber.toLocaleString()}
                            </div>
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
                                            background: cell === 0 ? "rgba(255,255,255,0.05)" : getTileColor(cell),
                                            boxShadow: cell !== 0 ? "0 4px 15px rgba(0,0,0,0.2)" : "none"
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
                            <button className="game2048-arrow-btn" onClick={() => move("up")}>
                                <ArrowBigUp size={28} />
                            </button>
                        </div>
                        <div className="game2048-arrow-row">
                            <button className="game2048-arrow-btn" onClick={() => move("left")}>
                                <ArrowBigLeft size={28} />
                            </button>
                            <button className="game2048-arrow-btn" onClick={() => move("down")}>
                                <ArrowBigDown size={28} />
                            </button>
                            <button className="game2048-arrow-btn" onClick={() => move("right")}>
                                <ArrowBigRight size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="game2048-action-buttons">
                        <button className="game2048-new-btn" onClick={initGame}>
                            <RotateCcw size={18} />
                            New Game
                        </button>
                    </div>

                    {/* Target Selector Modal */}
                    {showTargetSelector && (
                        <div className="game2048-modal-overlay" onClick={() => setShowTargetSelector(false)}>
                            <div className="game2048-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="game2048-modal-header">
                                    <h3><Target size={20} /> Select Your Target</h3>
                                    <button onClick={() => setShowTargetSelector(false)}><X size={20} /></button>
                                </div>
                                <div className="game2048-modal-body">
                                    <p>Choose a number to reach. Win when you meet or exceed it!</p>
                                    <div className="game2048-presets">
                                        {targetPresets.map(preset => (
                                            <button
                                                key={preset}
                                                className={`game2048-preset-btn ${targetNumber === preset ? 'active' : ''}`}
                                                onClick={() => selectPresetTarget(preset)}
                                            >
                                                {preset.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="game2048-custom-input">
                                        <input
                                            type="number"
                                            value={customTarget}
                                            onChange={(e) => setCustomTarget(e.target.value)}
                                            placeholder="Custom target..."
                                            min="4"
                                            step="2"
                                        />
                                        <button onClick={applyTarget}>Set Target</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Win/Lose Overlay */}
                    {(gameOver || won) && (
                        <div className="game2048-overlay">
                            <div className="game2048-overlay-card" style={{
                                borderColor: won ? "#edc22e" : "#f65e3b"
                            }}>
                                <div className="game2048-overlay-icon">
                                    {won ? "🏆✨" : "💀😢"}
                                </div>
                                <h2 className="game2048-overlay-title" style={{
                                    color: won ? "#edc22e" : "#f65e3b"
                                }}>
                                    {won ? "You Won! 🎉" : "Game Over!"}
                                </h2>
                                {won ? (
                                    <>
                                        <p className="game2048-overlay-text">
                                            You reached <strong>{maxTileValue.toLocaleString()}</strong> which is ≥ your target of <strong>{targetNumber.toLocaleString()}</strong>!
                                        </p>
                                        <div className="game2048-overlay-stats">
                                            <div>🎯 Score: {score}</div>
                                            <div>🏆 Best: {bestScore}</div>
                                            <div>🎲 Target: {targetNumber}</div>
                                        </div>
                                        <p className="game2048-overlay-small">Want to try a higher target? Change it in settings!</p>
                                        <button className="game2048-overlay-btn" onClick={() => { initGame(); setShowTargetSelector(true); }}>
                                            Set New Target →
                                        </button>
                                        <button className="game2048-overlay-btn secondary" onClick={initGame}>
                                            Play Again
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="game2048-overlay-text">
                                            No more moves possible! Your highest tile was <strong>{maxTileValue.toLocaleString()}</strong>.
                                        </p>
                                        <div className="game2048-overlay-stats">
                                            <div>📊 Final Score: {score}</div>
                                            <div>🏆 Best Score: {bestScore}</div>
                                            <div>🎯 Target: {targetNumber}</div>
                                        </div>
                                        <p className="game2048-overlay-small">💡 Tip: Try a smaller target to practice, or keep largest number in corner!</p>
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
    
    .game2048-root {
        font-family: 'Inter', sans-serif;
        min-height: 100vh;
        background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
        background-image: 
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
            repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    
    .game2048-container {
        max-width: 620px;
        width: 100%;
        margin: 0 auto;
    }
    
    /* Rules Panel */
    .game2048-rules-panel {
        background: linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,33,62,0.95));
        backdrop-filter: blur(10px);
        border-radius: 24px;
        padding: 24px;
        margin-bottom: 20px;
        animation: slideDown 0.4s ease;
        border: 1px solid rgba(255,215,0,0.2);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .game2048-rules-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,215,0,0.2);
    }
    
    .game2048-rules-header h3 {
        color: #feca57;
        font-size: 18px;
    }
    
    .game2048-rules-header span:first-child {
        font-size: 28px;
    }
    
    .game2048-rules-close {
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 18px;
        transition: all 0.2s;
    }
    
    .game2048-rules-close:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .game2048-rules-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 20px;
    }
    
    .game2048-rule-item {
        display: flex;
        gap: 14px;
        align-items: flex-start;
    }
    
    .game2048-rule-icon {
        font-size: 28px;
        min-width: 44px;
        text-align: center;
    }
    
    .game2048-rule-item strong {
        display: block;
        color: #feca57;
        font-size: 14px;
        margin-bottom: 4px;
    }
    
    .game2048-rule-item p {
        color: rgba(255,255,255,0.8);
        font-size: 13px;
        line-height: 1.5;
    }
    
    .game2048-rules-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #feca57, #ff8c42);
        border: none;
        border-radius: 40px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
        font-size: 16px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .game2048-rules-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(254,202,87,0.3);
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
        font-size: 52px;
        font-weight: 900;
        background: linear-gradient(135deg, #feca57, #ff8c42, #feca57);
        background-size: 200% auto;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1;
        animation: shine 3s linear infinite;
    }
    
    @keyframes shine {
        0% { background-position: 0% center; }
        100% { background-position: 200% center; }
    }
    
    .game2048-logo-badge {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
        margin-top: 4px;
    }
    
    .game2048-scores {
        display: flex;
        gap: 12px;
    }
    
    .game2048-score-card {
        background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
        backdrop-filter: blur(5px);
        border-radius: 16px;
        padding: 10px 20px;
        text-align: center;
        min-width: 90px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .game2048-score-label {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.6);
        letter-spacing: 1px;
    }
    
    .game2048-score-value {
        font-size: 28px;
        font-weight: 800;
        color: #feca57;
        margin-top: 4px;
    }
    
    /* Target Section */
    .game2048-target-section {
        background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.2));
        backdrop-filter: blur(5px);
        border-radius: 20px;
        padding: 16px 20px;
        margin-bottom: 20px;
        border: 1px solid rgba(255,215,0,0.2);
    }
    
    .game2048-target-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .game2048-target-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #feca57, #ff8c42);
        padding: 6px 16px;
        border-radius: 40px;
        color: #1a1a2e;
        font-weight: 700;
        font-size: 14px;
    }
    
    .game2048-target-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 6px 14px;
        border-radius: 40px;
        color: white;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
    }
    
    .game2048-target-btn:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .game2048-progress-container {
        background: rgba(0,0,0,0.5);
        border-radius: 30px;
        height: 30px;
        position: relative;
        overflow: hidden;
    }
    
    .game2048-progress-bar {
        background: linear-gradient(90deg, #feca57, #ff8c42);
        height: 100%;
        border-radius: 30px;
        transition: width 0.3s ease;
        position: relative;
    }
    
    .game2048-progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 11px;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        white-space: nowrap;
    }
    
    /* Board */
    .game2048-board {
        background: rgba(187,173,160,0.3);
        backdrop-filter: blur(5px);
        border-radius: 24px;
        padding: 16px;
        margin-bottom: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
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
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.1s ease;
        animation: pop 0.12s ease-in-out;
    }
    
    @keyframes pop {
        0% { transform: scale(0.9); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
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
        margin-bottom: 20px;
    }
    
    .game2048-arrow-row {
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    
    .game2048-arrow-btn {
        width: 70px;
        padding: 14px;
        background: linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3));
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #feca57;
    }
    
    .game2048-arrow-btn:active {
        transform: scale(0.95);
        background: rgba(0,0,0,0.7);
    }
    
    /* Action Buttons */
    .game2048-action-buttons {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }
    
    .game2048-new-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 32px;
        background: linear-gradient(135deg, #feca57, #ff8c42);
        border: none;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .game2048-new-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(254,202,87,0.4);
    }
    
    /* Modal */
    .game2048-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }
    
    .game2048-modal {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 28px;
        padding: 24px;
        max-width: 380px;
        width: 90%;
        border: 1px solid rgba(255,215,0,0.3);
        animation: scaleIn 0.3s ease;
    }
    
    .game2048-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .game2048-modal-header h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #feca57;
    }
    
    .game2048-modal-header button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
    }
    
    .game2048-modal-body p {
        color: rgba(255,255,255,0.8);
        margin-bottom: 20px;
        font-size: 14px;
    }
    
    .game2048-presets {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 20px;
        justify-content: center;
    }
    
    .game2048-preset-btn {
        padding: 10px 20px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 40px;
        color: white;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .game2048-preset-btn.active {
        background: linear-gradient(135deg, #feca57, #ff8c42);
        color: #1a1a2e;
        border-color: transparent;
    }
    
    .game2048-preset-btn:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .game2048-custom-input {
        display: flex;
        gap: 10px;
    }
    
    .game2048-custom-input input {
        flex: 1;
        padding: 12px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 40px;
        color: white;
        font-size: 16px;
        outline: none;
    }
    
    .game2048-custom-input input:focus {
        border-color: #feca57;
    }
    
    .game2048-custom-input button {
        padding: 12px 24px;
        background: linear-gradient(135deg, #feca57, #ff8c42);
        border: none;
        border-radius: 40px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
    }
    
    /* Overlay */
    .game2048-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        backdrop-filter: blur(12px);
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
    
    @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    .game2048-overlay-card {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 32px;
        padding: 32px;
        text-align: center;
        max-width: 360px;
        width: 90%;
        border: 2px solid;
        animation: scaleIn 0.3s ease;
        box-shadow: 0 30px 60px rgba(0,0,0,0.5);
    }
    
    .game2048-overlay-icon {
        font-size: 64px;
        margin-bottom: 16px;
    }
    
    .game2048-overlay-title {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 16px;
    }
    
    .game2048-overlay-text {
        color: rgba(255,255,255,0.8);
        margin-bottom: 20px;
        font-size: 14px;
        line-height: 1.5;
    }
    
    .game2048-overlay-stats {
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 12px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-around;
        font-weight: 600;
        color: #feca57;
        font-size: 14px;
    }
    
    .game2048-overlay-small {
        font-size: 12px;
        color: rgba(255,255,255,0.5);
        margin-bottom: 20px;
    }
    
    .game2048-overlay-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #feca57, #ff8c42);
        border: none;
        border-radius: 40px;
        font-size: 16px;
        font-weight: 700;
        color: #1a1a2e;
        cursor: pointer;
        margin-bottom: 10px;
        transition: transform 0.2s;
    }
    
    .game2048-overlay-btn.secondary {
        background: rgba(255,255,255,0.1);
        color: white;
        margin-bottom: 0;
    }
    
    .game2048-overlay-btn:hover {
        transform: translateY(-2px);
    }
    
    /* Mobile Responsive */
    @media (max-width: 550px) {
        .game2048-logo-2048 {
            font-size: 38px;
        }
        
        .game2048-score-card {
            padding: 6px 14px;
            min-width: 70px;
        }
        
        .game2048-score-value {
            font-size: 22px;
        }
        
        .game2048-row {
            gap: 8px;
        }
        
        .game2048-board {
            padding: 12px;
        }
        
        .game2048-cell-value {
            font-size: 22px !important;
        }
        
        .game2048-mobile-controls {
            display: flex;
        }
        
        .game2048-arrow-btn {
            width: 60px;
            padding: 12px;
        }
        
        .game2048-progress-text {
            font-size: 9px;
            white-space: nowrap;
        }
        
        .game2048-target-badge {
            font-size: 12px;
            padding: 4px 12px;
        }
    }
    
    @media (min-width: 551px) {
        .game2048-mobile-controls {
            display: none;
        }
    }
`;

export default NumberGames;