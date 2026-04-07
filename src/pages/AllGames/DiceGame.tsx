import React, { useState } from 'react';
import diceOne from '../../assets/dice-six-faces-one.png';
import diceTwo from '../../assets/inverted-dice-2.png';
import diceThree from '../../assets/inverted-dice-3.png';
import diceFour from '../../assets/inverted-dice-4.png';
import diceFive from '../../assets/inverted-dice-5.png';
import diceSix from '../../assets/inverted-dice-6.png';

interface Player {
    name: string;
    score: number;
    currentRoll: number;
    isActive: boolean;
    wins: number;
    color: string;
}

const DiceGame: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([
        { name: 'Player 1', score: 0, currentRoll: 0, isActive: true, wins: 0, color: '#FF6B6B' },
        { name: 'Player 2', score: 0, currentRoll: 0, isActive: false, wins: 0, color: '#4ECDC4' },
    ]);
    const [targetScore, setTargetScore] = useState<number>(50);
    const [winner, setWinner] = useState<string | null>(null);
    const [rolling, setRolling] = useState<boolean>(false);
    const [diceValue, setDiceValue] = useState<number>(1);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [rollHistory, setRollHistory] = useState<{ player: string; value: number; time: Date }[]>([]);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [animation, setAnimation] = useState<string>('');

    const diceImages = {
        1: diceOne,
        2: diceTwo,
        3: diceThree,
        4: diceFour,
        5: diceFive,
        6: diceSix,
    };

    const playSound = () => {
        if (!soundEnabled) return;
        // Simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.1;
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
            oscillator.stop(audioContext.currentTime + 0.3);
            setTimeout(() => audioContext.close(), 300);
        } catch (e) {
            console.log('Audio not supported');
        }
    };

    const rollDice = () => {
        if (winner || rolling) return;

        setRolling(true);
        setAnimation('shake');
        playSound();

        let rolls = 0;
        const maxRolls = 12;
        const interval = setInterval(() => {
            const randomValue = Math.floor(Math.random() * 6) + 1;
            setDiceValue(randomValue);
            rolls++;

            if (rolls >= maxRolls) {
                clearInterval(interval);
                const finalValue = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalValue);
                setAnimation('');
                processRoll(finalValue);
                setRolling(false);
            }
        }, 60);
    };

    const processRoll = (value: number) => {
        const activePlayerIndex = players.findIndex(p => p.isActive);
        if (activePlayerIndex === -1) return;

        const newPlayers = [...players];
        const newScore = newPlayers[activePlayerIndex].score + value;
        newPlayers[activePlayerIndex].currentRoll = value;
        newPlayers[activePlayerIndex].score = newScore;

        // Add to history
        setRollHistory(prev => [
            { player: newPlayers[activePlayerIndex].name, value, time: new Date() },
            ...prev.slice(0, 9)
        ]);

        // Check for winner
        if (newScore >= targetScore) {
            newPlayers[activePlayerIndex].wins += 1;
            setWinner(newPlayers[activePlayerIndex].name);
            setPlayers(newPlayers);
            playSound();
            return;
        }

        // Switch player
        newPlayers[activePlayerIndex].isActive = false;
        const nextPlayerIndex = (activePlayerIndex + 1) % 2;
        newPlayers[nextPlayerIndex].isActive = true;

        setPlayers(newPlayers);
    };

    const resetGame = () => {
        setPlayers(prev => prev.map(p => ({
            ...p,
            score: 0,
            currentRoll: 0,
            isActive: p.name === players[0].name,
        })));
        setWinner(null);
        setDiceValue(1);
        setRollHistory([]);
        setGameStarted(false);

    };

    const resetScores = () => {
        setPlayers(prev => prev.map(p => ({
            ...p,
            score: 0,
            currentRoll: 0,
            wins: 0,
            isActive: p.name === prev[0].name,
        })));
        setWinner(null);
        setDiceValue(1);
        setRollHistory([]);
    };

    const startGame = () => {
        if (targetScore < 10) {
            alert('Target score must be at least 10!');
            return;
        }
        setGameStarted(true);

    };

    const updatePlayerName = (index: number, name: string) => {
        const newPlayers = [...players];
        newPlayers[index].name = name;
        setPlayers(newPlayers);
    };

    const getCurrentPlayer = () => {
        return players.find(p => p.isActive);
    };

    const getScoreColor = (score: number, playerColor: string) => {
        if (score >= targetScore) return '#4CAF50';
        if (score >= targetScore * 0.7) return '#FFC107';
        return playerColor;
    };

    if (!gameStarted) {
        return (
            <div style={styles.container}>
                <div style={styles.animatedBg}>
                    <div style={styles.particle1}></div>
                    <div style={styles.particle2}></div>
                    <div style={styles.particle3}></div>
                </div>
                <div style={styles.settingsCard}>
                    <div style={styles.logo}>
                        <span style={styles.logoIcon}>🎲</span>
                        <h1 style={styles.title}>Dice Duel</h1>
                    </div>
                    <p style={styles.subtitle}>2-Player Challenge Arena</p>

                    <div style={styles.settingsSection}>
                        <h3 style={styles.sectionTitle}>👥 Player Names</h3>
                        <div style={styles.nameInputs}>
                            <div style={styles.nameInputWrapper}>
                                <span style={styles.player1Badge}>P1</span>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={players[0].name}
                                    onChange={(e) => updatePlayerName(0, e.target.value)}
                                    placeholder="Player 1 Name"
                                />
                            </div>
                            <div style={styles.nameInputWrapper}>
                                <span style={styles.player2Badge}>P2</span>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={players[1].name}
                                    onChange={(e) => updatePlayerName(1, e.target.value)}
                                    placeholder="Player 2 Name"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.settingsSection}>
                        <h3 style={styles.sectionTitle}>🎯 Target Score</h3>
                        <div style={styles.targetButtons}>
                            {[20, 30, 50, 75, 100].map(target => (
                                <button
                                    key={target}
                                    style={{
                                        ...styles.targetBtn,
                                        background: targetScore === target
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
                                        transform: targetScore === target ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                    onClick={() => setTargetScore(target)}
                                >
                                    {target}
                                </button>
                            ))}
                        </div>
                        <div style={styles.customTarget}>
                            <input
                                type="number"
                                style={styles.input}
                                value={targetScore}
                                onChange={(e) => setTargetScore(Number(e.target.value))}
                                placeholder="Custom target"
                                min="10"
                                max="500"
                            />
                        </div>
                    </div>

                    <div style={styles.settingsSection}>
                        <h3 style={styles.sectionTitle}>🔊 Sound Effects</h3>
                        <label style={styles.switch}>
                            <input
                                type="checkbox"
                                checked={soundEnabled}
                                onChange={(e) => setSoundEnabled(e.target.checked)}
                            />
                            <span style={styles.slider}></span>
                            <span style={styles.switchLabel}>
                                {soundEnabled ? 'Sound ON' : 'Sound OFF'}
                            </span>
                        </label>
                    </div>

                    <button style={styles.startBtn} onClick={startGame}>
                        Start Game 🎮
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Animated Background */}
            <div style={styles.animatedBg}>
                <div style={styles.particle1}></div>
                <div style={styles.particle2}></div>
                <div style={styles.particle3}></div>
            </div>

            {/* Game Header */}
            <div style={styles.header}>
                <div style={styles.logoSmall}>
                    <span>🎲</span>
                    <h2 style={styles.gameTitle}>Dice Duel</h2>
                </div>
                <div style={styles.headerControls}>
                    <div style={styles.targetDisplay}>Target: {targetScore}</div>
                    <button style={styles.iconBtn} onClick={resetScores} title="Reset Scores">
                        🔄
                    </button>
                    <button style={styles.iconBtn} onClick={resetGame} title="New Game">
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Players Section */}
            <div style={styles.playersContainer}>
                {players.map((player, index) => (
                    <div
                        key={index}
                        className="player-card"
                        style={{
                            ...styles.playerCard,
                            border: player.isActive ? `3px solid ${player.color}` : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: player.isActive ? `0 0 30px ${player.color}40` : 'none',
                            transform: player.isActive ? 'scale(1.02)' : 'scale(1)',
                            background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)`,
                        }}
                    >
                        <div style={styles.playerHeader}>
                            <div style={styles.playerIcon}>
                                <span style={styles.playerEmoji}>{index === 0 ? '👑' : '⚡'}</span>
                            </div>
                            <input
                                type="text"
                                style={styles.playerNameInput}
                                value={player.name}
                                onChange={(e) => updatePlayerName(index, e.target.value)}
                                maxLength={15}
                            />
                            {player.isActive && (
                                <div style={{ ...styles.activeBadge, background: player.color }}>
                                    🎯 ACTIVE
                                </div>
                            )}
                        </div>

                        <div style={styles.scoreSection}>
                            <div style={styles.scoreLabel}>SCORE</div>
                            <div style={{ ...styles.score, color: getScoreColor(player.score, player.color) }}>
                                {player.score}
                            </div>
                        </div>

                        {player.currentRoll > 0 && (
                            <div style={styles.lastRoll}>
                                Last Roll: <span style={{ ...styles.rollValue, color: player.color }}>{player.currentRoll}</span>
                            </div>
                        )}

                        <div style={styles.progressContainer}>
                            <div style={styles.progressBar}>
                                <div
                                    style={{
                                        ...styles.progressFill,
                                        width: `${Math.min((player.score / targetScore) * 100, 100)}%`,
                                        background: `linear-gradient(90deg, ${player.color}, ${player.color}dd)`,
                                    }}
                                />
                            </div>
                            <div style={styles.progressText}>
                                {Math.min(Math.floor((player.score / targetScore) * 100), 100)}%
                            </div>
                        </div>

                        <div style={styles.winsBadge}>
                            🏆 Wins: {player.wins}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dice Section */}
            {!winner && (
                <div style={styles.diceSection}>
                    <div
                        className={`dice-container ${animation}`}
                        style={styles.diceContainer}
                    >
                        <img
                            src={diceImages[diceValue as keyof typeof diceImages]}
                            alt={`Dice ${diceValue}`}
                            style={styles.dice}
                        />
                    </div>

                    <button
                        style={{
                            ...styles.rollBtn,
                            opacity: rolling ? 0.6 : 1,
                            cursor: rolling ? 'not-allowed' : 'pointer',
                            background: `linear-gradient(135deg, ${getCurrentPlayer()?.color || '#667eea'} 0%, ${getCurrentPlayer()?.color || '#764ba2'}dd 100%)`,
                        }}
                        onClick={rollDice}
                        disabled={rolling}
                    >
                        {rolling ? (
                            <span>🎲 Rolling...</span>
                        ) : (
                            <span>🎲 {getCurrentPlayer()?.name}'s Turn - Roll Dice</span>
                        )}
                    </button>
                </div>
            )}

            {/* Winner Section */}
            {winner && (
                <div style={styles.winnerSection}>
                    <div style={styles.winnerCard}>
                        <div style={styles.winnerAnimation}>🏆</div>
                        <h2 style={styles.winnerTitle}>
                            {winner} Wins! 🎉
                        </h2>
                        <p style={styles.winnerText}>
                            Congratulations! You reached {targetScore} points first!
                        </p>
                        <div style={styles.winnerActions}>
                            <button style={styles.playAgainBtn} onClick={resetScores}>
                                Play Again 🎮
                            </button>
                            <button style={styles.menuBtn} onClick={resetGame}>
                                Main Menu 🏠
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Roll History */}
            {rollHistory.length > 0 && (
                <div style={styles.historySection}>
                    <h3 style={styles.historyTitle}>
                        📜 Recent Rolls
                        <span style={styles.historyCount}>{rollHistory.length}/10</span>
                    </h3>
                    <div style={styles.historyList}>
                        {rollHistory.map((roll, index) => (
                            <div key={index} style={styles.historyItem}>
                                <span style={styles.historyPlayer}>
                                    {roll.player}
                                </span>
                                <span style={styles.historyValue}>
                                    rolled 🎲 {roll.value}
                                </span>
                                <span style={styles.historyTime}>
                                    {roll.time.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0) rotate(0deg); }
                        10% { transform: translateX(-10px) rotate(-10deg); }
                        20% { transform: translateX(10px) rotate(10deg); }
                        30% { transform: translateX(-5px) rotate(-5deg); }
                        40% { transform: translateX(5px) rotate(5deg); }
                        50% { transform: translateX(0) rotate(0deg); }
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(180deg); }
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(50px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    
                    .shake {
                        animation: shake 0.5s ease-in-out;
                    }
                    
                    .player-card {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    
                    .player-card:hover {
                        transform: translateY(-5px) !important;
                    }
                    
                    @media (max-width: 768px) {
                        .player-card {
                            margin: 0 10px;
                        }
                    }
                    
                    @keyframes winnerPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                `}
            </style>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: "'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    animatedBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
    },
    particle1: {
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '500px',
        height: '500px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        animation: 'float 20s infinite ease-in-out',
    },
    particle2: {
        position: 'absolute',
        bottom: '-50%',
        left: '-50%',
        width: '400px',
        height: '400px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '50%',
        animation: 'float 15s infinite ease-in-out reverse',
    },
    particle3: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '300px',
        height: '300px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '50%',
        animation: 'float 25s infinite ease-in-out',
    },
    settingsCard: {
        maxWidth: '550px',
        margin: '50px auto',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '30px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '10px',
    },
    logoIcon: {
        fontSize: '48px',
        animation: 'pulse 2s infinite',
    },
    title: {
        textAlign: 'center' as const,
        fontSize: '42px',
        margin: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center' as const,
        color: '#666',
        marginBottom: '30px',
        fontSize: '14px',
    },
    settingsSection: {
        marginBottom: '30px',
    },
    sectionTitle: {
        color: '#333',
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: '600',
    },
    nameInputs: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    nameInputWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    player1Badge: {
        background: '#FF6B6B',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '10px',
        fontWeight: 'bold',
        fontSize: '12px',
        minWidth: '40px',
        textAlign: 'center' as const,
    },
    player2Badge: {
        background: '#4ECDC4',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '10px',
        fontWeight: 'bold',
        fontSize: '12px',
        minWidth: '40px',
        textAlign: 'center' as const,
    },
    input: {
        flex: 1,
        padding: '12px',
        fontSize: '16px',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        outline: 'none',
        transition: 'all 0.3s',
        fontFamily: 'inherit',
    },
    targetButtons: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        marginBottom: '15px',
    },
    targetBtn: {
        padding: '10px',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.3s',
    },
    customTarget: {
        marginTop: '10px',
    },
    switch: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        cursor: 'pointer',
    },
    slider: {
        width: '50px',
        height: '24px',
        background: '#ccc',
        borderRadius: '12px',
        position: 'relative' as const,
        transition: '0.3s',
    },
    switchLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
    },
    startBtn: {
        width: '100%',
        padding: '15px',
        fontSize: '18px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        marginTop: '20px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap' as const,
        gap: '15px',
        position: 'relative',
        zIndex: 1,
    },
    logoSmall: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    gameTitle: {
        color: '#fff',
        fontSize: '24px',
        margin: 0,
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
    },
    headerControls: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    targetDisplay: {
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '8px 16px',
        borderRadius: '20px',
        color: '#fff',
        fontWeight: 'bold',
        backdropFilter: 'blur(10px)',
    },
    iconBtn: {
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '10px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'all 0.3s',
        backdropFilter: 'blur(10px)',
    },
    playersContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '25px',
        marginBottom: '40px',
        position: 'relative',
        zIndex: 1,
    },
    playerCard: {
        borderRadius: '25px',
        padding: '25px',
        transition: 'all 0.3s ease',
        position: 'relative',
        backdropFilter: 'blur(10px)',
    },
    playerHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap' as const,
    },
    playerIcon: {
        width: '50px',
        height: '50px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerEmoji: {
        fontSize: '28px',
    },
    playerNameInput: {
        flex: 1,
        fontSize: '18px',
        fontWeight: 'bold',
        border: 'none',
        background: 'transparent',
        outline: 'none',
        padding: '5px',
        fontFamily: 'inherit',
    },
    activeBadge: {
        color: '#fff',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
    },
    scoreSection: {
        textAlign: 'center' as const,
        marginBottom: '20px',
    },
    scoreLabel: {
        fontSize: '12px',
        color: '#666',
        letterSpacing: '2px',
        marginBottom: '5px',
        fontWeight: '600',
    },
    score: {
        fontSize: '56px',
        fontWeight: 'bold',
        lineHeight: 1,
    },
    lastRoll: {
        textAlign: 'center' as const,
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '12px',
        marginBottom: '15px',
        fontSize: '14px',
    },
    rollValue: {
        fontSize: '20px',
        fontWeight: 'bold',
    },
    progressContainer: {
        marginBottom: '15px',
    },
    progressBar: {
        width: '100%',
        height: '10px',
        background: '#e0e0e0',
        borderRadius: '5px',
        overflow: 'hidden',
        marginBottom: '8px',
    },
    progressFill: {
        height: '100%',
        transition: 'width 0.3s ease',
        borderRadius: '5px',
    },
    progressText: {
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#666',
        fontWeight: '600',
    },
    winsBadge: {
        textAlign: 'center' as const,
        padding: '8px',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    diceSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '30px',
        marginBottom: '40px',
        position: 'relative',
        zIndex: 1,
    },
    diceContainer: {
        cursor: 'pointer',
    },
    dice: {
        width: '150px',
        height: '150px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        transition: 'all 0.3s',
        objectFit: 'contain' as const,
    },
    rollBtn: {
        padding: '15px 40px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#fff',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    },
    winnerSection: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease',
    },
    winnerCard: {
        background: '#fff',
        borderRadius: '30px',
        padding: '50px',
        textAlign: 'center' as const,
        maxWidth: '450px',
        animation: 'slideUp 0.5s ease',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    winnerAnimation: {
        fontSize: '100px',
        display: 'block',
        marginBottom: '20px',
        animation: 'winnerPulse 1s infinite',
    },
    winnerTitle: {
        fontSize: '36px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '15px',
    },
    winnerText: {
        color: '#666',
        marginBottom: '30px',
        fontSize: '16px',
    },
    winnerActions: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
    },
    playAgainBtn: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    menuBtn: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        background: '#f5f5f5',
        color: '#667eea',
        border: '2px solid #667eea',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    historySection: {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '20px',
        marginTop: '20px',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
    },
    historyTitle: {
        color: '#333',
        marginBottom: '15px',
        fontSize: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyCount: {
        fontSize: '12px',
        color: '#999',
        fontWeight: 'normal',
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        maxHeight: '200px',
        overflowY: 'auto' as const,
    },
    historyItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '10px',
        transition: 'transform 0.2s',
    },
    historyPlayer: {
        fontWeight: 'bold',
        color: '#667eea',
        fontSize: '14px',
    },
    historyValue: {
        color: '#333',
        fontSize: '14px',
    },
    historyTime: {
        fontSize: '11px',
        color: '#999',
    },
};

export default DiceGame;