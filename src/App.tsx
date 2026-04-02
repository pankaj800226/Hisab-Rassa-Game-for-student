import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- Types & Interfaces ---
interface Question {
  a: number;
  b: number;
  answer: number;
}

interface PlayerCardProps {
  playerNum: 1 | 2;
  question: Question;
  input: string;
  onInput: (val: string) => void;
  color: 'cyan' | 'rose';
}

const MathWar: React.FC = () => {
  const [ropePos, setRopePos] = useState<number>(0); 
  const [p1Question, setP1Question] = useState<Question>(generateQuestion());
  const [p2Question, setP2Question] = useState<Question>(generateQuestion());
  const [p1Input, setP1Input] = useState<string>('');
  const [p2Input, setP2Input] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);

  function generateQuestion(): Question {
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;
    return { a, b, answer: a + b };
  }

  // Optimized Input Logic (No Enter Needed)
  const handlePlayerInput = (player: 1 | 2, char: string) => {
    if (winner) return;

    if (player === 1) {
      if (char === 'C') { setP1Input(''); return; }
      const newValue = p1Input + char;
      if (parseInt(newValue) === p1Question.answer) {
        setRopePos(prev => prev - 15);
        setP1Question(generateQuestion());
        setP1Input('');
      } else if (newValue.length >= 2) {
        setP1Input(''); // Wrong answer auto-clear
      } else {
        setP1Input(newValue);
      }
    } else {
      if (char === 'C') { setP2Input(''); return; }
      const newValue = p2Input + char;
      if (parseInt(newValue) === p2Question.answer) {
        setRopePos(prev => prev + 15);
        setP2Question(generateQuestion());
        setP2Input('');
      } else if (newValue.length >= 2) {
        setP2Input('');
      } else {
        setP2Input(newValue);
      }
    }
  };

  useEffect(() => {
    if (ropePos <= -100) setWinner("PLAYER 1");
    if (ropePos >= 100) setWinner("PLAYER 2");
    if (winner) confetti();
  }, [ropePos, winner]);

  return (
    <div className="h-screen w-full bg-[#050814] flex flex-col items-center justify-center overflow-hidden text-white touch-none select-none p-4">
      
      {/* HUD */}
      <div className="absolute top-6 text-center z-10">
        <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
          ANK DANGAL
        </h1>
        <p className="text-[10px] tracking-[0.3em] text-slate-500 uppercase mt-1">Multi-Touch Combat</p>
      </div>

      <div className="relative w-full max-w-7xl flex items-stretch justify-between gap-4 h-[80vh]">
        
        <PlayerCard 
          playerNum={1} 
          question={p1Question} 
          input={p1Input} 
          onInput={(v) => handlePlayerInput(1, v)}
          color="cyan"
        />

        {/* Rope System */}
        <div className="flex-1 relative flex items-center justify-center overflow-visible">
          <div className="absolute w-full h-1 bg-white/5 rounded-full" />
          <motion.div 
            animate={{ x: ropePos * 3 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full flex items-center justify-center relative"
          >
             <div className="w-full h-2 bg-gradient-to-r from-cyan-500 via-white to-rose-500 rounded-full" />
             <div className="absolute w-10 h-10 bg-white rounded-lg rotate-45 border-4 border-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          </motion.div>
        </div>

        <PlayerCard 
          playerNum={2} 
          question={p2Question} 
          input={p2Input} 
          onInput={(v) => handlePlayerInput(2, v)}
          color="rose"
        />
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className="text-center">
              <h2 className="text-7xl font-black text-yellow-400 mb-8 italic">{winner} WINS!</h2>
              <button onClick={() => window.location.reload()} className="px-12 py-4 bg-white text-black font-bold rounded-full text-xl">REMATCH</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlayerCard: React.FC<PlayerCardProps> = ({ playerNum, question, input, onInput, color }) => {
  const isCyan = color === 'cyan';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0'];

  return (
    <div className={`p-6 rounded-[2.5rem] border backdrop-blur-md flex flex-col w-80 lg:w-[400px] ${isCyan ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
      <div className="text-center mb-6">
        <p className={`text-xs font-bold opacity-50 mb-2 uppercase text-${color}-400`}>Fighter {playerNum}</p>
        <div className="text-5xl font-mono font-bold mb-4">{question.a} + {question.b}</div>
        <div className="h-16 bg-black/40 rounded-2xl flex items-center justify-center text-4xl font-mono text-white border border-white/10">
          {input || <span className="opacity-10">?</span>}
        </div>
      </div>

      {/* Touch Keypad - FIXED for Multi-touch */}
      <div className="flex-1 grid grid-cols-3 gap-2">
        {keys.map(k => (
          <button
            key={k}
            onPointerDown={(e) => { e.preventDefault(); onInput(k); }}
            className={`rounded-2xl text-2xl font-bold transition-all active:scale-90 ${
              k === 'C' ? 'bg-slate-800' : isCyan ? 'bg-cyan-600' : 'bg-rose-600'
            } ${k === '0' ? 'col-span-2' : ''}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MathWar;