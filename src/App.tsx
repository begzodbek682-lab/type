/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Keyboard, 
  Settings, 
  Clock, 
  Type, 
  Zap, 
  RotateCcw, 
  Crown, 
  X, 
  Volume2, 
  Palette, 
  Brain, 
  Eye, 
  MousePointer2,
  Trophy,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Dictionaries ---
const DICTIONARIES = {
  en: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"],
  uz: ["salom", "dunyo", "dasturlash", "bilim", "vaqt", "hayot", "kitob", "maktab", "dastur", "koinot", "yulduz", "quyosh", "oy", "osmon", "er", "suv", "havo", "olov", "inson", "fikr", "aql", "yurak", "tuyg'u", "sevgi", "do'st", "oila", "ona", "ota", "bola", "yosh", "qari", "katta", "kichik", "yaxshi", "yomon", "to'g'ri", "xato", "tez", "sekin", "uzoq", "yaqin", "yangi", "eski", "go'zal", "xunuk", "boy", "kambag'al", "kuchli", "zaif", "aqlli", "nodon", "baxt", "qayg'u", "shodlik", "loyihalar", "texnologiya", "tizim"],
  code_js: ["function", "const", "let", "var", "return", "if", "else", "for", "while", "class", "extends", "import", "export", "default", "console.log()", "document.getElementById()", "addEventListener()", "Array", "Object", "String", "Number", "Boolean", "null", "undefined", "NaN", "true", "false", "=>", "===", "!==", "await", "async", "Promise", "then", "catch", "try", "finally", "map()", "filter()", "reduce()", "forEach()"],
  code_html: ["<html>", "<head>", "<body>", "<div>", "<span>", "<p>", "<a>", "<img>", "<ul>", "<li>", "<h1>", "<h2>", "<style>", "<script>", "<link>", "<meta>", "<form>", "<input>", "<button>", "class=", "id=", "href=", "src=", "display:", "flex", "grid", "margin:", "padding:", "color:", "background-color:", "width:", "height:", "border-radius:", "position:", "absolute", "relative", "align-items:", "justify-content:"],
  emoji: ["😀", "🚀", "💻", "🔥", "❤️", "👍", "🤔", "🙌", "😎", "🌟", "🎉", "✨", "🍕", "🌍", "🌙", "🎵", "🎸", "🎮", "⚽", "🏀", "🚗", "✈️", "💡", "🧠", "👀", "💪", "🏆", "🎯", "🧩", "🎨"]
};

const PUNCTUATION = [",", ".", "?", "!", ";", ":", '"', "'", "(", ")", "-", "_"];

const KB_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ['space']
];

export default function App() {
  // --- Config State ---
  const [config, setConfig] = useState({
    mode: 'time',
    timeValue: 30,
    wordValue: 25,
    punctuation: false,
    numbers: false,
    lang: 'en',
    sound: 'off',
    volume: 0.5,
    caret: 'line',
    smooth: 'on',
    size: 'medium',
    width: 'wide',
    blind: 'off',
    diff: 'normal',
    strictSpace: 'off',
    fade: 'off',
    theme: 'carbon',
    font: 'fira',
    weight: 'normal',
    caretAnim: 'blink',
    highlight: 'off',
    focusMode: 'off',
    keymap: 'off',
    particles: 'off',
    rgb: 'off',
    shake: 'off',
    fun: 'none'
  });

  // --- Game State ---
  const [game, setGame] = useState({
    words: [] as string[],
    currentWordIdx: 0,
    currentCharIdx: 0,
    combo: 0,
    maxCombo: 0,
    startTime: null as number | null,
    status: 'idle' as 'idle' | 'playing' | 'finished',
    timeLeft: 30,
    typedWords: [] as { charIdx: number; letters: { char: string; state: 'correct' | 'incorrect' | 'extra' | 'none' }[] }[]
  });

  const [stats, setStats] = useState({
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    backspaces: 0,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    history: { wpm: [] as number[], raw: [] as number[], err: [] as number[] },
    errorKeys: {} as Record<string, number>
  });

  const [rpg, setRpg] = useState({ xp: 0, level: 1 });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('tab-behavior');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isCapsLocked, setIsCapsLocked] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showFail, setShowFail] = useState(false);
  const [showTimeAdded, setShowTimeAdded] = useState(false);

  // --- Refs ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chartRef = useRef<NodeJS.Timeout | null>(null);
  const wordsWrapperRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef(stats);
  const gameRef = useRef(game);

  // --- Effects for Caret & Scrolling ---
  const updateCaret = useCallback(() => {
    if (!caretRef.current || !wordsWrapperRef.current) return;
    
    const activeWord = wordsWrapperRef.current.querySelector('.active-word');
    if (!activeWord) return;

    const letters = activeWord.querySelectorAll('.letter');
    let targetEl: HTMLElement | null = null;

    if (game.currentCharIdx < letters.length) {
      targetEl = letters[game.currentCharIdx] as HTMLElement;
    } else {
      targetEl = letters[letters.length - 1] as HTMLElement;
    }

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const containerRect = wordsWrapperRef.current.getBoundingClientRect();
      
      let x = rect.left - containerRect.left;
      let y = rect.top - containerRect.top;

      if (game.currentCharIdx >= letters.length) {
        x += rect.width;
      }

      caretRef.current.style.transform = `translate(${x}px, ${y}px)`;

      // Scrolling logic
      const fontSizePx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-size')) * 16 || 28;
      if (y > fontSizePx * 1.6) {
        const offset = y - (fontSizePx * 1.6);
        wordsWrapperRef.current.style.transform = `translateY(-${offset}px)`;
      } else {
        wordsWrapperRef.current.style.transform = `translateY(0px)`;
      }
    }
  }, [game.currentCharIdx, game.currentWordIdx]);

  useEffect(() => {
    updateCaret();
  }, [updateCaret]);

  // --- Particle Engine ---
  const spawnParticles = useCallback((x: number, y: number) => {
    if (config.particles === 'off' || !wordsWrapperRef.current) return;
    const count = config.particles === 'heavy' ? 8 : 4;
    const container = wordsWrapperRef.current;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--dx', `${Math.random() * 80 - 40}px`);
      p.style.setProperty('--dy', `${Math.random() * 80 - 40}px`);
      if (config.rgb === 'on') {
        p.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
      }
      container.appendChild(p);
      setTimeout(() => p.remove(), 500);
    }
  }, [config.particles, config.rgb]);

  // --- Screen Shake ---
  const triggerShake = useCallback((type: 'error' | 'combo') => {
    if (config.shake === 'off') return;
    if (type === 'error' && config.shake === 'error') {
      document.body.classList.add('shake-active');
      setTimeout(() => document.body.classList.remove('shake-active'), 200);
    } else if (type === 'combo' && config.shake === 'combo' && gameRef.current.combo > 0 && gameRef.current.combo % 10 === 0) {
      document.body.classList.add('shake-active');
      setTimeout(() => document.body.classList.remove('shake-active'), 200);
    }
  }, [config.shake]);

  // Sync refs with state for use in intervals
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { gameRef.current = game; }, [game]);

  // --- Audio Engine ---
  const playSound = useCallback((type: string, keyChar: string = '') => {
    if (config.sound === 'off') return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vol = config.volume;

    let panValue = 0;
    if (keyChar) {
      const leftKeys = 'qazwsxedcrfvtgb12345!@#$%';
      const rightKeys = 'yhnujmikolp09876^&*()_+{}|:<>?';
      if (leftKeys.includes(keyChar.toLowerCase())) panValue = -0.6;
      else if (rightKeys.includes(keyChar.toLowerCase())) panValue = 0.6;
    }

    const panNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panNode) {
      panNode.pan.value = panValue;
      osc.connect(gain).connect(panNode).connect(ctx.destination);
    } else {
      osc.connect(gain).connect(ctx.destination);
    }

    const pitchShift = keyChar ? ((keyChar.charCodeAt(0) % 20) * 15) : 0;

    switch (type) {
      case 'mech':
        osc.type = 'square';
        osc.frequency.setValueAtTime(100 + pitchShift, ctx.currentTime);
        gain.gain.setValueAtTime(vol * 0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
        break;
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + pitchShift, ctx.currentTime);
        gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start(); osc.stop(ctx.currentTime + 0.03);
        break;
      case 'water':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + pitchShift, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
        break;
      case '8bit':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440 + pitchShift, ctx.currentTime);
        osc.frequency.setValueAtTime(880 + pitchShift, ctx.currentTime + 0.02);
        gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
        break;
      case 'typewriter':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + (pitchShift / 2), ctx.currentTime);
        gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(); osc.stop(ctx.currentTime + 0.06);
        break;
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
        break;
    }
  }, [config.sound, config.volume]);

  // --- Game Logic ---
  const generateWords = useCallback(() => {
    const bank = DICTIONARIES[config.lang as keyof typeof DICTIONARIES] || DICTIONARIES.en;
    const count = config.mode === 'words' ? config.wordValue : 100;
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      let w = bank[Math.floor(Math.random() * bank.length)];
      if (config.punctuation && Math.random() > 0.6 && !config.lang.includes('code') && config.lang !== 'emoji') w = w.charAt(0).toUpperCase() + w.slice(1);
      if (config.punctuation && Math.random() > 0.7 && !config.lang.includes('code') && config.lang !== 'emoji') w += PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
      if (config.numbers && Math.random() > 0.8 && config.lang !== 'emoji') w = Math.floor(Math.random() * 100) + w;
      result.push(w);
    }
    return result;
  }, [config.lang, config.mode, config.wordValue, config.punctuation, config.numbers]);

  const initGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (chartRef.current) clearInterval(chartRef.current);

    const words = generateWords();
    const typedWords = words.map(w => ({
      charIdx: 0,
      letters: w.split('').map(char => ({ char, state: 'none' as const }))
    }));

    setGame({
      words,
      currentWordIdx: 0,
      currentCharIdx: 0,
      combo: 0,
      maxCombo: 0,
      startTime: null,
      status: 'idle',
      timeLeft: config.mode === 'time' ? config.timeValue : (config.mode === 'time_attack' ? 15 : 0),
      typedWords
    });

    setStats({
      correctKeystrokes: 0,
      totalKeystrokes: 0,
      backspaces: 0,
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      history: { wpm: [], raw: [], err: [] },
      errorKeys: {}
    });

    setShowFail(false);
  }, [config.mode, config.timeValue, generateWords]);

  const endGame = useCallback((failed = false) => {
    setGame(prev => ({ ...prev, status: 'finished' }));
    if (timerRef.current) clearInterval(timerRef.current);
    if (chartRef.current) clearInterval(chartRef.current);

    if (failed) {
      setShowFail(true);
      setTimeout(() => {
        setShowFail(false);
        initGame();
      }, 2000);
      return;
    }

    // Calculate XP
    const elapsedMin = (Date.now() - (gameRef.current.startTime || Date.now())) / 60000;
    const wpm = Math.max(0, Math.round((statsRef.current.correctKeystrokes / 5) / elapsedMin));
    const acc = statsRef.current.totalKeystrokes === 0 ? 0 : Math.round((statsRef.current.correctKeystrokes / statsRef.current.totalKeystrokes) * 100);
    const earnedXP = Math.floor(wpm * (acc / 100) * (gameRef.current.maxCombo > 50 ? 1.5 : 1));

    setRpg(prev => {
      const newXp = prev.xp + earnedXP;
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      return { xp: newXp, level: newLevel };
    });
  }, [initGame]);

  const startGame = useCallback(() => {
    setGame(prev => ({ ...prev, status: 'playing', startTime: Date.now() }));

    timerRef.current = setInterval(() => {
      setGame(prev => {
        if (prev.status !== 'playing') return prev;
        const elapsedSec = (Date.now() - (prev.startTime || Date.now())) / 1000;
        
        if (config.mode === 'time') {
          const timeLeft = Math.max(0, config.timeValue - elapsedSec);
          if (timeLeft <= 0) endGame();
          return { ...prev, timeLeft };
        } else if (config.mode === 'time_attack') {
          const timeLeft = Math.max(0, prev.timeLeft - 0.1);
          if (timeLeft <= 0) endGame();
          return { ...prev, timeLeft };
        }
        return prev;
      });
    }, 100);

    chartRef.current = setInterval(() => {
      // Logic for WPM history would go here
    }, 1000);
  }, [config.mode, config.timeValue, endGame]);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        initGame();
        return;
      }

      if (e.getModifierState && e.getModifierState('CapsLock')) setIsCapsLocked(true);
      else setIsCapsLocked(false);

      if (game.status === 'finished') return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Enter') return;
      if (e.key.length > 1 && e.key !== 'Backspace') return;

      if (game.status === 'idle' && e.key !== 'Backspace') startGame();

      setActiveKeys(prev => new Set(prev).add(e.key.toLowerCase()));

      const isBackspace = e.key === 'Backspace';
      const isSpace = e.key === ' ';

      setGame(prev => {
        if (prev.status !== 'playing') return prev;
        const newTypedWords = [...prev.typedWords];
        const currentWord = newTypedWords[prev.currentWordIdx];
        const expectedWord = prev.words[prev.currentWordIdx];

        if (isBackspace) {
          setStats(s => ({ ...s, backspaces: s.backspaces + 1 }));
          playSound('click');
          if (prev.currentCharIdx > 0) {
            const newCharIdx = prev.currentCharIdx - 1;
            const char = currentWord.letters[newCharIdx];
            if (char.state === 'extra') {
              currentWord.letters.splice(newCharIdx, 1);
            } else {
              if (char.state === 'correct') setStats(s => ({ ...s, correctKeystrokes: s.correctKeystrokes - 1, correctChars: s.correctChars - 1 }));
              else if (char.state === 'incorrect') setStats(s => ({ ...s, incorrectChars: s.incorrectChars - 1 }));
              char.state = 'none';
            }
            return { ...prev, currentCharIdx: newCharIdx, typedWords: newTypedWords };
          } else if (prev.currentWordIdx > 0) {
            // Can only go back if the previous word was incorrect
            const prevWord = newTypedWords[prev.currentWordIdx - 1];
            const isPrevCorrect = prevWord.letters.every(l => l.state === 'correct');
            if (!isPrevCorrect) {
              return { 
                ...prev, 
                currentWordIdx: prev.currentWordIdx - 1, 
                currentCharIdx: prevWord.letters.length,
                typedWords: newTypedWords
              };
            }
          }
        } else if (isSpace) {
          e.preventDefault();
          const isWordCorrect = currentWord.letters.every(l => l.state === 'correct') && prev.currentCharIdx === expectedWord.length;
          
          if (config.diff === 'expert' && !isWordCorrect) { endGame(true); return prev; }
          if (config.strictSpace === 'on' && !isWordCorrect) { playSound('error'); triggerShake('error'); return prev; }

          if (isWordCorrect) {
            setStats(s => ({ ...s, correctKeystrokes: s.correctKeystrokes + 1, totalKeystrokes: s.totalKeystrokes + 1 }));
            if (config.mode === 'time_attack') {
              setShowTimeAdded(true);
              setTimeout(() => setShowTimeAdded(false), 300);
              return { 
                ...prev, 
                currentWordIdx: prev.currentWordIdx + 1, 
                currentCharIdx: 0, 
                combo: prev.combo + 1,
                maxCombo: Math.max(prev.maxCombo, prev.combo + 1),
                timeLeft: prev.timeLeft + 1.5
              };
            }
          }

          if (prev.currentWordIdx + 1 >= prev.words.length) {
            endGame();
            return { ...prev, status: 'finished' };
          }

          playSound('mech', ' ');
          return { 
            ...prev, 
            currentWordIdx: prev.currentWordIdx + 1, 
            currentCharIdx: 0,
            combo: isWordCorrect ? prev.combo + 1 : 0,
            maxCombo: Math.max(prev.maxCombo, isWordCorrect ? prev.combo + 1 : prev.maxCombo)
          };
        } else {
          setStats(s => ({ ...s, totalKeystrokes: s.totalKeystrokes + 1 }));
          if (prev.currentCharIdx < expectedWord.length) {
            const isCorrect = e.key === expectedWord[prev.currentCharIdx];
            currentWord.letters[prev.currentCharIdx].state = isCorrect ? 'correct' : 'incorrect';
            if (isCorrect) {
              setStats(s => ({ ...s, correctKeystrokes: s.correctKeystrokes + 1, correctChars: s.correctChars + 1 }));
              playSound('mech', e.key);
              
              // Particle spawn
              if (wordsWrapperRef.current) {
                const activeWordEl = wordsWrapperRef.current.querySelector('.active-word');
                const letterEl = activeWordEl?.querySelectorAll('.letter')[prev.currentCharIdx];
                if (letterEl) {
                  const rect = letterEl.getBoundingClientRect();
                  const containerRect = wordsWrapperRef.current.getBoundingClientRect();
                  spawnParticles(rect.left - containerRect.left, rect.top - containerRect.top);
                }
              }
            } else {
              setStats(s => ({ ...s, incorrectChars: s.incorrectChars + 1 }));
              playSound('error', e.key);
              triggerShake('error');
              if (config.diff === 'master') { endGame(true); return prev; }
            }
            return { 
              ...prev, 
              currentCharIdx: prev.currentCharIdx + 1,
              combo: isCorrect ? prev.combo + 1 : 0,
              maxCombo: Math.max(prev.maxCombo, isCorrect ? prev.combo + 1 : prev.maxCombo)
            };
          } else if (prev.currentCharIdx < expectedWord.length + 10) {
            currentWord.letters.push({ char: e.key, state: 'extra' });
            setStats(s => ({ ...s, extraChars: s.extraChars + 1 }));
            playSound('error', e.key);
            triggerShake('error');
            return { ...prev, currentCharIdx: prev.currentCharIdx + 1, combo: 0 };
          }
        }
        return prev;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game.status, showSettings, config.diff, config.strictSpace, config.mode, config.lang, initGame, startGame, endGame, playSound]);

  // --- Lifecycle ---
  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    document.body.setAttribute('data-theme', config.theme);
    document.body.setAttribute('data-font', config.font);
    document.body.setAttribute('data-weight', config.weight);
    document.body.setAttribute('data-size', config.size);
    document.body.setAttribute('data-width', config.width);
    document.body.setAttribute('data-caret', config.caret);
    document.body.setAttribute('data-caret-anim', config.caretAnim);
    document.body.setAttribute('data-rgb', config.rgb);
    document.body.setAttribute('data-highlight', config.highlight);
  }, [config]);

  // --- Render Helpers ---
  const renderWords = () => {
    return game.typedWords.map((word, wIdx) => (
      <div 
        key={wIdx} 
        className={`word ${wIdx === game.currentWordIdx ? 'active-word' : ''} ${game.status === 'playing' && config.fade === 'on' && wIdx < game.currentWordIdx ? 'completed' : ''}`}
      >
        {word.letters.map((letter, lIdx) => (
          <span key={lIdx} className={`letter ${letter.state}`}>
            {letter.char}
          </span>
        ))}
      </div>
    ));
  };

  const renderKeyboard = () => {
    if (config.keymap === 'off') return null;
    return (
      <div className="mt-10 flex flex-col gap-2 items-center opacity-70 transition-opacity">
        {KB_LAYOUT.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-2 justify-center w-full">
            {row.map(key => (
              <div 
                key={key} 
                className={`
                  bg-[rgba(128,128,128,0.1)] border border-[rgba(128,128,128,0.2)] text-[var(--sub-color)] 
                  p-3.5 rounded-lg font-mono text-base min-w-[45px] text-center transition-all lowercase
                  ${key === 'space' ? 'w-[350px]' : ''}
                  ${activeKeys.has(key === 'space' ? ' ' : key) ? 'active-key bg-[var(--main-color)] text-[var(--bg-color)] scale-90 shadow-[0_0_20px_var(--main-color)] border-[var(--main-color)]' : ''}
                `}
              >
                {key === 'space' ? '' : key}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-[var(--container-width)] p-8 flex flex-col min-h-screen transition-[width] duration-300">
      <div 
        className="fixed top-0 left-0 h-1 bg-[var(--main-color)] z-[1000] transition-[width] duration-100" 
        style={{ width: `${config.mode === 'time' ? (100 - (game.timeLeft / config.timeValue) * 100) : (config.mode === 'words' ? (game.currentWordIdx / game.words.length) * 100 : 0)}%` }}
      />

      {isCapsLocked && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[var(--main-color)] text-[var(--bg-color)] rounded-lg font-bold z-[1000] shadow-lg animate-bounce">
          CAPS LOCK YONIQ!
        </div>
      )}

      {showFail && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[var(--error-color)] text-white rounded-lg font-bold z-[1000] shadow-lg">
          TEST MUVAFFAQIYATSIZ
        </div>
      )}

      {showTimeAdded && (
        <div className="fixed top-[70px] left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[var(--main-color)] text-[var(--bg-color)] rounded-lg font-bold z-[1000] shadow-lg">
          +1.5s
        </div>
      )}

      <header className="flex justify-between items-center mb-8 flex-wrap gap-5">
        <div className="text-4xl font-bold text-[var(--text-color)] flex items-center gap-2.5 cursor-pointer tracking-tighter" onClick={initGame}>
          <Keyboard className="text-[var(--main-color)] logo-icon" size={32} />
          typing<span className="text-[var(--main-color)]">titan</span>
        </div>

        <div className="flex items-center gap-4 bg-[rgba(0,0,0,0.2)] px-4 py-1.5 rounded-full font-mono text-sm">
          <span className="text-[var(--main-color)] font-bold text-lg">LVL {rpg.level}</span>
          <div className="w-32 h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-[var(--main-color)] transition-[width] duration-500" 
              style={{ width: `${((rpg.xp % (rpg.level * 1000)) / (rpg.level * 1000)) * 100}%` }}
            />
          </div>
          <span className="text-[var(--sub-color)] font-bold">{rpg.xp % (rpg.level * 1000)} / {rpg.level * 1000} XP</span>
        </div>

        <nav className="bg-[rgba(0,0,0,0.1)] p-2 rounded-xl flex gap-4 text-sm text-[var(--sub-color)] flex-wrap">
          <div className="flex items-center gap-2.5 relative pr-4 border-r border-[rgba(128,128,128,0.2)]">
            <button 
              className="cursor-pointer hover:text-[var(--text-color)] hover:bg-[rgba(255,255,255,0.05)] p-1 rounded-md transition-all"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${config.mode === 'time' ? 'text-[var(--main-color)] bg-[rgba(128,128,128,0.1)]' : 'hover:text-[var(--text-color)]'}`}
              onClick={() => setConfig(c => ({ ...c, mode: 'time' }))}
            >
              <Clock size={16} /> Vaqt
            </button>
            <button 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${config.mode === 'words' ? 'text-[var(--main-color)] bg-[rgba(128,128,128,0.1)]' : 'hover:text-[var(--text-color)]'}`}
              onClick={() => setConfig(c => ({ ...c, mode: 'words' }))}
            >
              <Type size={16} /> So'zlar
            </button>
            <button 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${config.mode === 'time_attack' ? 'text-[#ff4500] bg-[rgba(128,128,128,0.1)]' : 'hover:text-[#ff4500]'}`}
              onClick={() => setConfig(c => ({ ...c, mode: 'time_attack' }))}
            >
              <Zap size={16} /> Time Attack
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col justify-center relative">
        <AnimatePresence>
          {game.combo > 10 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute -top-10 left-1/2 -translate-x-1/2 text-2xl font-mono font-bold flex items-center gap-2.5 ${game.combo > 50 ? 'text-[#ff4500] drop-shadow-[0_0_10px_#ff4500]' : 'text-[var(--sub-color)]'}`}
            >
              <Flame size={24} /> {game.combo} Combo
            </motion.div>
          )}
        </AnimatePresence>

        {game.status !== 'finished' ? (
          <div className={`transition-all duration-300 ${!isFocused ? 'blur-md' : ''}`}>
            <div className={`flex justify-between text-2xl text-[var(--main-color)] mb-2.5 font-mono font-medium transition-opacity duration-300 ${game.status === 'playing' ? 'opacity-100' : 'opacity-0'}`}>
              <div>{Math.ceil(game.timeLeft)}</div>
              <div>{Math.round((stats.correctKeystrokes / 5) / (Math.max(1, (Date.now() - (game.startTime || Date.now())) / 1000) / 60))} wpm</div>
            </div>

            <div className="relative h-[calc(var(--font-size)*var(--line-height)*3)] overflow-hidden text-[var(--font-size)] font-[var(--font-weight)] leading-[var(--line-height)] font-mono">
              <div 
                ref={wordsWrapperRef}
                className="flex flex-wrap content-start gap-x-[0.4ch] transition-transform duration-200 ease-out"
                style={{ transform: `translateY(-${Math.max(0, (game.currentWordIdx > 20 ? Math.floor(game.currentWordIdx / 10) * 40 : 0))}px)` }}
              >
                {renderWords()}
              </div>
              <div 
                ref={caretRef}
                className="caret-base absolute bg-[var(--main-color)] transition-all duration-[var(--caret-smooth)]"
                style={{ 
                  // Caret positioning would ideally be calculated via DOM refs for precision
                  // This is a simplified version for the React structure
                }}
              />
            </div>

            {!isFocused && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm text-xl cursor-pointer z-20 text-white font-bold rounded-xl"
                onClick={() => setIsFocused(true)}
              >
                <MousePointer2 className="mr-2" /> Yozishni davom ettirish uchun bosing
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-6">
              <div className="col-span-1">
                <div className="flex flex-col mb-4">
                  <span className="text-lg text-[var(--sub-color)] font-medium">wpm</span>
                  <span className="text-8xl text-[var(--main-color)] font-bold tracking-tighter leading-none">
                    {Math.round((stats.correctKeystrokes / 5) / ((Date.now() - (game.startTime || Date.now())) / 60000))}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg text-[var(--sub-color)] font-medium">aniqlik</span>
                  <span className="text-4xl text-[var(--text-color)] font-bold">
                    {stats.totalKeystrokes === 0 ? 0 : Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100)}%
                  </span>
                </div>
              </div>
              <div className="col-span-2 bg-[rgba(0,0,0,0.15)] rounded-xl p-5 border border-[rgba(128,128,128,0.1)] h-64 flex items-center justify-center text-[var(--sub-color)]">
                {/* Chart would go here */}
                Grafik ma'lumotlari yuklanmoqda...
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 bg-[rgba(0,0,0,0.15)] p-6 rounded-xl border border-[rgba(128,128,128,0.1)]">
              <div className="flex flex-col">
                <span className="text-sm text-[var(--sub-color)]">raw wpm</span>
                <span className="text-2xl text-[var(--text-color)] font-bold">
                  {Math.round((stats.totalKeystrokes / 5) / ((Date.now() - (game.startTime || Date.now())) / 60000))}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-[var(--sub-color)]">max combo</span>
                <span className="text-2xl text-[var(--main-color)] font-bold">{game.maxCombo}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-[var(--sub-color)]">xatolar</span>
                <span className="text-2xl text-[var(--error-color)] font-bold">{stats.incorrectChars}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-[var(--sub-color)]">ishonch</span>
                <span className="text-2xl text-[var(--text-color)] font-bold">
                  {stats.totalKeystrokes === 0 ? 100 : Math.max(0, Math.round((1 - (stats.backspaces / stats.totalKeystrokes)) * 100))}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-[var(--sub-color)]">rejim</span>
                <span className="text-lg text-[var(--text-color)] font-bold uppercase">{config.mode}</span>
              </div>
            </div>
          </motion.div>
        )}

        {renderKeyboard()}

        <div className="mt-12 flex flex-col items-center gap-5">
          <button 
            className="bg-transparent border-none text-[var(--sub-color)] text-3xl cursor-pointer hover:text-[var(--text-color)] hover:scale-110 active:scale-90 transition-all p-4"
            onClick={initGame}
            title="Qayta boshlash"
          >
            <RotateCcw size={32} />
          </button>
          <div className="text-sm text-[var(--sub-color)] text-center">
            <span className="bg-[rgba(128,128,128,0.2)] px-2 py-1 rounded-md text-[var(--text-color)] font-mono font-bold mx-1">Tab</span> qayta boshlash
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex justify-center items-center z-[1000] backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--bg-color)] rounded-2xl w-[95%] max-w-[1000px] h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="p-6 px-8 border-b border-[rgba(128,128,128,0.15)] flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-2">
                  <Settings className="text-[var(--main-color)]" /> TITAN Sozlamalar
                </h2>
                <button className="text-[var(--sub-color)] hover:text-[var(--error-color)] transition-colors" onClick={() => setShowSettings(false)}>
                  <X size={32} />
                </button>
              </div>

              <div className="flex flex-grow overflow-hidden">
                <div className="w-60 bg-black/15 p-6 flex flex-col gap-2 overflow-y-auto border-r border-[rgba(128,128,128,0.1)]">
                  {[
                    { id: 'tab-behavior', label: 'Qoidalar', icon: Brain },
                    { id: 'tab-appearance', label: 'Ko\'rinish', icon: Eye },
                    { id: 'tab-sound', label: 'Ovoz & FX', icon: Volume2 },
                    { id: 'tab-theme', label: 'Temalar', icon: Palette }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      className={`p-3.5 px-6 text-left rounded-md transition-all flex items-center gap-2.5 font-medium ${activeTab === tab.id ? 'bg-[rgba(128,128,128,0.1)] text-[var(--main-color)] border-r-4 border-[var(--main-color)]' : 'text-[var(--sub-color)] hover:text-[var(--text-color)] hover:bg-white/5'}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon size={20} /> {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                  {activeTab === 'tab-behavior' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Lug'at (Dictionary)</label>
                        <div className="flex flex-wrap gap-2.5">
                          {['en', 'uz', 'code_js', 'code_html', 'emoji'].map(l => (
                            <button 
                              key={l}
                              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${config.lang === l ? 'border-[var(--main-color)] text-[var(--main-color)] bg-[rgba(128,128,128,0.15)]' : 'border-transparent bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] hover:bg-[rgba(128,128,128,0.2)]'}`}
                              onClick={() => setConfig(c => ({ ...c, lang: l }))}
                            >
                              {l.replace('_', ' ').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Qiyinchilik</label>
                        <div className="flex flex-wrap gap-2.5">
                          {['normal', 'expert', 'master'].map(d => (
                            <button 
                              key={d}
                              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${config.diff === d ? 'border-[var(--main-color)] text-[var(--main-color)] bg-[rgba(128,128,128,0.15)]' : 'border-transparent bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] hover:bg-[rgba(128,128,128,0.2)]'}`}
                              onClick={() => setConfig(c => ({ ...c, diff: d }))}
                            >
                              {d.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tab-appearance' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Kursor Turi</label>
                        <div className="flex flex-wrap gap-2.5">
                          {['line', 'block', 'underline'].map(ct => (
                            <button 
                              key={ct}
                              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${config.caret === ct ? 'border-[var(--main-color)] text-[var(--main-color)] bg-[rgba(128,128,128,0.15)]' : 'border-transparent bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] hover:bg-[rgba(128,128,128,0.2)]'}`}
                              onClick={() => setConfig(c => ({ ...c, caret: ct }))}
                            >
                              {ct.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Shrift</label>
                        <div className="flex flex-wrap gap-2.5">
                          {['fira', 'jetbrains', 'roboto'].map(f => (
                            <button 
                              key={f}
                              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${config.font === f ? 'border-[var(--main-color)] text-[var(--main-color)] bg-[rgba(128,128,128,0.15)]' : 'border-transparent bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] hover:bg-[rgba(128,128,128,0.2)]'}`}
                              onClick={() => setConfig(c => ({ ...c, font: f }))}
                            >
                              {f.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tab-sound' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Ovoz Effektlari</label>
                        <div className="flex flex-wrap gap-2.5">
                          {['off', 'click', 'mech', 'typewriter', 'water', '8bit'].map(s => (
                            <button 
                              key={s}
                              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${config.sound === s ? 'border-[var(--main-color)] text-[var(--main-color)] bg-[rgba(128,128,128,0.15)]' : 'border-transparent bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] hover:bg-[rgba(128,128,128,0.2)]'}`}
                              onClick={() => {
                                setConfig(c => ({ ...c, sound: s }));
                                playSound(s, 'k');
                              }}
                            >
                              {s.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Ovoz Balandligi</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={config.volume * 100} 
                          onChange={(e) => setConfig(c => ({ ...c, volume: parseInt(e.target.value) / 100 }))}
                          className="w-full accent-[var(--main-color)] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'tab-theme' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-lg font-semibold text-[var(--text-color)]">Temalar</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {['carbon', 'light', 'matrix', 'dracula', 'tokyonight', 'nord', 'catppuccin', 'synthwave', 'cyberpunk', 'galaxy', 'aura'].map(t => (
                            <button 
                              key={t}
                              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${config.theme === t ? 'border-[var(--main-color)] text-[var(--main-color)] bg-[rgba(128,128,128,0.15)]' : 'border-transparent bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] hover:bg-[rgba(128,128,128,0.2)]'}`}
                              onClick={() => setConfig(c => ({ ...c, theme: t }))}
                            >
                              {t.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
