import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, GameStats } from '../types';
import { Target, Trophy, MousePointer2, Zap } from 'lucide-react';

interface MenuProps {
  gameState: GameState;
  stats: GameStats;
  onStart: () => void;
  countdown: number;
}

export default function GameMenu({ gameState, stats, onStart, countdown }: MenuProps) {
  return (
    <AnimatePresence mode="wait">
      {gameState === GameState.MENU && (
        <motion.div
          key="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-50 overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="grid grid-cols-12 h-full w-full gap-4">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-emerald-500/20 aspect-square" />
              ))}
            </div>
          </div>

          <div className="relative text-center max-w-2xl">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-7xl font-black mb-4 tracking-tighter text-white uppercase italic">
                Shot<span className="text-emerald-500">OneHL</span>
              </h1>
              <p className="text-zinc-400 font-mono text-sm mb-12 max-w-md mx-auto leading-relaxed">
                Hone your reactive tracking and flick shots in our 3D neural training environment. High precision required.
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-4 items-center"
            >
              <button
                onClick={onStart}
                className="group relative px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xl transition-all rounded-sm flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-white/20 skew-x-[-20deg]" />
                <Target size={24} />
                开始社保
              </button>
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mt-4">
                <MousePointer2 size={12} />
                CLICK TO LOCK MOUSE
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {gameState === GameState.STARTING && (
        <motion.div
          key="starting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
        >
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="text-[12rem] font-black text-emerald-500 italic"
          >
            {countdown}
          </motion.div>
        </motion.div>
      )}

      {gameState === GameState.FINISHED && (
        <motion.div
          key="finished"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-50"
        >
          <div className="max-w-md w-full bg-zinc-900 border border-emerald-500/30 p-8 rounded-xl shadow-2xl shadow-emerald-500/10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40">
                <Trophy className="text-emerald-400" size={32} />
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-center text-white mb-2 uppercase tracking-tight">Session Complete</h2>
            <p className="text-zinc-500 text-center font-mono text-xs mb-10 border-b border-zinc-800 pb-6">SIMULATION DATA PROCESSED</p>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 text-sm font-mono uppercase">Total Hits</span>
                <span className="text-3xl font-bold text-emerald-400">{stats.hits}</span>
              </div>
              <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 text-sm font-mono uppercase">Total Shots</span>
                <span className="text-xl font-bold text-white">{stats.totalShots}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 text-sm font-mono uppercase">Accuracy</span>
                <span className="text-3xl font-bold text-sky-400">
                  {stats.totalShots > 0 ? ((stats.hits / stats.totalShots) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full mt-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all rounded-lg uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Zap size={20} fill="currentColor" />
              Recalibrate
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
