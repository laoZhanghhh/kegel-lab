import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Timer,
  Volume2,
  Play,
  Pause,
  SkipBack,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// Guitar string frequencies (standard tuning, Hz)
const STRING_FREQUENCIES = [
  { name: 'E2', freq: 82.41, color: '#FF6B6B' },
  { name: 'A2', freq: 110.00, color: '#FFE66D' },
  { name: 'D3', freq: 146.83, color: '#4ECDC4' },
  { name: 'G3', freq: 196.00, color: '#45B7D1' },
  { name: 'B3', freq: 246.94, color: '#96CEB4' },
  { name: 'E4', freq: 329.63, color: '#DDA0DD' },
];

// Common BPMs for preset buttons
const BPM_PRESETS = [40, 60, 80, 100, 120, 140, 160, 180, 200, 220];

type TabType = 'tuner' | 'metronome';

function TunerView() {
  const [isListening, setIsListening] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [cents, setCents] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const noteFromFreq = useCallback((freq: number) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const semitones = 12 * Math.log2(freq / A4);
    const noteIndex = Math.round(semitones) + 9; // A is index 9 in C-major scale
    const octave = Math.floor((noteIndex + 3) / 12) + 4;
    const note = noteNames[((noteIndex % 12) + 12) % 12];
    const centsOff = Math.round((semitones - Math.round(semitones)) * 100);
    return { note, octave, cents: centsOff, name: `${note}${octave}` };
  }, []);

  const findClosestString = useCallback((freq: number) => {
    let closest = STRING_FREQUENCIES[0];
    let minDiff = Math.abs(freq - closest.freq);

    for (const string of STRING_FREQUENCIES) {
      const diff = Math.abs(freq - string.freq);
      if (diff < minDiff) {
        minDiff = diff;
        closest = string;
      }
    }
    return closest;
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);

    // Autocorrelation to find fundamental frequency
    const sampleRate = audioContextRef.current?.sampleRate || 44100;

    // Find zero crossings
    let lastZero = 0;
    let periods: number[] = [];

    for (let i = 1; i < bufferLength; i++) {
      if (buffer[i - 1] >= 0 && buffer[i] < 0) {
        const period = (i - lastZero) / sampleRate;
        if (period > 0.002 && period < 0.1) { // Valid guitar period range
          periods.push(period);
        }
        lastZero = i;
      }
    }

    if (periods.length > 0) {
      const avgPeriod = periods.reduce((a, b) => a + b, 0) / periods.length;
      const freq = 1 / avgPeriod;

      if (freq > 60 && freq < 500) {
        setDetectedFreq(freq);
        const noteInfo = noteFromFreq(freq);
        setDetectedNote(noteInfo.name);
        setCents(noteInfo.cents);
      }
    }

    animationRef.current = requestAnimationFrame(analyzeAudio);
  }, [noteFromFreq]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      setIsListening(true);
      analyzeAudio();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setDetectedFreq(null);
    setDetectedNote('');
    setCents(0);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const getCentsDisplay = () => {
    if (cents === 0) return '0';
    return cents > 0 ? `+${cents}` : `${cents}`;
  };

  const getTuningIndicator = () => {
    if (Math.abs(cents) <= 5) return { text: '完美!', color: '#4ECDC4' };
    if (Math.abs(cents) <= 15) return { text: cents > 0 ? '稍高' : '稍低', color: '#FFE66D' };
    return { text: cents > 0 ? '太高' : '太低', color: '#FF6B6B' };
  };

  const indicator = getTuningIndicator();
  const closestString = detectedFreq ? findClosestString(detectedFreq) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 text-center">
        <h2 className="text-lg font-bold">吉他调音器</h2>
        <p className="text-xs text-slate-400">对着吉他麦克风调音</p>
      </div>

      {/* Tuner Display */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-800 to-slate-900">
        {/* Note Display */}
        <motion.div
          key={detectedNote}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="relative mb-8"
        >
          <div
            className="w-40 h-40 rounded-full border-8 flex items-center justify-center"
            style={{
              borderColor: detectedNote ? indicator.color : '#374151',
              backgroundColor: '#1f2937'
            }}
          >
            <span
              className="text-6xl font-black"
              style={{ color: detectedNote ? indicator.color : '#6b7280' }}
            >
              {detectedNote || '--'}
            </span>
          </div>

          {/* Cents Indicator Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="76"
              fill="none"
              stroke={detectedNote ? indicator.color : '#374151'}
              strokeWidth="4"
              strokeDasharray={`${Math.min(Math.abs(cents) * 2, 477)} 477`}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
        </motion.div>

        {/* Frequency Display */}
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-white">
            {detectedFreq ? `${detectedFreq.toFixed(1)} Hz` : '-- Hz'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {detectedNote ? `与 ${closestString?.name}(${closestString?.freq.toFixed(1)}Hz) 比较` : '等待声音...'}
          </p>
        </div>

        {/* Cents & Status */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="px-4 py-2 rounded-full font-bold text-lg"
            style={{ backgroundColor: detectedNote ? indicator.color + '30' : '#374151' }}
          >
            <span style={{ color: detectedNote ? indicator.color : '#6b7280' }}>
              {getCentsDisplay()} cents
            </span>
          </div>
          <div
            className="px-4 py-2 rounded-full font-bold text-lg"
            style={{ backgroundColor: detectedNote ? indicator.color + '30' : '#374151' }}
          >
            <span style={{ color: detectedNote ? indicator.color : '#6b7280' }}>
              {detectedNote ? indicator.text : '等待中'}
            </span>
          </div>
        </div>

        {/* String Reference */}
        <div className="w-full bg-slate-800/50 rounded-2xl p-4">
          <p className="text-xs text-slate-400 text-center mb-3 font-bold">标准调弦参考</p>
          <div className="flex justify-between">
            {STRING_FREQUENCIES.map((string) => (
              <div key={string.name} className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white mb-1"
                  style={{ backgroundColor: string.color }}
                >
                  {string.name[0]}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">{string.freq.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Button */}
      <div className="p-6 bg-slate-900">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-colors ${
            isListening
              ? 'bg-red-500 text-white'
              : 'bg-teal-500 text-white'
          }`}
        >
          {isListening ? (
            <>
              <Pause size={24} /> 停止
            </>
          ) : (
            <>
              <Volume2 size={24} /> 开始调音
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function MetronomeView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const playClick = useCallback((isAccent: boolean) => {
    if (!volume) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = isAccent ? 1000 : 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);

    setTimeout(() => audioContext.close(), 200);
  }, [volume]);

  const startMetronome = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const intervalMs = (60 / bpm) * 1000;
    let beatCount = 0;

    playClick(beatCount === 0);
    setCurrentBeat(0);

    intervalRef.current = window.setInterval(() => {
      beatCount = (beatCount + 1) % beats;
      playClick(beatCount === 0);
      setCurrentBeat(beatCount);
    }, intervalMs);

    setIsPlaying(true);
  }, [bpm, beats, playClick]);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, beats]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.max(20, Math.min(300, prev + delta)));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 text-center">
        <h2 className="text-lg font-bold">节拍器</h2>
        <p className="text-xs text-slate-400">设置节拍速度</p>
      </div>

      {/* Beat Visualization */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-800 to-slate-900">
        {/* Beat Indicators */}
        <div className="flex gap-4 mb-8">
          {Array.from({ length: beats }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: currentBeat === i && isPlaying ? 1.3 : 1,
                backgroundColor: currentBeat === i && isPlaying
                  ? (i === 0 ? '#FF6B6B' : '#4ECDC4')
                  : '#374151'
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center"
            >
              <span className="text-white font-black">{i + 1}</span>
            </motion.div>
          ))}
        </div>

        {/* BPM Display */}
        <div className="text-center mb-8">
          <p className="text-8xl font-black text-white tabular-nums">{bpm}</p>
          <p className="text-slate-400 font-bold">BPM</p>
        </div>

        {/* BPM Controls */}
        <div className="flex items-center gap-6 mb-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustBpm(-5)}
            className="w-14 h-14 rounded-full bg-slate-700 text-white flex items-center justify-center"
          >
            <ChevronDown size={24} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustBpm(-1)}
            className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center"
          >
            -1
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustBpm(1)}
            className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center"
          >
            +1
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustBpm(5)}
            className="w-14 h-14 rounded-full bg-slate-700 text-white flex items-center justify-center"
          >
            <ChevronUp size={24} />
          </motion.button>
        </div>

        {/* Preset Buttons */}
        <div className="w-full mb-8">
          <p className="text-xs text-slate-400 text-center mb-3 font-bold">常用速度</p>
          <div className="grid grid-cols-5 gap-2">
            {BPM_PRESETS.map((preset) => (
              <motion.button
                key={preset}
                whileTap={{ scale: 0.9 }}
                onClick={() => setBpm(preset)}
                className={`py-2 rounded-lg font-bold text-xs transition-colors ${
                  bpm === preset
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {preset}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Signature */}
        <div className="w-full bg-slate-800/50 rounded-2xl p-4">
          <p className="text-xs text-slate-400 text-center mb-3 font-bold">拍号</p>
          <div className="flex justify-center gap-4">
            {[2, 3, 4, 6].map((sig) => (
              <motion.button
                key={sig}
                whileTap={{ scale: 0.9 }}
                onClick={() => setBeats(sig)}
                className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-bold transition-colors ${
                  beats === sig
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <span className="text-2xl">{sig}</span>
                <span className="text-[10px]">拍</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-6 bg-slate-900 flex gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={stopMetronome}
          className="flex-1 py-4 rounded-2xl font-bold text-lg bg-slate-700 text-white flex items-center justify-center gap-2"
        >
          <SkipBack size={24} /> 重置
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? stopMetronome : startMetronome}
          className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${
            isPlaying ? 'bg-red-500 text-white' : 'bg-teal-500 text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause size={24} /> 暂停
            </>
          ) : (
            <>
              <Play size={24} /> 开始
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tuner');

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('tuner')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${
            activeTab === 'tuner'
              ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-700/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Music size={20} />
          调音器
        </button>
        <button
          onClick={() => setActiveTab('metronome')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${
            activeTab === 'metronome'
              ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-700/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Timer size={20} />
          节拍器
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'tuner' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'tuner' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'tuner' ? <TunerView /> : <MetronomeView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}