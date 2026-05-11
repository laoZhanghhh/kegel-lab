/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  Bell,
  BellOff,
  History,
  Timer,
  Calendar,
  Volume2,
  VolumeX,
  Trash2,
  Trophy,
  Heart,
  Smile,
  Zap,
  Star,
  Minus,
  Square,
  X
} from 'lucide-react';
import img6411 from './assets/6411.png';
import img6412 from './assets/6412.png';
import img6413 from './assets/6413.png';


// --- Types ---
interface CheckIn {
  id: string;
  timestamp: number;
  type: 'manual' | 'scheduled';
}

// --- Custom Title Bar Component ---
function TitleBar() {
  const handleMinimize = async () => {
    await invoke('minimize_window');
  };

  const handleMaximize = async () => {
    await invoke('maximize_window');
  };

  const handleClose = async () => {
    await invoke('close_window');
  };

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-8 bg-slate-900 flex items-center justify-between px-2 z-50 select-none"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <div className="w-5 h-5 bg-dopa-pink rounded flex items-center justify-center">
          <Smile size={12} className="text-white" />
        </div>
        <span data-tauri-drag-region className="text-white text-xs font-bold">快乐提肛Lab</span>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleMinimize}
          className="w-11 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastNotifiedRef = useRef<number | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('kegel_checkins');
    if (saved) {
      try {
        setCheckIns(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const savedSound = localStorage.getItem('kegel_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('kegel_checkins', JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    localStorage.setItem('kegel_sound', String(soundEnabled));
  }, [soundEnabled]);

  // Start/stop timer
  useEffect(() => {
    invoke('start_timer');
    return () => {
      invoke('stop_timer');
    };
  }, []);

  // Listen for timer ticks
  useEffect(() => {
    const unlisten = listen('timer_tick', () => {
      const currentTime = new Date();
      setNow(currentTime);
      checkReminder(currentTime);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [notificationsEnabled, soundEnabled]);

  const checkReminder = (date: Date) => {
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // Check if it's 0 or 30 minutes past the hour
    if ((minutes === 0 || minutes === 30) && seconds === 0) {
      const timestamp = Math.floor(date.getTime() / 60000); // Unique per minute
      if (lastNotifiedRef.current !== timestamp) {
        lastNotifiedRef.current = timestamp;
        triggerReminder(date);
      }
    }
  };

  const triggerReminder = (date: Date) => {
    if (notificationsEnabled) {
      sendNotification({
        title: '🌈 嘿！提肛时间到啦！',
        body: `现在是 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}，来一次快乐的练习吧！`,
        icon: '/favicon.ico' // 可选
      });
    }

    if (soundEnabled) {
      playReminderSound();
    }
  };

  const playReminderSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pop sound
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio failed', e);
    }
  };

  const handleCheckIn = () => {
    const minutes = now.getMinutes();
    const isScheduled = (minutes >= 0 && minutes <= 5) || (minutes >= 30 && minutes <= 35);
    
    const newCheckIn: CheckIn = {
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      type: isScheduled ? 'scheduled' : 'manual'
    };

    setCheckIns(prev => [newCheckIn, ...prev].slice(0, 100));
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const clearHistory = () => {
    if (confirm('要把这些可爱的回忆都删掉吗？(o_O)?')) {
      setCheckIns([]);
    }
  };

  const todayCheckIns = checkIns.filter(c => new Date(c.timestamp).toDateString() === now.toDateString()).length;

  return (
    <>
      <TitleBar />
      <div className="min-h-screen mt-10 p-4 md:p-8 flex flex-col max-w-5xl mx-auto selection:bg-dopa-pink selection:text-white">

        {/* Playful Decorative Icons */}
        <div className="fixed top-0 left-0 text-dopa-pink/20 animate-float pointer-events-none -z-10 hidden lg:block opacity-30">
          <img src={img6413} alt="Dopa Icon" className="w-[100vw] object-contain" />
        </div>
        <div className="fixed bottom-20 right-10 text-dopa-yellow/20 animate-float [animation-delay:1.5s] pointer-events-none -z-10 hidden lg:block">
          <Star size={100} />
        </div>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex flex-col items-center md:items-start">
            <motion.div 
              whileHover={{ rotate: [0, 10, -10, 0] }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-14 h-14 bg-dopa-pink dopa-card flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-next-level">
                <Smile size={32} />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                快乐提肛 <span className="text-dopa-pink font-extrabold font-mono italic">Lab</span>
              </h1>
            </motion.div>
            <p className="text-slate-500 font-bold bg-dopa-yellow/30 px-3 py-1 rounded-full text-sm">
              元气满满每一天 · 多巴胺健康伴侣
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 dopa-card border-2">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Status Center</p>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${notificationsEnabled ? 'bg-dopa-green shadow-[0_0_8px_#6BCB77]' : 'bg-slate-300'}`}></span>
                <p className="text-sm font-black text-slate-700">{notificationsEnabled ? '雷达已就绪' : '雷达待命中'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={toggleNotifications}
                className={`p-3 dopa-btn transition-colors ${notificationsEnabled ? 'bg-dopa-blue text-white' : 'bg-white text-slate-400'}`}
              >
                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </button>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 dopa-btn transition-colors ${soundEnabled ? 'bg-dopa-purple text-white' : 'bg-white text-slate-400'}`}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-grow">
          
          {/* Clock Card - Dopamine Blue */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-4 dopa-card bg-dopa-blue/10 p-8 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -top-6 -left-6 opacity-10 text-dopa-blue rotate-12">
              <img src={img6412} alt="Dopa Icon" className="w-[160px] object-contain" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center flex-grow justify-center">
              <div className="text-6xl font-black text-dopa-blue tracking-tighter tabular-nums mb-2 leading-none">
                {now.getHours().toString().padStart(2, '0')}:
                {now.getMinutes().toString().padStart(2, '0')}
              </div>
              <div className="font-mono text-2xl text-dopa-blue/60 font-bold mb-4">
                {now.getSeconds().toString().padStart(2, '0')}
              </div>
              <div className="bg-white border-2 border-slate-900 px-4 py-2 rounded-full font-bold text-slate-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-xs flex items-center gap-2">
                <Calendar size={14} className="text-dopa-pink" />
                {now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' })}
              </div>
            </div>

            <div className="mt-8 bg-white border-4 border-slate-900 rounded-[1.5rem] p-4 text-center">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Coming Up Next</p>
              <div className="flex items-center justify-center gap-2 text-dopa-blue font-black text-xl italic">
                <Timer size={20} />
                {now.getMinutes() < 30 ? `${now.getHours()}:30` : `${(now.getHours() + 1) % 24}:00`}
              </div>
            </div>
          </motion.div>

          {/* Main Action - Multi-color Punch Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-8 dopa-card bg-dopa-yellow p-8 relative overflow-hidden flex flex-col justify-center"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 text-slate-900 rotate-12 pointer-events-none">
              <img src={img6411} alt="Dopa Icon" className="w-[200px] object-contain" />
            </div>

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, -2, 2, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-tight drop-shadow-sm">
                  能量时刻！<br/>
                  <span className="text-white drop-shadow-[4px_4px_0px_rgba(15,23,42,1)]">释放盆底原力</span>
                </h2>
              </motion.div>
              
              <p className="text-slate-800 text-lg mb-8 max-w-sm font-bold opacity-80 leading-relaxed">
                坚持提肛，做个快乐的健康达人！每次 5~10 秒，让身体充满活力 ✨
              </p>

              <motion.button 
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckIn}
                className="bg-dopa-pink text-white font-black py-5 px-12 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all text-2xl flex items-center gap-4 group"
              >
                <Zap size={28} className="group-hover:animate-pulse" />
                打个卡先！
              </motion.button>
            </div>
          </motion.div>

          {/* Stats - Dopamine Pink */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-4 dopa-card bg-dopa-pink/10 p-8 flex flex-col items-center justify-center text-center"
          >
            <p className="text-xs font-black text-dopa-pink uppercase tracking-widest mb-6 border-b-2 border-dopa-pink/20 pb-1">Today's Goal</p>
            
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-white rounded-full border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"></div>
              <svg className="w-36 h-36 -rotate-90 relative z-10">
                <circle cx="72" cy="72" r="64" fill="none" stroke="#FEE2E2" strokeWidth="12" />
                <circle 
                  cx="72" cy="72" r="64" fill="none" 
                  stroke="#FF6B9D" strokeWidth="12" 
                  strokeDasharray="402" 
                  strokeDashoffset={402 - (402 * Math.min(todayCheckIns, 16) / 16)} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center z-10">
                <p className="text-5xl font-black text-slate-900 -tracking-widest">{todayCheckIns}</p>
                <p className="text-[10px] text-dopa-pink font-bold uppercase tracking-tight">/ 16 Times</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-dopa-pink font-black text-sm">
              <Trophy size={18} />
              胜过 99% 的养生仙女/男神
            </div>
          </motion.div>

          {/* History - Dopamine Green */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-4 dopa-card bg-dopa-green/10 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6 border-b-4 border-slate-900 pb-2">
              <p className="text-xs font-black text-dopa-green uppercase tracking-widest flex items-center gap-2">
                <History size={16} /> History Log
              </p>
              <button 
                onClick={clearHistory}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {checkIns.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                  <Heart size={40} className="text-dopa-pink mb-2" />
                  <p className="text-xs font-bold font-mono">Waiting for your 1st move!</p>
                </div>
              ) : (
                checkIns.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg border-2 border-slate-900 flex items-center justify-center ${item.type === 'scheduled' ? 'bg-dopa-green text-white' : 'bg-dopa-yellow text-slate-700'}`}>
                        <Zap size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-700">
                          {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border-2 border-slate-900 ${
                      item.type === 'scheduled' ? 'bg-dopa-green text-white' : 'bg-white text-slate-600'
                    }`}>
                      {item.type === 'scheduled' ? 'Perfect' : 'Boost'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Tip Card - Dopamine Purple */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-4 dopa-card bg-dopa-purple/10 p-8 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-dopa-purple dopa-card flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-next-level">
                <Zap size={24} />
              </div>
              <span className="font-extrabold text-slate-700 text-lg tracking-tight">每日元气 Tip</span>
            </div>

            <div className="flex-grow flex flex-col justify-center">
              <div className="relative mb-8">
                <div className="absolute -top-4 -left-2 text-dopa-purple/20 font-serif text-6xl">"</div>
                <p className="relative z-10 text-slate-700 text-lg font-bold leading-relaxed pl-4 italic">
                  提肛不是任务，而是给身体的一次微型 SPA。坚持 52 天，你会发现全新的自己！
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border-2 border-slate-900 rounded-[1.5rem] text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <p className="text-dopa-orange font-black text-2xl">
                    {new Set(checkIns.map(c => new Date(c.timestamp).toDateString())).size}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Days Logged</p>
                </div>
                <div className="p-4 bg-white border-2 border-slate-900 rounded-[1.5rem] text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <p className="text-dopa-blue font-black text-2xl">{checkIns.length}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Pulses</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer Bar */}
        <footer className="mt-12 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-t-4 border-slate-900/5 pt-10 gap-6">
          <div className="flex gap-8">
            <button className="hover:text-dopa-pink transition-colors">Privacy Policy</button>
            <button className="hover:text-dopa-blue transition-colors">Support Center</button>
            <button className="hover:text-dopa-purple transition-colors">About Lab</button>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-full font-mono italic">
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-dopa-green"
            ></motion.span>
            System Active | Dopa v3.0 Powered
          </div>
        </footer>
      </div>
    </>
  );
}
