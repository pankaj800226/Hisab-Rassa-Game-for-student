import { useEffect, useState, useCallback, type JSX } from "react";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type GameMode = "normal" | "notes";

interface Cell {
    value: number;
    isGiven: boolean;
    isSelected: boolean;
    notes: Set<number>;
    row: number;
    col: number;
    box: number;
}

interface DifficultyConfig {
    label: string;
    color: string;
    icon: string;
    cellsToRemove: number;
    description: string;
}

const Sudoku = (): JSX.Element => {
    const [board, setBoard] = useState<Cell[][]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [gameMode, setGameMode] = useState<GameMode>("normal");
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isGameActive, setIsGameActive] = useState(true);
    const [mistakes, setMistakes] = useState(0);
    const [maxMistakes] = useState(5);
    const [hintCell, setHintCell] = useState<{ row: number; col: number; value: number } | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [soundOn, setSoundOn] = useState(true);
    const [showCongratulations, setShowCongratulations] = useState(false);
    const [stats, setStats] = useState<Record<Difficulty, { played: number; won: number }>>(() => {
        const saved = localStorage.getItem("sudoku-stats");
        return saved ? JSON.parse(saved) : {
            easy: { played: 0, won: 0 },
            medium: { played: 0, won: 0 },
            hard: { played: 0, won: 0 },
            expert: { played: 0, won: 0 }
        };
    });

    // Difficulty configurations
    const difficultyConfigs: Record<Difficulty, DifficultyConfig> = {
        easy: {
            label: "Easy",
            color: "#39FF14",
            icon: "🌱",
            cellsToRemove: 40,
            description: "Perfect for beginners"
        },
        medium: {
            label: "Medium",
            color: "#FFD700",
            icon: "⚡",
            cellsToRemove: 50,
            description: "Challenge your logic"
        },
        hard: {
            label: "Hard",
            color: "#FF6B35",
            icon: "🔥",
            cellsToRemove: 60,
            description: "Expert level thinking"
        },
        expert: {
            label: "Expert",
            color: "#FF4444",
            icon: "💀",
            cellsToRemove: 65,
            description: "Only for masters!"
        }
    };

    const currentDifficulty = difficultyConfigs[difficulty];

    // Sound effects
    const playSound = useCallback((type: "place" | "error" | "win" | "click" | "hint") => {
        if (!soundOn) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            switch (type) {
                case "place":
                    osc.frequency.value = 523.25;
                    osc.type = "sine";
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                    break;
                case "error":
                    osc.frequency.value = 220;
                    osc.type = "sawtooth";
                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
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
                case "click":
                    osc.frequency.value = 880;
                    osc.type = "triangle";
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                    break;
                case "hint":
                    osc.frequency.value = 1318.52;
                    osc.type = "sine";
                    gain.gain.setValueAtTime(0.12, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                    break;
            }
        } catch (e) { }
    }, [soundOn]);

    // Generate complete Sudoku solution
    const generateCompleteBoard = useCallback((): number[][] => {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));

        const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
            for (let x = 0; x < 9; x++) {
                if (board[row][x] === num || board[x][col] === num) return false;
            }

            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (board[boxRow + i][boxCol + j] === num) return false;
                }
            }
            return true;
        };

        const solve = (board: number[][]): boolean => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                        for (let i = nums.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [nums[i], nums[j]] = [nums[j], nums[i]];
                        }

                        for (const num of nums) {
                            if (isValid(board, row, col, num)) {
                                board[row][col] = num;
                                if (solve(board)) return true;
                                board[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        solve(board);
        return board;
    }, []);

    // Remove cells based on difficulty
    const removeCells = useCallback((completeBoard: number[][], cellsToRemove: number): number[][] => {
        const puzzle = completeBoard.map(row => [...row]);
        let removed = 0;

        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }

        return puzzle;
    }, []);

    // Initialize new game
    const initGame = useCallback(() => {
        const completeBoard = generateCompleteBoard();
        const puzzle = removeCells(completeBoard, currentDifficulty.cellsToRemove);

        const newBoard: Cell[][] = [];
        for (let i = 0; i < 9; i++) {
            newBoard.push([]);
            for (let j = 0; j < 9; j++) {
                newBoard[i].push({
                    value: puzzle[i][j],
                    isGiven: puzzle[i][j] !== 0,
                    isSelected: false,
                    notes: new Set(),
                    row: i,
                    col: j,
                    box: Math.floor(i / 3) * 3 + Math.floor(j / 3)
                });
            }
        }

        setBoard(newBoard);
        setMistakes(0);
        setIsGameActive(true);
        setShowCongratulations(false);
        setSelectedCell(null);
        setHintCell(null);

        // Update stats
        setStats(prev => ({
            ...prev,
            [difficulty]: {
                ...prev[difficulty],
                played: prev[difficulty].played + 1
            }
        }));

        playSound("click");
    }, [difficulty, generateCompleteBoard, removeCells, playSound]);

    // Check if board is complete and correct
    const checkWin = useCallback(() => {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j].value === 0) return false;
            }
        }

        // Verify all numbers are correct
        const isValidSolution = (): boolean => {
            // Check rows
            for (let i = 0; i < 9; i++) {
                const rowSet = new Set();
                for (let j = 0; j < 9; j++) {
                    if (rowSet.has(board[i][j].value)) return false;
                    rowSet.add(board[i][j].value);
                }
            }

            // Check columns
            for (let j = 0; j < 9; j++) {
                const colSet = new Set();
                for (let i = 0; i < 9; i++) {
                    if (colSet.has(board[i][j].value)) return false;
                    colSet.add(board[i][j].value);
                }
            }

            // Check boxes
            for (let box = 0; box < 9; box++) {
                const boxSet = new Set();
                const startRow = Math.floor(box / 3) * 3;
                const startCol = (box % 3) * 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (boxSet.has(board[startRow + i][startCol + j].value)) return false;
                        boxSet.add(board[startRow + i][startCol + j].value);
                    }
                }
            }

            return true;
        };

        if (isValidSolution()) {
            setIsGameActive(false);
            setShowCongratulations(true);
            playSound("win");

            // Update stats
            setStats(prev => {
                const newStats = { ...prev };
                newStats[difficulty].won += 1;
                localStorage.setItem("sudoku-stats", JSON.stringify(newStats));
                return newStats;
            });

            return true;
        }

        return false;
    }, [board, difficulty, playSound]);

    // Place number in cell
    const placeNumber = useCallback((number: number) => {
        if (!selectedCell || !isGameActive) return;

        const { row, col } = selectedCell;
        const cell = board[row][col];

        if (cell.isGiven) return;

        if (gameMode === "notes") {
            // Notes mode
            const newBoard = [...board];
            if (newBoard[row][col].notes.has(number)) {
                newBoard[row][col].notes.delete(number);
            } else {
                newBoard[row][col].notes.add(number);
            }
            setBoard(newBoard);
            playSound("click");
        } else {
            // Normal mode
            // Check if number is valid
            const isValid = (() => {
                // Check row
                for (let j = 0; j < 9; j++) {
                    if (board[row][j].value === number) return false;
                }
                // Check column
                for (let i = 0; i < 9; i++) {
                    if (board[i][col].value === number) return false;
                }
                // Check box
                const boxRow = Math.floor(row / 3) * 3;
                const boxCol = Math.floor(col / 3) * 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (board[boxRow + i][boxCol + j].value === number) return false;
                    }
                }
                return true;
            })();

            if (!isValid && number !== 0) {
                setMistakes(prev => prev + 1);
                playSound("error");

                if (mistakes + 1 >= maxMistakes) {
                    setIsGameActive(false);
                    setShowCongratulations(false);
                    playSound("error");
                }
                return;
            }

            const newBoard = [...board];
            newBoard[row][col].value = number;
            newBoard[row][col].notes.clear();
            setBoard(newBoard);
            playSound("place");

            checkWin();
        }
    }, [selectedCell, board, gameMode, isGameActive, mistakes, maxMistakes, playSound, checkWin]);

    // Clear selected cell
    const clearCell = useCallback(() => {
        if (!selectedCell || !isGameActive) return;
        const { row, col } = selectedCell;
        const cell = board[row][col];

        if (cell.isGiven) return;

        const newBoard = [...board];
        newBoard[row][col].value = 0;
        newBoard[row][col].notes.clear();
        setBoard(newBoard);
        playSound("click");
    }, [selectedCell, board, isGameActive, playSound]);

    // Get hint
    const getHint = useCallback(() => {
        if (!isGameActive) return;

        // Find first empty cell and solve it
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j].value === 0 && !board[i][j].isGiven) {
                    // Try numbers 1-9
                    for (let num = 1; num <= 9; num++) {
                        let isValid = true;

                        // Check row
                        for (let col = 0; col < 9; col++) {
                            if (board[i][col].value === num) isValid = false;
                        }
                        // Check column
                        for (let row = 0; row < 9; row++) {
                            if (board[row][j].value === num) isValid = false;
                        }
                        // Check box
                        const boxRow = Math.floor(i / 3) * 3;
                        const boxCol = Math.floor(j / 3) * 3;
                        for (let row = 0; row < 3; row++) {
                            for (let col = 0; col < 3; col++) {
                                if (board[boxRow + row][boxCol + col].value === num) isValid = false;
                            }
                        }

                        if (isValid) {
                            setHintCell({ row: i, col: j, value: num });
                            playSound("hint");
                            setTimeout(() => setHintCell(null), 3000);
                            return;
                        }
                    }
                }
            }
        }
    }, [board, isGameActive, playSound]);

    // Initialize game on mount and difficulty change
    useEffect(() => {
        initGame();
    }, [difficulty]);

    // Get cell background color
    const getCellColor = (row: number, col: number, value: number) => {
        if (hintCell && hintCell.row === row && hintCell.col === col) {
            return "#FFD70040";
        }
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            return currentDifficulty.color + "30";
        }
        if (selectedCell && (selectedCell.row === row || selectedCell.col === col)) {
            return "rgba(255,255,255,0.05)";
        }
        if (value !== 0 && selectedCell && board[selectedCell.row][selectedCell.col]?.value === value) {
            return currentDifficulty.color + "20";
        }
        return "rgba(255,255,255,0.03)";
    };

    return (
        <>
            <style>{css}</style>
            <div className="sudoku-root">
                <div className="sudoku-container">
                    {/* Header */}
                    <div className="sudoku-header">
                        <div className="sudoku-logo">
                            <span>🧩</span>
                            <span className="sudoku-logo-text">Sudoku</span>
                            <span className="sudoku-logo-badge">Mind Game</span>
                        </div>
                        <div className="sudoku-controls">
                            <button
                                className="sudoku-icon-btn"
                                onClick={() => setGameMode(gameMode === "normal" ? "notes" : "normal")}
                                style={{
                                    background: gameMode === "notes" ? `${currentDifficulty.color}20` : "rgba(255,255,255,0.05)",
                                    borderColor: gameMode === "notes" ? currentDifficulty.color : "rgba(255,255,255,0.1)"
                                }}
                            >
                                {gameMode === "normal" ? "✏️" : "📝"}
                            </button>
                            <button
                                className="sudoku-icon-btn"
                                onClick={() => setSoundOn(!soundOn)}
                            >
                                {soundOn ? "🔊" : "🔇"}
                            </button>
                            <button
                                className="sudoku-icon-btn"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                ⚙️
                            </button>
                            <button className="sudoku-reset-btn" onClick={initGame}>
                                ↺ New Game
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="sudoku-settings-panel">
                            <h3 className="sudoku-settings-title">Game Settings</h3>

                            <div className="sudoku-setting-group">
                                <label>Difficulty Level</label>
                                <div className="sudoku-difficulty-buttons">
                                    {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((diff) => (
                                        <button
                                            key={diff}
                                            className={`sudoku-diff-btn ${difficulty === diff ? "active" : ""}`}
                                            style={{
                                                borderColor: difficulty === diff ? difficultyConfigs[diff].color : "rgba(255,255,255,0.1)",
                                                background: difficulty === diff ? `${difficultyConfigs[diff].color}20` : "rgba(255,255,255,0.05)"
                                            }}
                                            onClick={() => { setDifficulty(diff); setShowSettings(false); }}
                                        >
                                            <span>{difficultyConfigs[diff].icon}</span>
                                            <span style={{ color: difficultyConfigs[diff].color }}>{difficultyConfigs[diff].label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="sudoku-stats-preview">
                                <h4>Your Statistics</h4>
                                <div className="sudoku-stats-grid">
                                    {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((diff) => (
                                        <div key={diff} className="sudoku-stat-item">
                                            <span className="sudoku-stat-label">{difficultyConfigs[diff].icon} {difficultyConfigs[diff].label}</span>
                                            <span className="sudoku-stat-value">Won: {stats[diff].won}/{stats[diff].played}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Game Info - Timer removed */}
                    <div className="sudoku-info">
                        <div className="sudoku-info-card">
                            <span className="sudoku-info-label">💀 Mistakes</span>
                            <span className="sudoku-info-value" style={{ color: mistakes >= maxMistakes ? "#FF4444" : "#FFD700" }}>
                                {mistakes}/{maxMistakes}
                            </span>
                        </div>
                        <div className="sudoku-info-card">
                            <span className="sudoku-info-label">🎯 Difficulty</span>
                            <span className="sudoku-info-value" style={{ color: currentDifficulty.color }}>
                                {currentDifficulty.icon} {currentDifficulty.label}
                            </span>
                        </div>
                    </div>

                    {/* Sudoku Board */}
                    <div className="sudoku-board">
                        {board.map((row, i) => (
                            <div key={i} className="sudoku-row">
                                {row.map((cell, j) => (
                                    <button
                                        key={`${i}-${j}`}
                                        className={`sudoku-cell ${cell.isGiven ? "sudoku-cell--given" : ""} 
                      ${selectedCell?.row === i && selectedCell?.col === j ? "sudoku-cell--selected" : ""}
                      ${cell.value !== 0 && !cell.isGiven ? "sudoku-cell--user" : ""}`}
                                        style={{
                                            backgroundColor: getCellColor(i, j, cell.value),
                                            borderColor: (i + 1) % 3 === 0 && j !== 8 ?
                                                `${currentDifficulty.color}60` : "rgba(255,255,255,0.1)"
                                        }}
                                        onClick={() => {
                                            setSelectedCell({ row: i, col: j });
                                            playSound("click");
                                        }}
                                    >
                                        {cell.value !== 0 ? (
                                            <span className={`sudoku-cell-value ${cell.isGiven ? "given" : "user"}`}>
                                                {cell.value}
                                            </span>
                                        ) : gameMode === "notes" && cell.notes.size > 0 ? (
                                            <div className="sudoku-notes">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                                    <span key={num} className="sudoku-note">
                                                        {cell.notes.has(num) ? num : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Number Pad */}
                    <div className="sudoku-number-pad">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                className="sudoku-number-btn"
                                style={{ borderColor: currentDifficulty.color }}
                                onClick={() => placeNumber(num)}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            className="sudoku-number-btn sudoku-clear-btn"
                            onClick={clearCell}
                        >
                            🗑️
                        </button>
                        <button
                            className="sudoku-number-btn sudoku-hint-btn"
                            style={{ borderColor: "#FFD700" }}
                            onClick={getHint}
                        >
                            💡 Hint
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="sudoku-instructions">
                        <span>✏️ Click number to fill</span>
                        <span>📝 Toggle Notes mode for pencil marks</span>
                        <span>💡 Use hints when stuck</span>
                    </div>

                    {/* Win/Lose Overlay - Timer removed from here too */}
                    {(showCongratulations || (!isGameActive && !showCongratulations && mistakes >= maxMistakes)) && (
                        <div className="sudoku-overlay">
                            <div className="sudoku-overlay-card" style={{ borderColor: showCongratulations ? currentDifficulty.color : "#FF4444" }}>
                                <div className="sudoku-overlay-icon">
                                    {showCongratulations ? "🏆" : "💀"}
                                </div>
                                <h2 className="sudoku-overlay-title" style={{ color: showCongratulations ? currentDifficulty.color : "#FF4444" }}>
                                    {showCongratulations ? "Congratulations!" : "Game Over!"}
                                </h2>
                                {showCongratulations ? (
                                    <>
                                        <p className="sudoku-overlay-text">You solved the puzzle!</p>
                                        <div className="sudoku-overlay-stats">
                                            <div>Mistakes: {mistakes}</div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="sudoku-overlay-text">Too many mistakes. Try again!</p>
                                )}
                                <button className="sudoku-overlay-btn" onClick={initGame}>
                                    Play Again →
                                </button>
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
    -webkit-tap-highlight-color: transparent;
  }

  .sudoku-root {
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .sudoku-container {
    max-width: 650px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Header */
  .sudoku-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .sudoku-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
    font-weight: 800;
  }

  .sudoku-logo-text {
    background: linear-gradient(135deg, #FFD700, #FF6B6B);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-size: 20px;
  }

  .sudoku-logo-badge {
    font-size: 10px;
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.6);
  }

  .sudoku-controls {
    display: flex;
    gap: 8px;
  }

  .sudoku-icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sudoku-icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }

  .sudoku-reset-btn {
    padding: 8px 16px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sudoku-reset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Settings Panel */
  .sudoku-settings-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
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

  .sudoku-settings-title {
    color: white;
    font-size: 16px;
    margin-bottom: 16px;
  }

  .sudoku-setting-group {
    margin-bottom: 20px;
  }

  .sudoku-setting-group label {
    display: block;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    margin-bottom: 8px;
  }

  .sudoku-difficulty-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sudoku-diff-btn {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .sudoku-diff-btn.active {
    transform: scale(1.02);
  }

  .sudoku-stats-preview {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sudoku-stats-preview h4 {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    margin-bottom: 12px;
  }

  .sudoku-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .sudoku-stat-item {
    background: rgba(255, 255, 255, 0.03);
    padding: 8px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sudoku-stat-label {
    font-size: 11px;
    font-weight: 600;
  }

  .sudoku-stat-value {
    font-size: 12px;
    color: #FFD700;
  }

  /* Game Info - Updated for 2 cards instead of 3 */
  .sudoku-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .sudoku-info-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px;
    text-align: center;
  }

  .sudoku-info-label {
    display: block;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  .sudoku-info-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
  }

  /* Board */
  .sudoku-board {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    padding: 8px;
  }

  .sudoku-row {
    display: flex;
  }

  .sudoku-cell {
    flex: 1;
    aspect-ratio: 1;
    border: 1px solid;
    background: rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    position: relative;
  }

  .sudoku-cell:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .sudoku-cell--given .sudoku-cell-value {
    color: #FFD700;
  }

  .sudoku-cell--user .sudoku-cell-value {
    color: white;
  }

  .sudoku-cell-value {
    font-size: 22px;
    font-weight: 700;
  }

  .sudoku-notes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    width: 100%;
    height: 100%;
    padding: 4px;
  }

  .sudoku-note {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Number Pad */
  .sudoku-number-pad {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }

  .sudoku-number-btn {
    padding: 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid;
    color: white;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sudoku-number-btn:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.1);
  }

  .sudoku-clear-btn {
    background: rgba(255, 68, 68, 0.2);
    border-color: #FF4444 !important;
    color: #FF4444;
  }

  .sudoku-hint-btn {
    background: rgba(255, 215, 0, 0.2);
    border-color: #FFD700 !important;
    color: #FFD700;
  }

  /* Instructions */
  .sudoku-instructions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    flex-wrap: wrap;
  }

  /* Overlay */
  .sudoku-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .sudoku-overlay-card {
    background: linear-gradient(135deg, #1a1a2e, #0a0a1a);
    border: 2px solid;
    border-radius: 24px;
    padding: 32px;
    text-align: center;
    max-width: 320px;
    width: 90%;
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

  .sudoku-overlay-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .sudoku-overlay-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 12px;
  }

  .sudoku-overlay-text {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 20px;
  }

  .sudoku-overlay-stats {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    color: white;
    font-weight: 600;
  }

  .sudoku-overlay-btn {
    padding: 12px 24px;
    border-radius: 12px;
    background: linear-gradient(135deg, #FFD700, #FF6B6B);
    border: none;
    color: #1a1a2e;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sudoku-overlay-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  }

  /* Mobile Responsive */
  @media (max-width: 480px) {
    .sudoku-root {
      padding: 12px;
    }

    .sudoku-cell-value {
      font-size: 16px;
    }

    .sudoku-note {
      font-size: 8px;
    }

    .sudoku-number-btn {
      font-size: 16px;
      padding: 10px;
    }

    .sudoku-info-value {
      font-size: 16px;
    }

    .sudoku-logo-text {
      font-size: 16px;
    }

    .sudoku-logo-badge {
      display: none;
    }

    .sudoku-instructions span {
      font-size: 9px;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) {
    .sudoku-cell:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .sudoku-number-btn:hover {
      transform: none;
    }
  }
`;

export default Sudoku;