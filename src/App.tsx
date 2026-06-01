/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import Arena from './components/Arena';
import GameHUD from './components/GameHUD';
import GameMenu from './components/GameMenu';
import { GameState, GameStats } from './types';

const INITIAL_STATS: GameStats = {
  hits: 0,
  misses: 0,
  totalShots: 0,
  accuracy: 100,
  timeRemaining: 30,
  startTime: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [countdown, setCountdown] = useState(3);

  const startGame = useCallback(() => {
    setStats({ ...INITIAL_STATS });
    setGameState(GameState.STARTING);
    setCountdown(3);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameState === GameState.STARTING) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState(GameState.PLAYING);
      }
    }
  }, [gameState, countdown]);

  // Game timer
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const timer = setInterval(() => {
        setStats((prev) => {
          if (prev.timeRemaining <= 0) {
            clearInterval(timer);
            setGameState(GameState.FINISHED);
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 0.1 };
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const handleHit = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      hits: prev.hits + 1,
      totalShots: prev.totalShots + 1,
    }));
  }, []);

  const handleMiss = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      misses: prev.misses + 1,
      totalShots: prev.totalShots + 1,
    }));
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Scene */}
      <Arena 
        gameState={gameState} 
        onHit={handleHit} 
        onMiss={handleMiss} 
      />

      {/* Overlay UI */}
      <GameHUD stats={stats} gameState={gameState} />
      <GameMenu 
        gameState={gameState} 
        stats={stats} 
        onStart={startGame} 
        countdown={countdown} 
      />

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-emerald-500/30 pointer-events-none" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-emerald-500/30 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-500/30 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-emerald-500/30 pointer-events-none" />
    </div>
  );
}

