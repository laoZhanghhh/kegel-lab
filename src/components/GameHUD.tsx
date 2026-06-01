import React from 'react';
import { GameStats, GameState } from '../types';

interface HUDProps {
  stats: GameStats;
  gameState: GameState;
}

export default function GameHUD({ stats, gameState }: HUDProps) {
  if (gameState !== GameState.PLAYING && gameState !== GameState.STARTING) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-mono">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="text-zinc-500 text-xs uppercase tracking-widest">Time Remaining</div>
          <div className={`text-3xl font-bold ${stats.timeRemaining < 10 ? 'text-red-500 pulsing' : 'text-white'}`}>
            {stats.timeRemaining.toFixed(1)}s
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col items-end gap-1">
            <div className="text-zinc-500 text-xs uppercase tracking-widest">Hits</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.hits}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-zinc-500 text-xs uppercase tracking-widest">Accuracy</div>
            <div className="text-2xl font-bold text-sky-400">
              {stats.totalShots > 0 ? ((stats.hits / stats.totalShots) * 100).toFixed(1) : '100'}%
            </div>
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-8 h-8">
          {/* Vertical */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400/80 -translate-x-1/2 h-2" />
          <div className="absolute left-1/2 bottom-0 w-0.5 bg-emerald-400/80 -translate-x-1/2 h-2" />
          {/* Horizontal */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/80 -translate-y-1/2 w-2" />
          <div className="absolute top-1/2 right-0 h-0.5 bg-emerald-400/80 -translate-y-1/2 w-2" />
          {/* Center Dot */}
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>
      </div>

      {/* Bottom status */}
      <div className="flex flex-col items-center gap-4">
        {gameState === GameState.PLAYING && (
          <div className="text-emerald-400/80 text-xs animate-bounce font-mono">
            CLICK TO LOCK MOUSE & AIM
          </div>
        )}
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/20 text-xs text-emerald-400/60 uppercase tracking-[0.2em]">
          Firing Range Alpha-01
        </div>
      </div>
    </div>
  );
}
