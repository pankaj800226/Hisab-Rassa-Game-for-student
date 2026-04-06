import { useEffect, useState, useRef, useCallback, type JSX } from "react";

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  gravity: number;
  jumpPower: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeInterval: number;
  label: string;
  color: string;
  icon: string;
  description: string;
}

const FlappyBird = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("flappy-highscore");
    return saved ? parseInt(saved) : 0;
  });
  const [soundOn, setSoundOn] = useState(true);
  const [showTutorial, setShowTutorial] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showSettings, setShowSettings] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 400, height: 600 });
  
  // Difficulty configurations
  const difficultyConfigs: Record<Difficulty, DifficultyConfig> = {
    easy: {
      gravity: 0.08,
      jumpPower: -3.8,
      pipeSpeed: 1.5,
      pipeGap: 180,
      pipeInterval: 220,
      label: "Easy",
      color: "#39FF14",
      icon: "🌱",
      description: "Slower speed, bigger gaps"
    },
    medium: {
      gravity: 0.15,
      jumpPower: -4.2,
      pipeSpeed: 2,
      pipeGap: 140,
      pipeInterval: 180,
      label: "Medium",
      color: "#FFD700",
      icon: "⚡",
      description: "Balanced challenge"
    },
    hard: {
      gravity: 0.22,
      jumpPower: -4.8,
      pipeSpeed: 2.8,
      pipeGap: 110,
      pipeInterval: 140,
      label: "Hard",
      color: "#FF4444",
      icon: "🔥",
      description: "Fast speed, tiny gaps!"
    }
  };
  
  const currentDifficulty = difficultyConfigs[difficulty];
  
  // Game physics
  const birdRef = useRef({
    y: 300,
    velocity: 0,
    rotation: 0
  });
  
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | undefined>(undefined);
  const particleIdRef = useRef(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  
  const birdSize = 28;
  
  // Calculate canvas size to fit screen without scroll
  useEffect(() => {
    const updateSize = () => {
      // Get viewport dimensions
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Calculate max possible size that fits without scroll
      const maxWidth = Math.min(vw - 32, 500); // 32px for padding
      const maxHeight = vh - 120; // Leave space for header and controls
      
      // Maintain aspect ratio (3:4 for 400x600)
      let width = maxWidth;
      let height = width * 1.5; // 600/400 = 1.5
      
      // If height exceeds viewport, scale down
      if (height > maxHeight) {
        height = maxHeight;
        width = height / 1.5;
      }
      
      setWindowSize({ width: Math.floor(width), height: Math.floor(height) });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);
  
  // Load high score for difficulty
  useEffect(() => {
    const savedHighScore = localStorage.getItem(`flappy-highscore-${difficulty}`);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    } else {
      setHighScore(0);
    }
  }, [difficulty]);
  
  // Sound effects
  const playSound = useCallback((type: "jump" | "score" | "hit" | "wing" | "combo") => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      switch(type) {
        case "jump":
          osc.frequency.value = 523.25;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
          break;
        case "score":
          osc.frequency.value = 880;
          osc.type = "triangle";
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
          setTimeout(() => {
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.connect(g2);
            g2.connect(ctx.destination);
            o2.frequency.value = 1046.5;
            o2.type = "triangle";
            g2.gain.setValueAtTime(0.1, ctx.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            o2.start();
            o2.stop(ctx.currentTime + 0.15);
          }, 80);
          break;
        case "hit":
          osc.frequency.value = 220;
          osc.type = "sawtooth";
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
          break;
        case "wing":
          osc.frequency.value = 659.25;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
          break;
        case "combo":
          osc.frequency.value = 1318.52;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
          break;
      }
    } catch(e) {}
  }, [soundOn]);
  
  // Add particle effect
  const addParticles = useCallback((x: number, y: number, color: string = "#FFD700") => {
    const scaleX = windowSize.width / 400;
    const scaleY = windowSize.height / 600;
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        id: particleIdRef.current++,
        x: x * scaleX,
        y: y * scaleY,
        vx: (Math.random() - 0.5) * 6 * scaleX,
        vy: (Math.random() - 0.5) * 6 * scaleY - 3 * scaleY,
        life: 1,
        color
      });
    }
  }, [windowSize]);
  
  // Initialize pipes
  const initPipes = useCallback(() => {
    const newPipes: Pipe[] = [];
    const canvasW = windowSize.width;
    const scaledInterval = currentDifficulty.pipeInterval * (canvasW / 400);
    const scaledGap = currentDifficulty.pipeGap * (windowSize.height / 600);
    
    for (let i = 0; i < 3; i++) {
      newPipes.push({
        x: canvasW + i * scaledInterval,
        topHeight: Math.random() * (windowSize.height - scaledGap - 100) + 50,
        bottomHeight: 0,
        passed: false
      });
    }
    pipesRef.current = newPipes;
  }, [windowSize.width, windowSize.height, currentDifficulty]);
  
  // Reset game
  const resetGame = useCallback(() => {
    birdRef.current = {
      y: windowSize.height / 2,
      velocity: 0,
      rotation: 0
    };
    initPipes();
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setGameStarted(true);
    setShowTutorial(false);
    particlesRef.current = [];
    playSound("wing");
  }, [windowSize.height, initPipes, playSound]);
  
  // Jump
  const jump = useCallback(() => {
    if (!gameStarted || gameOver) {
      if (!gameStarted && !gameOver) {
        resetGame();
      }
      return;
    }
    
    birdRef.current.velocity = currentDifficulty.jumpPower;
    birdRef.current.rotation = -25;
    playSound("jump");
    addParticles(70, birdRef.current.y, currentDifficulty.color);
    
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  }, [gameStarted, gameOver, resetGame, playSound, addParticles, currentDifficulty]);
  
  // Collision detection
  const checkCollision = useCallback((birdY: number, pipes: Pipe[]): boolean => {
    const scaledBirdSize = birdSize * (windowSize.width / 400);
    const scaledCanvasHeight = windowSize.height;
    const scaledPipeWidth = 60 * (windowSize.width / 400);
    const scaledGap = currentDifficulty.pipeGap * (windowSize.height / 600);
    
    if (birdY - scaledBirdSize/2 <= 0 || birdY + scaledBirdSize/2 >= scaledCanvasHeight) {
      return true;
    }
    
    for (const pipe of pipes) {
      const scaledPipeX = pipe.x;
      const scaledPipeTopHeight = pipe.topHeight;
      
      if (scaledPipeX + scaledPipeWidth > 50 * (windowSize.width / 400) && 
          scaledPipeX < 50 * (windowSize.width / 400) + scaledBirdSize) {
        if (birdY - scaledBirdSize/2 < scaledPipeTopHeight || 
            birdY + scaledBirdSize/2 > scaledPipeTopHeight + scaledGap) {
          return true;
        }
      }
    }
    
    return false;
  }, [windowSize.width, windowSize.height, currentDifficulty.pipeGap]);
  
  // Update game logic
  const updateGame = useCallback(() => {
    if (!gameStarted || gameOver) return;
    
    const scaleX = windowSize.width / 400;
    const scaleY = windowSize.height / 600;
    const scaledPipeSpeed = currentDifficulty.pipeSpeed * scaleX;
    const scaledPipeInterval = currentDifficulty.pipeInterval * scaleX;
    const scaledPipeWidth = 60 * scaleX;
    
    // Update bird
    birdRef.current.velocity += currentDifficulty.gravity;
    birdRef.current.y += birdRef.current.velocity * scaleY;
    birdRef.current.rotation = Math.min(30, birdRef.current.rotation + 2);
    
    // Update pipes
    pipesRef.current = pipesRef.current.map(pipe => ({
      ...pipe,
      x: pipe.x - scaledPipeSpeed
    })).filter(pipe => pipe.x + scaledPipeWidth > 0);
    
    // Add new pipes
    const lastPipe = pipesRef.current[pipesRef.current.length - 1];
    if (lastPipe && lastPipe.x <= windowSize.width - scaledPipeInterval) {
      const scaledGap = currentDifficulty.pipeGap * scaleY;
      pipesRef.current.push({
        x: windowSize.width,
        topHeight: Math.random() * (windowSize.height - scaledGap - 100) + 50,
        bottomHeight: 0,
        passed: false
      });
    }
    
    // Score update with combo
    pipesRef.current = pipesRef.current.map(pipe => {
      if (!pipe.passed && pipe.x + scaledPipeWidth < 50 * scaleX) {
        setScore(prev => {
          const newScore = prev + 1;
          const newCombo = combo + 1;
          setCombo(newCombo);
          
          if (newCombo > bestCombo) {
            setBestCombo(newCombo);
          }
          
          const finalScore = newScore + Math.floor(newCombo / 5);
          
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem(`flappy-highscore-${difficulty}`, finalScore.toString());
            
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate([100, 50, 100]);
            }
          }
          
          if (newCombo > 0 && newCombo % 5 === 0) {
            playSound("combo");
            addParticles(70, birdRef.current.y, "#FF4444");
          }
          
          return finalScore;
        });
        playSound("score");
        addParticles(70 * scaleX, birdRef.current.y, currentDifficulty.color);
        return { ...pipe, passed: true };
      }
      return pipe;
    });
    
    // Update particles
    particlesRef.current = particlesRef.current
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1,
        life: p.life - 0.02
      }))
      .filter(p => p.life > 0);
    
    // Collision check
    if (checkCollision(birdRef.current.y, pipesRef.current)) {
      setGameOver(true);
      setGameStarted(false);
      playSound("hit");
      addParticles(50 * scaleX, birdRef.current.y, "#FF0000");
      setCombo(0);
      
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
    }
  }, [gameStarted, gameOver, windowSize.width, windowSize.height, currentDifficulty, playSound, checkCollision, addParticles, highScore, combo, bestCombo, difficulty]);
  
  // Drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    
    const width = windowSize.width;
    const height = windowSize.height;
    const scaleX = width / 400;
    const scaleY = height / 600;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw difficulty aura
    ctx.fillStyle = `${currentDifficulty.color}10`;
    ctx.fillRect(0, 0, width, height);
    
    // Draw clouds
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.arc(80 * scaleX, 100 * scaleY, 40 * scaleX, 0, Math.PI * 2);
    ctx.arc(120 * scaleX, 80 * scaleY, 35 * scaleX, 0, Math.PI * 2);
    ctx.arc(40 * scaleX, 80 * scaleY, 35 * scaleX, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(320 * scaleX, 150 * scaleY, 35 * scaleX, 0, Math.PI * 2);
    ctx.arc(360 * scaleX, 130 * scaleY, 30 * scaleX, 0, Math.PI * 2);
    ctx.arc(280 * scaleX, 130 * scaleY, 30 * scaleX, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pipes
    pipesRef.current.forEach(pipe => {
      const pipeW = 60 * scaleX;
      const pipeX = pipe.x;
      const topPipeH = pipe.topHeight;
      const bottomPipeY = pipe.topHeight + currentDifficulty.pipeGap * scaleY;
      
      ctx.fillStyle = currentDifficulty.color;
      ctx.shadowBlur = 10 * scaleX;
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.fillRect(pipeX, 0, pipeW, topPipeH);
      ctx.fillStyle = currentDifficulty.color + "aa";
      ctx.fillRect(pipeX - 10 * scaleX, topPipeH - 40 * scaleY, pipeW + 20 * scaleX, 40 * scaleY);
      
      ctx.fillStyle = currentDifficulty.color;
      ctx.fillRect(pipeX, bottomPipeY, pipeW, height - bottomPipeY);
      ctx.fillStyle = currentDifficulty.color + "aa";
      ctx.fillRect(pipeX - 10 * scaleX, bottomPipeY, pipeW + 20 * scaleX, 40 * scaleY);
      
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(pipeX + 5 * scaleX, 0, 5 * scaleX, topPipeH);
      ctx.fillRect(pipeX + 5 * scaleX, bottomPipeY, 5 * scaleX, height - bottomPipeY);
    });
    ctx.shadowBlur = 0;
    
    // Draw ground
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, height - 60 * scaleY, width, 60 * scaleY);
    ctx.fillStyle = "#654321";
    ctx.fillRect(0, height - 60 * scaleY, width, 10 * scaleY);
    
    ctx.fillStyle = currentDifficulty.color;
    for (let i = 0; i < width; i += 10 * scaleX) {
      ctx.beginPath();
      ctx.moveTo(i, height - 60 * scaleY);
      ctx.lineTo(i + 5 * scaleX, height - 70 * scaleY);
      ctx.lineTo(i + 10 * scaleX, height - 60 * scaleY);
      ctx.fill();
    }
    
    // Draw bird
    const birdY = birdRef.current.y;
    const birdRotation = (birdRef.current.rotation * Math.PI) / 180;
    const birdW = birdSize * scaleX;
    const birdH = birdSize * scaleY;
    
    ctx.save();
    ctx.translate(70 * scaleX, birdY);
    ctx.rotate(birdRotation);
    
    ctx.fillStyle = "#f1c40f";
    ctx.shadowBlur = 5 * scaleX;
    ctx.beginPath();
    ctx.ellipse(0, 0, birdW/2, birdH/2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.ellipse(-birdW/3, -birdH/6, birdW/2.5, birdH/4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(birdW/4, -birdH/6, birdW/8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(birdW/4 + 2 * scaleX, -birdH/6 - 1 * scaleY, birdW/12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(birdW/2, -birdH/12);
    ctx.lineTo(birdW/2 + 8 * scaleX, 0);
    ctx.lineTo(birdW/2, birdH/12);
    ctx.fill();
    
    ctx.fillStyle = "rgba(255,100,100,0.5)";
    ctx.beginPath();
    ctx.arc(birdW/3, birdH/12, birdW/10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Draw particles
    particlesRef.current.forEach(particle => {
      ctx.globalAlpha = particle.life * 0.8;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3 * scaleX, 3 * scaleY);
      ctx.globalAlpha = 1.0;
    });
    
    ctx.shadowBlur = 0;
    
    // Draw score
    const fontSize = Math.min(48, width / 8);
    ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
    ctx.fillStyle = "white";
    ctx.shadowBlur = 4;
    ctx.textAlign = "center";
    ctx.fillText(score.toString(), width / 2, 80 * scaleY);
    
    // Draw combo
    if (combo >= 3) {
      ctx.font = `bold ${fontSize * 0.5}px 'Inter', sans-serif`;
      ctx.fillStyle = currentDifficulty.color;
      ctx.fillText(`COMBO x${combo}!`, width / 2, 130 * scaleY);
    }
    
    // Draw difficulty badge
    ctx.font = `bold ${fontSize * 0.35}px 'Inter', sans-serif`;
    ctx.fillStyle = currentDifficulty.color;
    ctx.fillText(`${currentDifficulty.icon} ${currentDifficulty.label}`, width - 60 * scaleX, 40 * scaleY);
    
    // Draw high score
    ctx.font = `bold ${fontSize * 0.35}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFD93D";
    ctx.fillText(`🏆 ${highScore}`, width - 60 * scaleX, 70 * scaleY);
    
    // Tutorial
    if (showTutorial && !gameStarted && !gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `bold ${fontSize * 0.6}px 'Inter', sans-serif`;
      ctx.fillStyle = "white";
      ctx.fillText("Tap / Space to Start", width / 2, height / 2 - 50);
      ctx.font = `${fontSize * 0.35}px 'Inter', sans-serif`;
      ctx.fillStyle = currentDifficulty.color;
      ctx.fillText(currentDifficulty.description, width / 2, height / 2);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Tap or Click to Jump", width / 2, height / 2 + 40 * scaleY);
    }
    
    // Game over screen
    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `bold ${fontSize * 0.8}px 'Inter', sans-serif`;
      ctx.fillStyle = "#e74c3c";
      ctx.fillText("GAME OVER", width / 2, height / 2 - 80);
      ctx.font = `bold ${fontSize * 0.6}px 'Inter', sans-serif`;
      ctx.fillStyle = "white";
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 - 20);
      if (bestCombo > 0) {
        ctx.font = `${fontSize * 0.4}px 'Inter', sans-serif`;
        ctx.fillStyle = currentDifficulty.color;
        ctx.fillText(`Best Combo: x${bestCombo}`, width / 2, height / 2 + 20);
      }
      ctx.font = `${fontSize * 0.35}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFD93D";
      ctx.fillText("Tap / Space to Restart", width / 2, height / 2 + 80);
    }
  }, [windowSize, birdRef, score, highScore, gameOver, gameStarted, showTutorial, currentDifficulty, combo, bestCombo]);
  
  // Game loop
  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);
  
  useEffect(() => {
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gameLoop]);
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [jump]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };
    
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => canvas.removeEventListener("touchstart", handleTouchStart);
  }, [jump]);
  
  useEffect(() => {
    const resumeAudio = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      } catch(e) {}
    };
    
    window.addEventListener('touchstart', resumeAudio, { once: true });
    return () => window.removeEventListener('touchstart', resumeAudio);
  }, []);
  
  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setShowSettings(false);
    setGameStarted(false);
    setGameOver(false);
    setShowTutorial(true);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    birdRef.current = {
      y: windowSize.height / 2,
      velocity: 0,
      rotation: 0
    };
    initPipes();
  };
  
  return (
    <>
      <style>{css}</style>
      <div className="flappy-root">
        <div className="flappy-container">
          <div className="flappy-header">
            <div className="flappy-logo">
              <span>🐦</span>
              <span className="flappy-logo-text">Flappy Bird</span>
            </div>
            <div className="flappy-controls">
              <button 
                className="flappy-sound-btn"
                onClick={() => setSoundOn(!soundOn)}
                title={soundOn ? "Sound On" : "Sound Off"}
              >
                {soundOn ? "🔊" : "🔇"}
              </button>
              <button 
                className="flappy-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                ⚙️
              </button>
              <button 
                className="flappy-reset-btn"
                onClick={resetGame}
              >
                ↺ Restart
              </button>
            </div>
          </div>
          
          {showSettings && (
            <div className="flappy-settings-panel">
              <h3 className="flappy-settings-title">Select Difficulty</h3>
              <div className="flappy-difficulty-buttons">
                {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
                  const config = difficultyConfigs[diff];
                  return (
                    <button
                      key={diff}
                      className={`flappy-difficulty-btn ${difficulty === diff ? "active" : ""}`}
                      style={{
                        borderColor: difficulty === diff ? config.color : "rgba(255,255,255,0.1)",
                        background: difficulty === diff ? `${config.color}20` : "rgba(255,255,255,0.05)"
                      }}
                      onClick={() => changeDifficulty(diff)}
                    >
                      <span className="flappy-difficulty-icon">{config.icon}</span>
                      <span className="flappy-difficulty-label" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="flappy-difficulty-desc">{config.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width={windowSize.width}
            height={windowSize.height}
            className="flappy-canvas"
            onClick={jump}
            style={{
              width: `${windowSize.width}px`,
              height: `${windowSize.height}px`,
              touchAction: 'none',
              boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 0 2px ${currentDifficulty.color}40`
            }}
          />
          
          <div className="flappy-instructions">
            <span>🖱️ Tap/Click to Jump</span>
            <span>🎯 {currentDifficulty.label} Mode</span>
            <span>🏆 Best: {highScore}</span>
          </div>
          
          {gameStarted && !gameOver && combo >= 3 && (
            <div className="flappy-combo-popup" style={{ borderColor: currentDifficulty.color }}>
              🔥 COMBO x{combo}!
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-touch-callout: none;
  }

  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: fixed;
  }

  .flappy-root {
    font-family: 'Inter', sans-serif;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .flappy-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .flappy-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8px;
    flex-shrink: 0;
  }

  .flappy-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: clamp(18px, 5vw, 24px);
    font-weight: 900;
    background: linear-gradient(135deg, #f1c40f, #e67e22);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .flappy-logo-text {
    font-size: clamp(14px, 4vw, 20px);
    letter-spacing: -0.5px;
  }

  .flappy-controls {
    display: flex;
    gap: 8px;
  }

  .flappy-sound-btn, .flappy-settings-btn, .flappy-reset-btn {
    padding: 6px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: clamp(11px, 3vw, 13px);
    min-height: 36px;
    min-width: 36px;
    touch-action: manipulation;
    flex-shrink: 0;
  }

  .flappy-sound-btn:active, .flappy-settings-btn:active, .flappy-reset-btn:active {
    transform: scale(0.95);
  }

  .flappy-settings-panel {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 16px;
    width: 100%;
    max-width: 300px;
    animation: slideDown 0.3s ease;
    position: absolute;
    z-index: 10;
    left: 50%;
    transform: translateX(-50%);
    top: 50%;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(-50%);
    }
  }

  .flappy-settings-title {
    color: white;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 12px;
    text-align: center;
  }

  .flappy-difficulty-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .flappy-difficulty-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    touch-action: manipulation;
  }

  .flappy-difficulty-btn.active {
    transform: scale(1.01);
  }

  .flappy-difficulty-icon {
    font-size: 24px;
  }

  .flappy-difficulty-label {
    font-size: 16px;
    font-weight: 700;
    flex: 1;
    text-align: left;
  }

  .flappy-difficulty-desc {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
  }

  .flappy-canvas {
    border-radius: 16px;
    cursor: pointer;
    transition: transform 0.2s ease;
    background: #000;
    touch-action: none;
    flex-shrink: 0;
    display: block;
  }

  .flappy-canvas:active {
    transform: scale(0.98);
  }

  .flappy-instructions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 40px;
    backdrop-filter: blur(10px);
    font-size: clamp(9px, 3vw, 11px);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    flex-shrink: 0;
  }

  .flappy-instructions span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .flappy-combo-popup {
    position: fixed;
    bottom: 30%;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    border-radius: 40px;
    border: 2px solid;
    font-weight: 800;
    font-size: 14px;
    animation: comboFloat 0.5s ease-out forwards;
    pointer-events: none;
    z-index: 100;
    white-space: nowrap;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
  }

  @keyframes comboFloat {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    20% {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    80% {
      opacity: 1;
      transform: translateX(-50%) translateY(-20px);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(-40px);
    }
  }

  /* Landscape mode optimization */
  @media (orientation: landscape) {
    .flappy-container {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px;
    }

    .flappy-header {
      width: auto;
      flex-direction: column;
      gap: 8px;
    }

    .flappy-instructions {
      flex-direction: column;
    }
  }
`;

export default FlappyBird;