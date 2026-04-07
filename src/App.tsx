import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";


const Home = React.lazy(() => import('./pages/Home'))
const HisabGame = React.lazy(() => import('./pages/AllGames/RasabGame'))
const AllGames = React.lazy(() => import('./pages/AllGames'))
const PuzzelGame = React.lazy(() => import('./pages/AllGames/PuzzelGame'))
const MemoryGames = React.lazy(() => import('./pages/AllGames/MemoryGames'))
const TicTacToi = React.lazy(() => import('./pages/AllGames/TicTacToi'))
const FlappyBird = React.lazy(() => import('./pages/AllGames/FlappyBird'))
const Sudoku = React.lazy(() => import('./pages/AllGames/Sudoku'))
const NumberGames = React.lazy(() => import('./pages/AllGames/NumberGames'))
const EmojiPong = React.lazy(() => import('./pages/AllGames/EmojiPong'))
const MathGames = React.lazy(() => import('./pages/AllGames/MathGames'))
const DiceGame = React.lazy(() => import('./pages/AllGames/DiceGame'))






const App = () => {
  return (
    <Router>
      <Header />
      <Suspense fallback="Loading...">

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hisabgame" element={<HisabGame />} />
          <Route path="/allgames" element={<AllGames />} />
          <Route path="/puzzelgame" element={<PuzzelGame />} />
          <Route path="/memorygame" element={<MemoryGames />} />
          <Route path="/tictactoi" element={<TicTacToi />} />
          <Route path="/flappybird" element={<FlappyBird />} />
          <Route path="/sudoku" element={<Sudoku />} />
          <Route path="/numbergame" element={<NumberGames />} />
          <Route path="/emojipong" element={<EmojiPong />} />
          <Route path="/mathgame" element={<MathGames />} />
          <Route path="/dicegame" element={<DiceGame />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App