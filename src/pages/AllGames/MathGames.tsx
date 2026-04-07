import React, { useState, useEffect, useCallback, useRef } from 'react';

type MathGameType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
    num1: number;
    num2: number;
    operator: string;
    answer: number;
}

const MathGames: React.FC = () => {
    // Game States
    const [gameType, setGameType] = useState<MathGameType>('addition');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userInput, setUserInput] = useState('');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        return Number(localStorage.getItem('mathHighScore') || 0);
    });
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameActive, setGameActive] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'wrong' | 'info' } | null>(null);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [timerActive, setTimerActive] = useState(true);
    const [showMenu, setShowMenu] = useState(true);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Generate random number based on difficulty
    const getRandomNumber = (max: number, min: number = 1): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Get number range based on difficulty
    const getNumberRange = (): { min: number; max: number } => {
        switch (difficulty) {
            case 'easy': return { min: 1, max: 10 };
            case 'medium': return { min: 1, max: 20 };
            case 'hard': return { min: 10, max: 100 };
            default: return { min: 1, max: 20 };
        }
    };

    // Generate a new question
    const generateQuestion = useCallback(() => {
        const { min, max } = getNumberRange();
        let num1: number, num2: number, operator: string, answer: number;

        // For division, ensure clean division
        if (gameType === 'division') {
            answer = getRandomNumber(difficulty === 'hard' ? 12 : 10, 2);
            num2 = getRandomNumber(difficulty === 'hard' ? 12 : 10, 2);
            num1 = answer * num2;
            operator = '÷';
        } else {
            num1 = getRandomNumber(max, min);
            num2 = getRandomNumber(max, min);
            
            // For subtraction, ensure positive answer
            if (gameType === 'subtraction' && num1 < num2) {
                [num1, num2] = [num2, num1];
            }
            
            // For mixed mode, random operator
            let actualGameType: MathGameType = gameType;
            if (gameType === 'mixed') {
                const types: MathGameType[] = ['addition', 'subtraction', 'multiplication', 'division'];
                actualGameType = types[Math.floor(Math.random() * types.length)];
            }
            
            switch (actualGameType) {
                case 'addition':
                    operator = '+';
                    answer = num1 + num2;
                    break;
                case 'subtraction':
                    operator = '−';
                    answer = num1 - num2;
                    break;
                case 'multiplication':
                    operator = '×';
                    answer = num1 * num2;
                    if (difficulty === 'hard') {
                        num1 = getRandomNumber(12, 2);
                        num2 = getRandomNumber(12, 2);
                        answer = num1 * num2;
                    }
                    break;
                default:
                    operator = '+';
                    answer = num1 + num2;
            }
        }
        
        setCurrentQuestion({ num1, num2, operator, answer });
        setUserInput('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameType, difficulty]);

    // Check answer
    const checkAnswer = useCallback(() => {
        if (!currentQuestion || !gameActive) return;
        
        const userAnswerNum = parseInt(userInput);
        if (isNaN(userAnswerNum)) return;
        
        const isCorrect = userAnswerNum === currentQuestion.answer;
        
        if (isCorrect) {
            // Calculate points based on difficulty and streak
            let points = 10;
            if (difficulty === 'medium') points = 15;
            if (difficulty === 'hard') points = 25;
            points += Math.min(streak * 2, 20);
            
            setScore(prev => prev + points);
            setCorrectAnswers(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            
            setFeedback({ message: `✓ Correct! +${points} points`, type: 'correct' });
            
            if (navigator.vibrate) navigator.vibrate(50);
            
            setTimeout(() => setFeedback(null), 800);
            generateQuestion();
        } else {
            setStreak(0);
            setFeedback({ 
                message: `✗ Wrong! Answer was ${currentQuestion.answer}`, 
                type: 'wrong' 
            });
            
            if (navigator.vibrate) navigator.vibrate(200);
            
            setTimeout(() => setFeedback(null), 1200);
            setUserInput('');
            if (inputRef.current) inputRef.current.focus();
            return;
        }
        
        setQuestionsAnswered(prev => prev + 1);
    }, [currentQuestion, userInput, gameActive, difficulty, streak, bestStreak, generateQuestion]);

    // Start Game
    const startGame = useCallback(() => {
        setScore(0);
        setQuestionsAnswered(0);
        setCorrectAnswers(0);
        setStreak(0);
        setTimeLeft(timerActive ? 60 : 0);
        setGameActive(true);
        setShowMenu(false);
        setFeedback(null);
        setUserInput('');
        
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Generate first question
        setTimeout(() => {
            generateQuestion();
        }, 10);
        
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setGameActive(false);
                        setShowMenu(true);
                        if (score > highScore) {
                            setHighScore(score);
                            localStorage.setItem('mathHighScore', score.toString());
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [timerActive, generateQuestion, score, highScore]);

    // End game
    const endGame = () => {
        setGameActive(false);
        setShowMenu(true);
        if (timerRef.current) clearInterval(timerRef.current);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('mathHighScore', score.toString());
        }
    };

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && gameActive && currentQuestion) {
            checkAnswer();
        }
    };

    // Get difficulty color
    const getDifficultyColor = () => {
        switch (difficulty) {
            case 'easy': return '#4CAF50';
            case 'medium': return '#FF9800';
            case 'hard': return '#f44336';
            default: return '#FF6B35';
        }
    };

    // Menu Screen
    if (showMenu) {
        return (
            <>
                <style>{mathStyles}</style>
                <div className="math-root">
                    <div className="math-container">
                        <div className="math-header">
                            <h1 className="math-title">🧮 Math <span className="math-accent">Solver</span></h1>
                            <p className="math-subtitle">Solve equations fast & beat your high score!</p>
                        </div>

                        <div className="math-highscore">
                            🏆 High Score: {highScore}
                        </div>

                        <div className="math-section">
                            <h3>📚 Game Mode</h3>
                            <div className="math-options-grid">
                                {[
                                    { value: 'addition', label: '➕ Addition', icon: '➕' },
                                    { value: 'subtraction', label: '➖ Subtraction', icon: '➖' },
                                    { value: 'multiplication', label: '✖️ Multiplication', icon: '✖️' },
                                    { value: 'division', label: '➗ Division', icon: '➗' },
                                    { value: 'mixed', label: '🎲 Mixed', icon: '🎲' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        className={`math-option-btn ${gameType === option.value ? 'active' : ''}`}
                                        onClick={() => setGameType(option.value as MathGameType)}
                                    >
                                        <span className="math-option-icon">{option.icon}</span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="math-section">
                            <h3>⚡ Difficulty</h3>
                            <div className="math-difficulty-buttons">
                                {[
                                    { value: 'easy', label: '🌟 Easy', color: '#4CAF50' },
                                    { value: 'medium', label: '🔥 Medium', color: '#FF9800' },
                                    { value: 'hard', label: '💀 Hard', color: '#f44336' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        className={`math-diff-btn ${difficulty === option.value ? 'active' : ''}`}
                                        style={{
                                            background: difficulty === option.value ? option.color : 'rgba(255,255,255,0.1)',
                                            borderColor: option.color
                                        }}
                                        onClick={() => setDifficulty(option.value as Difficulty)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="math-section">
                            <label className="math-toggle">
                                <input
                                    type="checkbox"
                                    checked={timerActive}
                                    onChange={(e) => setTimerActive(e.target.checked)}
                                />
                                <span className="math-toggle-slider"></span>
                                <span>⏱️ Enable Timer (60 seconds)</span>
                            </label>
                        </div>

                        <button className="math-start-btn" onClick={startGame}>
                            🚀 Start Game
                        </button>

                        <div className="math-instructions">
                            <h4>📖 How to Play:</h4>
                            <ul>
                                <li>Solve math problems as fast as you can</li>
                                <li>Type answer and press Enter</li>
                                <li>Correct answers = points + streak bonus</li>
                                <li>Wrong answers break your streak!</li>
                                <li>Beat the high score to win! 🏆</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Game Screen
    return (
        <>
            <style>{mathStyles}</style>
            <div className="math-root math-game-active">
                <div className="math-container">
                    <div className="math-game-header">
                        <button className="math-back-btn" onClick={endGame}>
                            ← Menu
                        </button>
                        <div className="math-stats">
                            <div className="math-stat">
                                <span>⭐ Score</span>
                                <strong>{score}</strong>
                            </div>
                            <div className="math-stat">
                                <span>🎯 Correct</span>
                                <strong>{correctAnswers}/{questionsAnswered || 0}</strong>
                            </div>
                            <div className="math-stat">
                                <span>🔥 Streak</span>
                                <strong className="math-streak">{streak}</strong>
                            </div>
                            {timerActive && (
                                <div className="math-stat">
                                    <span>⏱️ Time</span>
                                    <strong className={timeLeft <= 10 ? 'math-time-warning' : ''}>{timeLeft}s</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="math-question-card" style={{ borderColor: getDifficultyColor() }}>
                        {currentQuestion && (
                            <>
                                <div className="math-question">
                                    <span className="math-number">{currentQuestion.num1}</span>
                                    <span className="math-operator" style={{ color: getDifficultyColor() }}>
                                        {currentQuestion.operator}
                                    </span>
                                    <span className="math-number">{currentQuestion.num2}</span>
                                    <span className="math-equals">=</span>
                                    <span className="math-question-mark">?</span>
                                </div>
                                
                                <div className="math-input-area">
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        className="math-input"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter answer"
                                        autoFocus
                                    />
                                    <button className="math-submit-btn" onClick={checkAnswer}>
                                        Submit →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {feedback && (
                        <div className={`math-feedback ${feedback.type}`}>
                            {feedback.message}
                        </div>
                    )}

                    <div className="math-progress">
                        <div 
                            className="math-progress-bar" 
                            style={{ 
                                width: questionsAnswered > 0 ? `${(correctAnswers / questionsAnswered) * 100}%` : '0%',
                                background: getDifficultyColor()
                            }} 
                        />
                    </div>

                    {bestStreak >= 5 && (
                        <div className="math-badge">
                            🔥 Best Streak: {bestStreak}!
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const mathStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

    .math-root {
        min-height: 100vh;
        background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%);
        padding: 24px;
        font-family: 'DM Sans', sans-serif;
    }
    
    .math-container {
        max-width: 600px;
        margin: 0 auto;
        background: rgba(255,255,255,0.05);
        border-radius: 32px;
        padding: 32px 24px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .math-header {
        text-align: center;
        margin-bottom: 32px;
    }
    
    .math-title {
        font-family: 'Syne', sans-serif;
        font-size: clamp(28px, 6vw, 42px);
        font-weight: 800;
        color: white;
        margin: 0;
    }
    
    .math-accent {
        color: #FF6B35;
        background: linear-gradient(135deg, #FF6B35, #FF4D6D);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .math-subtitle {
        color: rgba(255,255,255,0.5);
        margin-top: 8px;
        font-size: 14px;
    }
    
    .math-highscore {
        text-align: center;
        background: linear-gradient(135deg, #FFD70020, #FFA50020);
        padding: 12px;
        border-radius: 60px;
        color: #FFD700;
        font-weight: bold;
        margin-bottom: 24px;
        border: 1px solid rgba(255,215,0,0.3);
    }
    
    .math-section {
        margin-bottom: 28px;
    }
    
    .math-section h3 {
        color: white;
        margin-bottom: 12px;
        font-size: 16px;
    }
    
    .math-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 10px;
    }
    
    .math-option-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 12px 8px;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        font-size: 12px;
    }
    
    .math-option-icon {
        font-size: 24px;
    }
    
    .math-option-btn.active {
        background: #FF6B35;
        border-color: #FF6B35;
        transform: scale(1.02);
    }
    
    .math-difficulty-buttons {
        display: flex;
        gap: 12px;
    }
    
    .math-diff-btn {
        flex: 1;
        padding: 12px;
        border-radius: 40px;
        border: 2px solid;
        background: rgba(255,255,255,0.1);
        color: white;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
    }
    
    .math-diff-btn.active {
        transform: scale(1.02);
        box-shadow: 0 0 20px currentColor;
    }
    
    .math-toggle {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        color: white;
    }
    
    .math-toggle input {
        display: none;
    }
    
    .math-toggle-slider {
        width: 50px;
        height: 26px;
        background: rgba(255,255,255,0.2);
        border-radius: 26px;
        position: relative;
        transition: 0.3s;
    }
    
    .math-toggle-slider::before {
        content: '';
        position: absolute;
        width: 22px;
        height: 22px;
        background: white;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: 0.3s;
    }
    
    .math-toggle input:checked + .math-toggle-slider {
        background: #FF6B35;
    }
    
    .math-toggle input:checked + .math-toggle-slider::before {
        transform: translateX(24px);
    }
    
    .math-start-btn {
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #FF6B35, #FF4D6D);
        border: none;
        border-radius: 60px;
        color: white;
        font-weight: bold;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 16px;
    }
    
    .math-start-btn:hover {
        transform: scale(1.02);
        box-shadow: 0 0 30px rgba(255,107,53,0.5);
    }
    
    .math-instructions {
        margin-top: 28px;
        padding: 16px;
        background: rgba(255,255,255,0.05);
        border-radius: 16px;
        color: rgba(255,255,255,0.7);
    }
    
    .math-instructions h4 {
        margin: 0 0 8px 0;
        color: #FF6B35;
    }
    
    .math-instructions ul {
        margin: 0;
        padding-left: 20px;
    }
    
    .math-instructions li {
        margin: 5px 0;
        font-size: 13px;
    }
    
    /* Game Active Styles */
    .math-game-active .math-container {
        background: rgba(0,0,0,0.4);
    }
    
    .math-game-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        flex-wrap: wrap;
        gap: 12px;
    }
    
    .math-back-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 8px 16px;
        border-radius: 40px;
        color: white;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .math-stats {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }
    
    .math-stat {
        background: rgba(255,255,255,0.1);
        padding: 6px 12px;
        border-radius: 40px;
        display: flex;
        gap: 6px;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
    }
    
    .math-stat strong {
        color: #FF6B35;
        font-size: 16px;
    }
    
    .math-streak {
        animation: pulse 0.5s ease;
    }
    
    .math-time-warning {
        color: #f44336 !important;
        animation: blink 1s infinite;
    }
    
    .math-question-card {
        background: rgba(0,0,0,0.6);
        border-radius: 32px;
        padding: 48px 24px;
        text-align: center;
        border: 2px solid;
        margin-bottom: 24px;
    }
    
    .math-question {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
        margin-bottom: 32px;
    }
    
    .math-number {
        font-size: 48px;
        font-weight: 800;
        color: white;
        font-family: 'Syne', sans-serif;
    }
    
    .math-operator {
        font-size: 48px;
        font-weight: 800;
    }
    
    .math-equals {
        font-size: 48px;
        color: rgba(255,255,255,0.5);
    }
    
    .math-question-mark {
        font-size: 48px;
        color: #FF6B35;
        animation: bounce 1s infinite;
    }
    
    .math-input-area {
        display: flex;
        gap: 12px;
        justify-content: center;
    }
    
    .math-input {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 14px 20px;
        border-radius: 60px;
        color: white;
        font-size: 18px;
        width: 150px;
        text-align: center;
    }
    
    .math-input:focus {
        outline: none;
        border-color: #FF6B35;
    }
    
    .math-submit-btn {
        background: #FF6B35;
        border: none;
        padding: 14px 24px;
        border-radius: 60px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .math-submit-btn:hover {
        transform: scale(1.05);
    }
    
    .math-feedback {
        text-align: center;
        padding: 12px;
        border-radius: 12px;
        font-weight: bold;
        margin: 16px 0;
        animation: slideIn 0.3s ease;
    }
    
    .math-feedback.correct {
        background: rgba(76,175,80,0.2);
        color: #4CAF50;
        border: 1px solid #4CAF50;
    }
    
    .math-feedback.wrong {
        background: rgba(244,67,54,0.2);
        color: #f44336;
        border: 1px solid #f44336;
    }
    
    .math-progress {
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 24px;
    }
    
    .math-progress-bar {
        height: 100%;
        transition: width 0.3s ease;
    }
    
    .math-badge {
        text-align: center;
        margin-top: 16px;
        padding: 8px;
        background: linear-gradient(135deg, #FFD70020, #FFA50020);
        border-radius: 40px;
        color: #FFD700;
        font-size: 12px;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @media (max-width: 600px) {
        .math-root { padding: 12px; }
        .math-container { padding: 20px 16px; }
        .math-number, .math-operator, .math-equals, .math-question-mark { font-size: 32px; }
        .math-question { gap: 8px; }
        .math-stats { gap: 8px; }
        .math-stat { font-size: 10px; }
        .math-options-grid { grid-template-columns: repeat(2, 1fr); }
    }
`;

export default MathGames;