'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Trophy, 
  HelpCircle, 
  Compass, 
  Coins, 
  Menu, 
  Settings, 
  User, 
  ChevronRight, 
  X, 
  Info, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  Tv, 
  ShoppingBag,
  Sparkles,
  Award,
  Zap,
  Target
} from 'lucide-react';

// SOUND ENGINE USING WEB AUDIO API
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Initialized lazily response to user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  playBrickHit(isDouble = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      const freq = isDouble ? 330 : 440;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context hit error:", e);
    }
  }

  playPaddleHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  playPowerup() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [261.6, 329.6, 392.0, 523.3]; // C-E-G-C ascending arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.06 + 0.12);

        osc.start(this.ctx!.currentTime + idx * 0.06);
        osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.15);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  playGameOver() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(75, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch (e) {
      console.warn(e);
    }
  }

  playLevelComplete() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn(e);
    }
  }
}

const sfx = new SoundFX();

// CORE APP TYPES
type TabType = 'menu' | 'play' | 'store' | 'leaderboard';

interface Pilot {
  id: string;
  rank: string;
  name: string;
  score: number;
  levelText: string;
  avatar: string;
  isVIP?: boolean;
  isYou?: boolean;
}

interface PaddleSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  secondaryColor: string;
  widthMultiplier: number;
  glowColor: string;
  unlocked: boolean;
  equipped: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'multiball' | 'wide' | 'slow' | 'credits';
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface LevelDef {
  name: string;
  brickRows: {
    color: string;
    glowColor: string;
    points: number;
    lives: number;
  }[];
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // LAZY STATE INITIALIZATIONS to prevent react-hooks/set-state-in-effect issues
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neonsharks_sound');
      if (saved) return saved === 'true';
    }
    return true;
  });

  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neonsharks_difficulty');
      if (saved) return saved as any;
    }
    return 'normal';
  });

  const [credits, setCredits] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neonsharks_credits');
      if (saved) return parseInt(saved, 10);
    }
    return 12450;
  });

  const [paddles, setPaddles] = useState<PaddleSkin[]>(() => {
    const initialPaddles: PaddleSkin[] = [
      {
        id: 'classic',
        name: 'Classic NeonSharks',
        description: 'The original interceptor. Reliable and sleek.',
        price: 0,
        color: '#00f3ff',
        secondaryColor: '#ffffff',
        widthMultiplier: 1.0,
        glowColor: '0 0 10px rgba(0, 243, 255, 0.8)',
        unlocked: true,
        equipped: true
      },
      {
        id: 'magenta',
        name: 'Magenta Fury',
        description: 'High-intensity glow with vibrant trailing light.',
        price: 2500,
        color: '#ff24e4',
        secondaryColor: '#ffffff',
        widthMultiplier: 1.0,
        glowColor: '0 0 10px rgba(255, 36, 228, 0.8)',
        unlocked: false,
        equipped: false
      },
      {
        id: 'emerald',
        name: 'Emerald Shield',
        description: 'Industrial grade heavy plating with eco-glow.',
        price: 5000,
        color: '#36fd0f',
        secondaryColor: '#e8ffda',
        widthMultiplier: 1.25,
        glowColor: '0 0 12px rgba(54, 253, 15, 0.8)',
        unlocked: false,
        equipped: false
      },
      {
        id: 'ghost',
        name: 'Ghost Interceptor',
        description: 'Futuristic alpha-shielded holographic interceptor.',
        price: 12000,
        color: '#e3fdff',
        secondaryColor: '#849495',
        widthMultiplier: 1.1,
        glowColor: '0 0 15px rgba(227, 253, 255, 0.9)',
        unlocked: false,
        equipped: false
      }
    ];

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neonsharks_paddles');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch(e) {}
      }
    }
    return initialPaddles;
  });

  const [leaderboard, setLeaderboard] = useState<Pilot[]>(() => {
    const initialLeaderboard: Pilot[] = [
      {
        id: 'p1',
        rank: '01',
        name: 'NEO_WALKER',
        score: 1240500,
        levelText: 'NEON MASTER',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMYJCTXxnyq_oxNrOPlGVo8oDP9GGEWVBQvO92lYw3GvxuP6ztZF3wB7J8JnbqHHjcT5EB5dzEOSfrTsfMbMjpT_Q4hOfFi84S5KnDPldWbyB2BYL7v9DzbgSt6WF7XEbcfi--MiNIFZ9GM1nkWVoG2nZz01Rs8vVqQflVdHFoloc8Iu3RsjgE7eQyzhgzWD3Buqjp59pQM6gBghceTDbGObsQ_h7TN_U3iKL5p2WBlXWnd22bfkQI9GzNqDgE6ursPBWAUgF2J9Fo',
        isVIP: true
      },
      {
        id: 'p2',
        rank: '02',
        name: 'ZERO_DAY',
        score: 982100,
        levelText: 'CHALLENGER',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz_NCuJaa1bemzvBrweXitdjGNmsLIBeUXdtHEWFDWTEAVIH8Kv0oRscPcJBeUBQ53UnFafwgVb84f28mOOb6_W6e7sX3J1u4YmnrH41YYmAvDUZklP4m1c9917TaY3J-c1fIlFYK7Kc11vf1XKnzjwB4OKfS7h5In8pq9UTR1JSFS7UTIzJmDdCNkEKWSj9q_9J6IcFTZUwNNFJyn9nBvgCzpbdZ5FjpFPmeIG5zfDEtdfqtolG11n3mo_0A7mCfd7nvPBrhH95AL',
      },
      {
        id: 'you',
        rank: '42',
        name: 'SHARK_PILOT_01',
        score: 452000,
        levelText: 'LEVEL 42',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkLPk95yEBz-VfMMkqnz5KuAs-nh1ib6OrFtK4FF1dTc4bT4bMaYPggRSea5bMYo93lwtKybSqyN2puPpv1zpqoXakRglRn8q0FPTG1pxaP2HyXOjn24fX1v_PJBNY4GK-vgc33AjWEIIsANbGXBtRTU6U0vQbVQO6pb4qu6baM57JFZOt4zswyzcgYKSzE_3PVmCmQ174O2-ePs07yQ5bV0n6bCwC5fTFKBXccz_duIeuryIBSsPk_IYsdbtDouUQgjXEqs1CEs6a',
        isYou: true
      },
      {
        id: 'p4',
        rank: '43',
        name: 'CYBER_STRIKE',
        score: 448500,
        levelText: 'EXPERT',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBCpl7eRvf2POsL3PxXXjIcgUtmOPBurPT9Ugzeo8xoir3bL76RG5z-kChe5PZYiGpNnZa_2c-A9MpOsdWKTxLxGL8q42WP5kZwiSJEmOob3ogqwhGgAgrqXunPqolbExo7J1AcEkufPjywAMRu2R6xBezCmuwW9jxhV7xGldLotapzNQ_9fbbnfChz05KL8sCchI0pMould_EaEvzMp23TaN1mewSDwkm4BV9Ih3UZQzR8kYxHabtM_LvGAcYoryTuuE05oohgyj3',
      },
      {
        id: 'p5',
        rank: '44',
        name: 'LIGHT_SPEED',
        score: 441000,
        levelText: 'EXPERT',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrX6-fmdICZsfh-BsHfxn53Orxu_klCKq9RMYe6go-ApEGYpgtO3ZywZAZeGCcm934YsE06g8EpBiyRaiFKxE0H1Ez0ucKWWdlzbPyQAWyriJ-O6Bl2CziNqxoO3hsui9WnvNjDZAhMPyJcxJEQvo1DnMuWOTIbCkvxPRpot7eNM-jQDe4UCgx_pGBf0zmz7rYAkFxC49qwde9HUQmdHy84ySy1FkUuOSoOVh5-_janBHNXpu_661g6zDIUdpqqnsNphtU2cAfbY5v',
      }
    ];

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neonsharks_leaderboard');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch(e) {}
      }
    }
    return initialLeaderboard;
  });

  const [activeStoreFilter, setActiveStoreFilter] = useState<'all' | 'paddles' | 'effects' | 'sounds'>('all');

  const saveSettings = (updatedSound: boolean, uDifficulty: 'easy' | 'normal' | 'hard') => {
    localStorage.setItem('neonsharks_sound', updatedSound.toString());
    localStorage.setItem('neonsharks_difficulty', uDifficulty);
  };

  const updateCredits = (amount: number) => {
    setCredits(prev => {
      const nextVal = prev + amount;
      localStorage.setItem('neonsharks_credits', nextVal.toString());
      return nextVal;
    });
  };

  const equipPaddle = (id: string) => {
    const nextArr = paddles.map(pad => {
      if (pad.id === id) return { ...pad, equipped: true };
      return { ...pad, equipped: false };
    });
    setPaddles(nextArr);
    localStorage.setItem('neonsharks_paddles', JSON.stringify(nextArr));
  };

  const buyPaddle = (id: string, price: number) => {
    if (credits >= price) {
      const nextArr = paddles.map(pad => {
        if (pad.id === id) return { ...pad, unlocked: true, equipped: true };
        return { ...pad, equipped: pad.id === id ? true : false };
      });
      setPaddles(nextArr);
      setCredits(prev => {
        const nextCredits = prev - price;
        localStorage.setItem('neonsharks_credits', nextCredits.toString());
        return nextCredits;
      });
      localStorage.setItem('neonsharks_paddles', JSON.stringify(nextArr));
      sfx.playPowerup();
    }
  };

  const savePlayerHighScore = (finalScore: number) => {
    if (typeof window === 'undefined') return;

    // Check if score belongs on leaderboard
    const currentYou = leaderboard.find(p => p.isYou);
    if (!currentYou || finalScore > currentYou.score) {
      const updatedLeaderboard = leaderboard.map(p => {
        if (p.isYou) {
          return { ...p, score: Math.max(p.score, finalScore) };
        }
        return p;
      });

      // Sort leaderboard
      updatedLeaderboard.sort((a, b) => b.score - a.score);

      // Reassign rank strings
      const rankedArr = updatedLeaderboard.map((pil, idx) => {
        const strRank = (idx + 1).toString().padStart(2, '0');
        return {
          ...pil,
          rank: strRank
        };
      });

      setLeaderboard(rankedArr);
      localStorage.setItem('neonsharks_leaderboard', JSON.stringify(rankedArr));
    }
  };

  // Synchronize initial sound effect option
  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  const equippedVaus = paddles.find(p => p.equipped) || paddles[0];

  // GAME ENGINE STATES
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameCreditsEarned, setGameCreditsEarned] = useState(0);
  const [showGameSummary, setShowGameSummary] = useState<'won' | 'lost' | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // LEVEL LIST DEFINITIONS
  const levels: LevelDef[] = [
    {
      name: "NEBULA GATE",
      brickRows: [
        { color: '#ff24e4', glowColor: 'rgba(255,36,228,0.7)', points: 1500, lives: 1 },
        { color: '#00f3ff', glowColor: 'rgba(0,243,255,0.7)', points: 1000, lives: 1 },
        { color: '#36fd0f', glowColor: 'rgba(54,253,15,0.7)', points: 500, lives: 1 }
      ]
    },
    {
      name: "QUANTUM HORIZON",
      brickRows: [
        { color: '#e3fdff', glowColor: 'rgba(227,253,255,0.8)', points: 3000, lives: 2 }, // Double hit bricks
        { color: '#ff24e4', glowColor: 'rgba(255,36,228,0.7)', points: 1500, lives: 1 },
        { color: '#00f3ff', glowColor: 'rgba(0,243,255,0.7)', points: 1000, lives: 1 },
        { color: '#36fd0f', glowColor: 'rgba(54,253,15,0.7)', points: 500, lives: 1 }
      ]
    },
    {
      name: "OMEGA VOID",
      brickRows: [
        { color: '#e3fdff', glowColor: 'rgba(227,253,255,0.8)', points: 3000, lives: 2 },
        { color: '#ff24e4', glowColor: 'rgba(255,36,228,0.7)', points: 2000, lives: 1 },
        { color: '#00f3ff', glowColor: 'rgba(0,243,255,0.7)', points: 1500, lives: 1 },
        { color: '#36fd0f', glowColor: 'rgba(54,253,15,0.7)', points: 1000, lives: 1 }
      ]
    }
  ];

  // GAME LOOP REFS
  const stateRef = useRef({
    paddleX: 300,
    paddleWidth: 120,
    targetPaddleWidth: 120,
    balls: [] as Ball[],
    powerups: [] as PowerUp[],
    particles: [] as Particle[],
    bricks: [] as {
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      glowColor: string;
      points: number;
      lives: number;
      maxLives: number;
    }[],
    paddleTouchDirection: null as 'left' | 'right' | null,
    canvasWidth: 600,
    canvasHeight: 720,
    ballLaunchTimer: 0,
    keys: {} as Record<string, boolean>,
    score: 0,
    gameCreditsEarned: 0,
    difficulty: 'normal' as 'easy' | 'normal' | 'hard',
    equippedVaus: null as any
  });

  // START LOCAL GAME LOOP
  const startGame = (levelIdx: number) => {
    setActiveTab('play');
    setCurrentLevelIndex(levelIdx);
    setScore(0);
    setLives(3);
    setGameCreditsEarned(0);
    setShowGameSummary(null);
    setIsPlaying(true);
    setIsPaused(false);

    stateRef.current.score = 0;
    stateRef.current.gameCreditsEarned = 0;
    stateRef.current.difficulty = difficulty;
    stateRef.current.equippedVaus = equippedVaus;

    // Build bricks list
    const lvl = levels[levelIdx] || levels[0];
    const brickHeight = 24;
    const padding = 6;
    const startY = 120;
    const columns = 6;
    const actualWidthWithSpaceAdded = (stateRef.current.canvasWidth - (padding * (columns + 1))) / columns;

    const bList: {
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      glowColor: string;
      points: number;
      lives: number;
      maxLives: number;
    }[] = [];
    lvl.brickRows.forEach((row, rowIdx) => {
      for (let col = 0; col < columns; col++) {
        bList.push({
          x: padding + col * (actualWidthWithSpaceAdded + padding),
          y: startY + rowIdx * (brickHeight + padding),
          width: actualWidthWithSpaceAdded,
          height: brickHeight,
          color: row.color,
          glowColor: row.glowColor,
          points: row.points,
          lives: row.lives,
          maxLives: row.lives
        });
      }
    });

    stateRef.current.bricks = bList;
    stateRef.current.powerups = [];
    stateRef.current.particles = [];
    stateRef.current.paddleX = 300;

    // Apply equipment multiplier to paddle width
    const basePaddleWidth = 110;
    const targetWidth = basePaddleWidth * equippedVaus.widthMultiplier;
    stateRef.current.paddleWidth = targetWidth;
    stateRef.current.targetPaddleWidth = targetWidth;

    // Start with 1 ball
    stateRef.current.balls = [
      {
        x: 300,
        y: 600,
        vx: 3,
        vy: -5,
        radius: 8
      }
    ];

    sfx.playPowerup();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch / Drag pointer controls
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startPaddleXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || showGameSummary) return;
    isDraggingRef.current = true;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    startXRef.current = e.clientX;
    startPaddleXRef.current = stateRef.current.paddleX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || showGameSummary || !isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - startXRef.current;
    
    // Convert screen pixel delta to canvas coordinates (600 base width)
    const scaledDeltaX = deltaX * (600 / rect.width);
    
    const halfWidth = stateRef.current.paddleWidth / 2;
    stateRef.current.paddleX = Math.max(halfWidth, Math.min(600 - halfWidth, startPaddleXRef.current + scaledDeltaX));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Update loop
  useEffect(() => {
    if (!isPlaying || isPaused || showGameSummary) return;

    stateRef.current.difficulty = difficulty;
    stateRef.current.equippedVaus = equippedVaus;

    let animFrame: number;

    const gameUpdateAndRender = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) {
        // Safe retry on next animation frame if canvas element is still mounting in the DOM
        animFrame = requestAnimationFrame(gameUpdateAndRender);
        return;
      }

      const state = stateRef.current;

      // CLEAR CANVAS WITH FADING MATRIX PATTERN
      ctx.fillStyle = 'rgba(5, 5, 5, 0.25)'; // slight motion trail
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      // DRAWS RADIAL DOT GRID
      ctx.fillStyle = 'rgba(58, 73, 75, 0.4)';
      for (let gx = 20; gx < state.canvasWidth; gx += 40) {
        for (let gy = 20; gy < state.canvasHeight; gy += 40) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // PHYSICS UPDATE: PADDLE
      const speedMultiplier = state.difficulty === 'hard' ? 7.5 : state.difficulty === 'easy' ? 9.5 : 8.5;
      if (state.keys['ArrowLeft'] || state.keys['a'] || state.keys['A'] || state.paddleTouchDirection === 'left') {
        state.paddleX = Math.max(state.paddleWidth / 2, state.paddleX - speedMultiplier);
      }
      if (state.keys['ArrowRight'] || state.keys['d'] || state.keys['D'] || state.paddleTouchDirection === 'right') {
        state.paddleX = Math.min(state.canvasWidth - state.paddleWidth / 2, state.paddleX + speedMultiplier);
      }

      // Gradually decay custom paddle powerup width
      if (state.paddleWidth > state.targetPaddleWidth) {
        state.paddleWidth -= 0.15;
      } else if (state.paddleWidth < state.targetPaddleWidth) {
        state.paddleWidth += 0.15;
      }

      // UPDATE PARTICLES
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
        return true;
      });

      // UPDATE POWERUPS
      state.powerups = state.powerups.filter(pu => {
        pu.y += 2.8; // drop speed

        // Catch check
        const halfW = state.paddleWidth / 2;
        const paddleY = 660;
        if (
          pu.y + pu.radius >= paddleY &&
          pu.y - pu.radius <= paddleY + 12 &&
          pu.x >= state.paddleX - halfW &&
          pu.x <= state.paddleX + halfW
        ) {
          // Activating powerups
          sfx.playPowerup();
          if (pu.type === 'credits') {
            state.gameCreditsEarned += 250;
            setGameCreditsEarned(state.gameCreditsEarned);
          } else if (pu.type === 'multiball') {
            // Duplicate balls
            const currentCount = state.balls.length;
            for (let i = 0; i < Math.min(2, 6 - currentCount); i++) {
              state.balls.push({
                x: state.paddleX,
                y: paddleY - 20,
                vx: (Math.random() - 0.5) * 6,
                vy: -5 - Math.random() * 2,
                radius: 8
              });
            }
          } else if (pu.type === 'wide') {
            // Expands the paddle limit temporarily
            state.paddleWidth = Math.min(220, state.paddleWidth + 50);
          } else if (pu.type === 'slow') {
            // Slow down the velocities
            state.balls.forEach(b => {
              b.vx *= 0.75;
              b.vy *= 0.75;
            });
          }
          return false;
        }

        // Drop below safety floor
        if (pu.y > state.canvasHeight) return false;

        // Render powerup item
        ctx.save();
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        let color = '#00f3ff';
        let symbol = 'P';
        if (pu.type === 'credits') { color = '#36fd0f'; symbol = '$'; }
        if (pu.type === 'wide') { color = '#ff24e4'; symbol = 'W'; }
        if (pu.type === 'slow') { color = '#ffd7f0'; symbol = 'S'; }

        ctx.fillStyle = 'rgba(19, 19, 21, 0.85)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.stroke();

        // Symbol label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Space Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, pu.x, pu.y);
        ctx.restore();

        return true;
      });

      // PHYSICS UPDATE: BALLS
      let nextBallsList: Ball[] = [];
      state.balls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Sideways walls collision
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx;
          sfx.playPaddleHit();
        } else if (ball.x + ball.radius >= state.canvasWidth) {
          ball.x = state.canvasWidth - ball.radius;
          ball.vx = -ball.vx;
          sfx.playPaddleHit();
        }

        // Ceiling wall collision
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy;
          sfx.playPaddleHit();
        }

        // BRICKS COLLISION CHECK
        state.bricks = state.bricks.filter(brick => {
          // AABB bounding box collision index
          const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
          const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
          const distanceX = ball.x - closestX;
          const distanceY = ball.y - closestY;
          const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

          if (distanceSquared < ball.radius * ball.radius) {
            // Bounce axis logic
            const fromLeft = ball.x + ball.vx < brick.x;
            const fromRight = ball.x + ball.vx > brick.x + brick.width;
            const fromTop = ball.y + ball.vy < brick.y;
            const fromBottom = ball.y + ball.vy > brick.y + brick.height;

            if (fromLeft || fromRight) {
              ball.vx = -ball.vx;
            } else if (fromTop || fromBottom) {
              ball.vy = -ball.vy;
            } else {
              ball.vy = -ball.vy;
            }

            // Deduct brick health
            brick.lives--;
            sfx.playBrickHit(brick.lives > 0);

            // Create blast sparks particles
            for (let k = 0; k < 12; k++) {
              state.particles.push({
                x: ball.x,
                y: ball.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: brick.color,
                alpha: 1.0,
                size: Math.random() * 4 + 2
              });
            }

            if (brick.lives <= 0) {
              state.score += brick.points;
              setScore(state.score);
              state.gameCreditsEarned += Math.ceil(brick.points / 100);
              setGameCreditsEarned(state.gameCreditsEarned);

              // Powerup drop chance
              if (Math.random() < 0.22) {
                const types: ('multiball'|'wide'|'slow'|'credits')[] = ['multiball', 'wide', 'slow', 'credits'];
                const selectType = types[Math.floor(Math.random() * types.length)];
                state.powerups.push({
                  x: brick.x + brick.width / 2,
                  y: brick.y + brick.height,
                  type: selectType,
                  radius: 12
                });
              }
              return false; // delete brick
            } else {
              // Dim points color visually
              return true;
            }
          }
          return true;
        });

        // PADDLE BOUNCE PHYSICS
        const halfW = state.paddleWidth / 2;
        const paddleY = 660;
        const paddleHeight = 12;

        if (
          ball.y + ball.radius >= paddleY &&
          ball.y - ball.radius <= paddleY + paddleHeight &&
          ball.x >= state.paddleX - halfW &&
          ball.x <= state.paddleX + halfW
        ) {
          sfx.playPaddleHit();
          ball.y = paddleY - ball.radius;

          // Angle based on hit offset from paddle center
          const hitOffset = (ball.x - state.paddleX) / halfW;
          const maxAngle = Math.PI / 3; // 60 degrees
          const bounceAngle = hitOffset * maxAngle;

          const actSkin = state.equippedVaus || equippedVaus;
          const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          // Gently accelerate to maintain dynamic challenge
          const dynamicAcceleration = state.difficulty === 'hard' ? 1.05 : state.difficulty === 'easy' ? 1.01 : 1.025;
          const speed = Math.min(10, currentSpeed * dynamicAcceleration);

          ball.vx = speed * Math.sin(bounceAngle);
          ball.vy = -speed * Math.cos(bounceAngle);

          // Spark collision rings
          for (let k = 0; k < 6; k++) {
            state.particles.push({
              x: ball.x,
              y: paddleY,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              color: actSkin.color,
              alpha: 1.0,
              size: Math.random() * 3 + 1
            });
          }
        }

        // If ball falls into void
        if (ball.y < state.canvasHeight + 50) {
          nextBallsList.push(ball);
        }
      });

      state.balls = nextBallsList;

      // Handle no balls remaining
      if (state.balls.length === 0) {
        setLives(prev => {
          const next = prev - 1;
          if (next > 0) {
            // Respawn ball on paddle
            state.balls.push({
              x: state.paddleX,
              y: 600,
              vx: 3,
              vy: -5,
              radius: 8
            });
            sfx.playGameOver();
          } else {
            // Game Over loss state
            setIsPlaying(false);
            setShowGameSummary('lost');
            sfx.playGameOver();

            // Store game score if higher than current rank
            updateCredits(state.gameCreditsEarned);
            savePlayerHighScore(state.score);
          }
          return next;
        });
      }

      // Handle level clear victory state
      if (state.bricks.length === 0) {
        setIsPlaying(false);
        setShowGameSummary('won');
        sfx.playLevelComplete();

        // Give extra win level clear bonus!
        const winBonus = 2000;
        updateCredits(state.gameCreditsEarned + winBonus);
        savePlayerHighScore(state.score + winBonus);
      }

      // RENDER PADDLE
      const actSkin = state.equippedVaus || equippedVaus;
      ctx.save();
      ctx.strokeStyle = actSkin.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = actSkin.color;
      ctx.lineWidth = 2;

      // Beautiful retro capsule gradient
      const paddleY = 660;
      const paddleW = state.paddleWidth;
      const xStart = state.paddleX - paddleW / 2;
      const padGrad = ctx.createLinearGradient(xStart, 0, xStart + paddleW, 0);
      padGrad.addColorStop(0, actSkin.color);
      padGrad.addColorStop(0.5, actSkin.secondaryColor);
      padGrad.addColorStop(1, actSkin.color);

      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.roundRect(xStart, paddleY, paddleW, 12, 10);
      ctx.fill();
      ctx.stroke();

      // Custom skin accessories
      if (actSkin.id === 'emerald') {
        // Emerald Shield bolt indicators
        ctx.fillStyle = 'rgba(54, 253, 15, 0.5)';
        ctx.fillRect(state.paddleX - paddleW/3, paddleY + 3, 3, 6);
        ctx.fillRect(state.paddleX, paddleY + 3, 3, 6);
        ctx.fillRect(state.paddleX + paddleW/3, paddleY + 3, 3, 6);
      } else if (actSkin.id === 'magenta') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(state.paddleX - paddleW/2 + 10, paddleY + 4, 4, 4);
        ctx.fillRect(state.paddleX + paddleW/2 - 14, paddleY + 4, 4, 4);
      }
      ctx.restore();

      // RENDER BRICKS
      state.bricks.forEach(brick => {
        ctx.save();
        ctx.fillStyle = brick.color;
        ctx.strokeStyle = '#131315';
        ctx.lineWidth = 1;
        ctx.shadowBlur = brick.lives > 1 ? 12 : 6;
        ctx.shadowColor = brick.color;

        // Fade partially broken bricks
        if (brick.lives < brick.maxLives) {
          ctx.globalAlpha = 0.5;
        }

        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Highlight inner reflection glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);

        ctx.restore();
      });

      // RENDER BALLS
      state.balls.forEach(ball => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

        // Cosmic central glow
        const radGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(1, actSkin.color);

        ctx.fillStyle = radGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = actSkin.color;
        ctx.fill();
        ctx.restore();
      });

      // LOOP AGAIN IF ACTIVE
      animFrame = requestAnimationFrame(gameUpdateAndRender);
    };

    // Execute first frame loop
    animFrame = requestAnimationFrame(gameUpdateAndRender);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, isPaused, showGameSummary, activeTab]);

  // HANDLERS FOR OTHER INTERACTIVE COMPONENTS
  const handleWatchAd = () => {
    sfx.playPowerup();
    updateCredits(500);
    // Notification indicator
    alert("AD EXECUTION COMPLETE: +500 Credits added to NeonSharks Network terminal!");
  };

  const handleBuyCredits = () => {
    sfx.playPowerup();
    updateCredits(2000);
    alert("PROMO LOADED SHIELD SECURITY PROTOCOL: +2,000 Credits transferred!");
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0d0d0e] justify-center items-center text-center font-mono relative overflow-hidden">
        {/* SCANLINE EFFECT */}
        <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] animate-pulse opacity-40" />
        
        <div className="p-8 rounded-2xl border border-[#3a494b]/30 bg-[#161517]/90 max-w-sm flex flex-col items-center gap-4 shadow-2xl relative z-10">
          <div className="w-12 h-12 rounded-full border-4 border-t-[#00f3ff] border-[#ff24e4]/20 animate-spin" />
          <div>
            <h2 className="text-sm font-bold text-[#00f3ff] uppercase tracking-widest animate-pulse">
              INITIALIZING NEONSHARKS
            </h2>
            <p className="text-[9px] text-[#ff24e4] tracking-wide mt-2 font-bold select-none uppercase">
              SECURE_ARCADE_LINK_ESTABLISHED
            </p>
          </div>
          <div className="w-full bg-[#1c1b1d] rounded-full h-1.5 overflow-hidden border border-[#3a494b]/30">
            <div className="bg-gradient-to-r from-[#ff24e4] to-[#00f3ff] h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-[#131315] font-sans selection:bg-[#ff24e4]/30 overflow-x-hidden md:pl-[0px]">
      {/* SCANLINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] animate-pulse" />
      <div className="fixed top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#00f3ff]/40 to-transparent pointer-events-none z-50 animate-scanline" />

      {/* NEBULA BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-[#050505] bg-cover bg-center opacity-40 mix-blend-screen pointer-events-none" 
        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD14iamCpbYR1kPgS8WAGCCi9nhM-zK3MPBIb4x3XdcNDFhw8hK6RjP0eas1UZqiwYx5YOlM5u3ggj_EBSBlmCAfLYu5ej7P0IQ7RV9gkgw2rujWo0TMP-2QhYdukT6o332vtBbDpM8p2ppQlhXly1PwoYIXEeMPKL2ONNqjaIZW0N8LT-OtRLqMiBEqADQ8EwiWI_wEa9iMLKDA-qPssQuxyhWaIIGDjwk5dmEecIHNjvT9Wogjn0DO0x6aQAnDXj-13U-ymBpDhA7')` }} 
      />

      {/* TOP HEADER */}
      <header className="fixed top-0 w-full z-40 bg-[#131315]/80 backdrop-blur-md border-b border-[#3a494b] shadow-md flex justify-between items-center px-6 py-3">
        <button 
          onClick={() => setDrawerOpen(true)}
          className="text-[#00f3ff] hover:text-[#ff24e4] transition-colors p-2 active:scale-95"
          id="btn-menu-drawer"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="font-sora text-xl md:text-2xl font-extrabold tracking-wider text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.7)]">
          NEON SHARDS BREAKER
        </h1>

        <button 
          onClick={() => setSettingsOpen(true)}
          className="text-[#00f3ff] hover:text-[#ff24e4] transition-colors p-2 active:scale-95"
          id="btn-settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      {/* LEFT NAVIGATION DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#131315] border-r border-[#3a494b] z-50 shadow-2xl flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#3a494b]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[#ff24e4] overflow-hidden">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkLPk95yEBz-VfMMkqnz5KuAs-nh1ib6OrFtK4FF1dTc4bT4bMaYPggRSea5bMYo93lwtKybSqyN2puPpv1zpqoXakRglRn8q0FPTG1pxaP2HyXOjn24fX1v_PJBNY4GK-vgc33AjWEIIsANbGXBtRTU6U0vQbVQO6pb4qu6baM57JFZOt4zswyzcgYKSzE_3PVmCmQ174O2-ePs07yQ5bV0n6bCwC5fTFKBXccz_duIeuryIBSsPk_IYsdbtDouUQgjXEqs1CEs6a" 
                      alt="Pilot" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-sora font-bold text-sm text-[#00f3ff]">SHARK_PILOT_01</h4>
                    <p className="font-mono text-[10px] text-[#ff24e4] tracking-widest">RANK: MASTER</p>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="text-[#849495] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#1c1b1d] rounded-lg p-3 border border-[#ff24e4]/20 mb-6 text-center">
                <p className="font-mono text-xs text-[#849495] mb-1">CURRENT LEVEL</p>
                <p className="font-sora text-lg font-bold text-[#36fd0f] tracking-wide">LVL 42</p>
              </div>

              <nav className="flex flex-col gap-2 flex-grow">
                <button 
                  onClick={() => { setActiveTab('menu'); setDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-sora font-medium text-sm text-left transition-colors ${activeTab === 'menu' ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30' : 'text-[#e5e1e4] hover:bg-white/5'}`}
                >
                  <Compass className="w-5 h-5 text-[#fface8]" />
                  <span>Arcade Menu</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('play'); setDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-sora font-medium text-sm text-left transition-colors ${activeTab === 'play' ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30' : 'text-[#e5e1e4] hover:bg-white/5'}`}
                >
                  <Play className="w-5 h-5 text-[#a3f00e]" />
                  <span>Execute Mission</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('store'); setDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-sora font-medium text-sm text-left transition-colors ${activeTab === 'store' ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30' : 'text-[#e5e1e4] hover:bg-white/5'}`}
                >
                  <ShoppingBag className="w-5 h-5 text-[#ff24e4]" />
                  <span>NeonSharks Customs Shop</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('leaderboard'); setDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-sora font-medium text-sm text-left transition-colors ${activeTab === 'leaderboard' ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30' : 'text-[#e5e1e4] hover:bg-white/5'}`}
                >
                  <Trophy className="w-5 h-5 text-[#00dce6]" />
                  <span>Global Ranking</span>
                </button>
              </nav>

              <div className="mt-auto pt-4 border-t border-[#3a494b]">
                <button 
                  onClick={() => { setSettingsOpen(true); setDrawerOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2 w-full rounded-md text-xs font-mono text-[#849495] hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                  <span>Terminal Configuration</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DYNAMIC SCROLLABLE WRAPPER */}
      <main className="flex-grow pt-14 pb-14 px-3 md:pt-20 md:pb-24 md:px-4 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md flex flex-col items-center py-4"
            >
              {/* HERO LOGO */}
              <div className="w-full flex flex-col items-center text-center mb-8">
                <div className="relative mb-3">
                  <h2 className="font-sora text-4xl font-extrabold tracking-widest text-[#00f3ff] animate-flicker">
                    NEON SHARDS
                  </h2>
                  <div className="absolute -bottom-1 right-0 bg-[#ff24e4] px-2 py-0.5 rounded-sm shadow-md">
                    <span className="font-mono text-[9px] font-bold text-white uppercase tracking-wider">
                      BREAKER
                    </span>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-[#849495] mt-4 tracking-widest">
                  NeonSharks Pilot Terminal Alpha-42
                </p>
              </div>

              {/* BENTO MENU GRIDS */}
              <div className="w-full flex flex-col gap-4">
                {/* START GAME BUTTON */}
                <button 
                  onClick={() => startGame(0)}
                  className="w-full bg-[#00f3ff]/10 border-2 border-[#00f3ff] p-5 rounded-xl flex items-center justify-between group hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-98 transition-all hover:brightness-110 cursor-pointer"
                >
                  <div className="text-left">
                    <span className="font-mono text-xs font-bold text-[#ff24e4] block mb-1">EXECUTE MISSION</span>
                    <span className="font-sora text-xl font-extrabold text-[#00f3ff] tracking-wide">START GAME</span>
                  </div>
                  <div className="bg-[#00f3ff] text-[#050505] rounded-full p-2 group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 fill-current" />
                  </div>
                </button>

                {/* CAMPAIGN LEVEL SELECTOR */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => startGame(0)}
                    className="bg-[#1c1b1d]/80 backdrop-blur-md p-4 rounded-xl flex flex-col items-start gap-2 border border-[#3a494b] hover:border-[#ff24e4] hover:bg-white/5 active:scale-95 transition-all"
                  >
                    <Compass className="w-6 h-6 text-[#fface8]" />
                    <span className="font-sora text-sm font-bold text-white text-left">Nebula Gate</span>
                    <span className="font-mono text-[9px] text-[#849495]">LEVEL 01 • EASY</span>
                  </button>

                  <button 
                    onClick={() => startGame(1)}
                    className="bg-[#1c1b1d]/80 backdrop-blur-md p-4 rounded-xl flex flex-col items-start gap-2 border border-[#3a494b] hover:border-[#ff24e4] hover:bg-white/5 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-6 h-6 text-[#00dce6]" />
                    <span className="font-sora text-sm font-bold text-white text-left">Quantum Void</span>
                    <span className="font-mono text-[9px] text-[#849495]">LEVEL 02 • MEDIUM</span>
                  </button>
                </div>

                {/* TUTORIAL INFO CARDS */}
                <button 
                  onClick={() => {
                    setIsPlaying(true);
                    startGame(0);
                    alert("FLIGHT ACADEMY: Use arrow keys (Desktop) or touch panels (Mobile) to navigate the NeonSharks paddle!");
                  }}
                  className="bg-[#1c1b1d]/80 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 border border-[#3a494b] w-full text-left transition-all active:scale-98"
                >
                  <div className="bg-[#353437] p-2 rounded-lg text-[#00f3ff]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <span className="font-sora text-sm font-bold text-white">Flight Academy</span>
                    <span className="font-mono text-[10px] text-[#849495]">Defeat obstacles with precision</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#849495]" />
                </button>

                {/* ACTIVE SHIP CONTAINER */}
                <div className="bg-[#1c1b1d]/60 backdrop-blur-md p-5 rounded-xl border border-[#00f3ff]/20 relative overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-10">
                    <Zap className="w-20 h-20 text-[#00f3ff]" />
                  </div>

                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="font-mono text-[10px] text-[#ff24e4] tracking-widest mb-1">CURRENT SHARK</p>
                      <div className="flex items-center gap-2">
                        <span className="font-sora text-md font-bold text-[#e5e1e4] uppercase">{equippedVaus.name}</span>
                        <span className="w-2 h-2 rounded-full bg-[#36fd0f] animate-pulse"></span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab('store')}
                      className="text-[#fface8] font-mono hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase border border-[#fface8]/40 px-2 py-1 rounded"
                    >
                      Store <ShoppingBag className="w-3 h-3" />
                    </button>
                  </div>

                  {/* MINI SHIP PREVIEW ANIMATION */}
                  <div className="h-20 bg-black/40 rounded-lg flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                    <motion.div 
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-24 h-4 rounded-full border shadow-lg flex items-center justify-between px-3"
                      style={{ 
                        borderColor: equippedVaus.color, 
                        boxShadow: equippedVaus.glowColor,
                        background: `linear-gradient(90deg, ${equippedVaus.color} 0%, ${equippedVaus.secondaryColor} 50%, ${equippedVaus.color} 100%)`
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/35"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/35"></span>
                    </motion.div>
                    <span className="font-mono text-[9px] text-[#849495] mt-2">CAPSULE CORE SYNCHRONIZED</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PLAY / GAMEPLAY TAB */}
          {activeTab === 'play' && (
            <motion.div 
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col"
            >
              {/* HUD INTERFACE */}
              <div className="flex justify-between items-center mb-3 md:mb-4 gap-2">
                <div className="bg-[#1c1b1d]/85 backdrop-blur-md border border-[#00f3ff]/30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg flex flex-col min-w-[85px] md:min-w-[110px]">
                  <span className="font-mono text-[8px] md:text-[9px] text-[#00f3ff] uppercase tracking-widest leading-none mb-1">SCORE</span>
                  <span className="font-mono text-sm md:text-base font-bold text-[#e5e1e4] leading-none">
                    {score.toString().padStart(8, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#1c1b1d]/60 border border-[#3a494b]/35 px-2 py-1 rounded-lg">
                  <div className="font-mono text-[9px] md:text-[10px] uppercase bg-[#ff24e4]/10 border border-[#ff24e4]/30 text-[#fface8] px-2 py-0.5 rounded-full animate-pulse font-bold">
                    LVL {currentLevelIndex + 1}
                  </div>
                  {isPlaying && !isPaused && (
                    <button
                      onClick={() => setIsPaused(true)}
                      className="p-1 rounded bg-[#ff24e4]/15 border border-[#ff24e4]/30 hover:border-[#ff24e4] text-[#fface8] hover:text-white transition-all active:scale-90 cursor-pointer"
                      title="Pause Campaign"
                    >
                      {/* PAUSE GLYPH */}
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="4" height="16" />
                        <rect x="16" y="4" width="4" height="16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="bg-[#1c1b1d]/85 backdrop-blur-md border border-[#ff24e4]/30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg flex flex-col items-end min-w-[85px] md:min-w-[110px]">
                  <span className="font-mono text-[8px] md:text-[9px] text-[#fface8] uppercase tracking-widest leading-none mb-1">LIVES</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((heart) => (
                      <span 
                        key={heart} 
                        className={`font-mono text-xs md:text-sm leading-none transition-all duration-300 ${heart <= lives ? 'text-[#ff24e4] scale-110 drop-shadow-[0_0_4px_#ff24e4]' : 'text-gray-600 opacity-30'}`}
                      >
                        ❤
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* GAME SCREEN CANVAS STAGE */}
              <div className="relative w-full aspect-[6/7.2] bg-[#050505] rounded-xl border-2 border-[#3a494b] overflow-hidden group shadow-2xl shadow-[#ff24e4]/10">
                
                {/* MAIN RETRO CANVAS */}
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={720}
                  className="w-full h-full block touch-none cursor-ew-resize"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />

                {/* GAME OVER AND WELCOME OVERLAYS */}
                <AnimatePresence>
                  {!isPlaying && !showGameSummary && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#131315]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                    >
                      <Zap className="w-12 h-12 text-[#ff24e4] animate-bounce mb-3" />
                      <h3 className="font-sora text-xl font-extrabold text-white mb-2">READY PILOT</h3>
                      <p className="font-mono text-xs text-[#849495] mb-6 max-w-[240px]">
                        Select campaign block levels, bounce neon energy loops, and collect NeonSharks currency.
                      </p>

                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <button 
                          onClick={() => startGame(0)}
                          className="py-3 bg-[#00f3ff] text-black font-sora font-extrabold text-xs tracking-wider rounded-lg text-center cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_#00f3ff]"
                        >
                          LAUNCH CAMPAIGN
                        </button>
                        <button 
                          onClick={() => setActiveTab('menu')}
                          className="py-2.5 bg-[#353437] text-white font-mono text-xs tracking-wider rounded-lg text-center cursor-pointer hover:bg-[#39393b] active:scale-95 transition-all"
                        >
                          BACK TO MENU
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* GAME COMPLETE SUMMARY OVERLAY */}
                  {showGameSummary && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20"
                    >
                      <div className="w-16 h-16 rounded-full bg-[#1c1b1d] border-2 border-[#ff24e4] flex items-center justify-center mb-4 mx-auto">
                        {showGameSummary === 'won' ? (
                          <Award className="w-8 h-8 text-[#36fd0f] drop-shadow-[0_0_8px_#36fd0f]" />
                        ) : (
                          <X className="w-8 h-8 text-[#ff24e4]" />
                        )}
                      </div>

                      <h3 className="font-sora text-2xl font-extrabold tracking-wide text-white mb-1">
                        {showGameSummary === 'won' ? 'MISSION SUCCESS' : 'SYSTEM OFFLINE'}
                      </h3>
                      <p className="font-mono text-[9px] text-[#849495] tracking-widest uppercase mb-4">
                        NEONSHARKS TERMINAL REPORT
                      </p>

                      <div className="bg-[#1c1b1d] border border-[#3a494b] p-4 rounded-lg w-full max-w-[260px] flex flex-col gap-2 mb-6">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-[#849495]">SCORE RECOVERY:</span>
                          <span className="text-[#00f3ff] font-bold">{score} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-[#849495]">CREDITS OBTAINED:</span>
                          <span className="text-[#36fd0f] font-bold">+{gameCreditsEarned} Cr</span>
                        </div>
                        {showGameSummary === 'won' ? (
                          <div className="flex justify-between items-center text-[10px] font-mono text-[#ff24e4]">
                            <span>CAMPAIGN CLEAR BONUS:</span>
                            <span>+2000 Cr</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2 w-full max-w-[240px]">
                        <button 
                          onClick={() => startGame(currentLevelIndex)}
                          className="flex-1 py-3 bg-[#00f3ff] text-[#050505] font-sora font-extrabold text-xs tracking-wider rounded-lg active:scale-95 transition-all text-center cursor-pointer shadow-[0_0_10px_#00f3ff]"
                        >
                          RETRY MISSION
                        </button>
                        <button 
                          onClick={() => {
                            if (showGameSummary === 'won' && currentLevelIndex < levels.length - 1) {
                              startGame(currentLevelIndex + 1);
                            } else {
                              setActiveTab('menu');
                            }
                          }}
                          className="flex-1 py-3 bg-[#353437] text-white font-mono text-xs tracking-wider rounded-lg active:scale-95 transition-all text-center cursor-pointer"
                        >
                          {showGameSummary === 'won' && currentLevelIndex < levels.length - 1 ? 'NEXT LEVEL' : 'RETURN MENU'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PAUS CODE STAGE OVERLAYS (WHILE PLAYING) */}
                {isPlaying && isPaused && (
                  <div className="absolute inset-0 bg-[#131315]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                    <h3 className="font-sora text-xl font-bold text-[#00f3ff] mb-4 tracking-wider">GAME SUSPENDED</h3>
                    <div className="flex flex-col gap-2 w-full max-w-[160px]">
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="py-2.5 bg-[#00f3ff] text-black font-sora font-extrabold text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        CONTINUE
                      </button>
                      <button 
                        onClick={() => { setIsPlaying(false); setShowGameSummary(null); }}
                        className="py-2.5 bg-red-600 text-white font-mono text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        ABORT MISSION
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CONTROLS GUIDE PANEL & INTERACTIVE TOUCH SENSORS */}
              <div className="mt-4 p-3 bg-[#1c1b1d]/80 rounded-xl border border-[#3a494b] text-center flex justify-between items-center">
                <p className="font-mono text-[10px] text-[#849495] tracking-wide text-left">
                  💻 DESKTOP: Use <span className="text-[#00f3ff] font-bold">A / D</span>, <span className="text-[#00f3ff] font-bold">← / →</span>, or drag with mouse.<br/>
                  📱 MOBILE: Drag directly on screen, or use buttons below.
                </p>

                {isPlaying ? (
                  <button 
                    onClick={() => setIsPaused(true)}
                    className="p-2 border border-[#849495]/40 rounded text-xs font-mono text-[#849495] hover:text-white"
                  >
                    Hold
                  </button>
                ) : null}
              </div>

              {/* INDEPENDENT CONTROL SENSORS ON THE FOOTER BLOCK */}
              <div className="mt-2 grid grid-cols-2 gap-4 h-20 md:h-16 w-full relative z-10 touch-none">
                <button 
                  onMouseDown={() => { stateRef.current.paddleTouchDirection = 'left'; }}
                  onMouseUp={() => { stateRef.current.paddleTouchDirection = null; }}
                  onTouchStart={(e) => { e.preventDefault(); stateRef.current.paddleTouchDirection = 'left'; }}
                  onTouchEnd={(e) => { e.preventDefault(); stateRef.current.paddleTouchDirection = null; }}
                  className="bg-gradient-to-r from-[#00f3ff]/5 to-[#00f3ff]/10 border border-[#00f3ff]/25 active:border-[#00f3ff] active:bg-[#00f3ff]/20 text-xs text-[#00f3ff]/80 active:text-[#00f3ff] rounded-xl flex items-center justify-center gap-2 font-mono font-bold tracking-wider cursor-pointer shadow-[inset_0_0_10px_rgba(0,243,255,0.05)] active:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all select-none"
                >
                  ◀ STEER LEFT
                </button>

                <button 
                  onMouseDown={() => { stateRef.current.paddleTouchDirection = 'right'; }}
                  onMouseUp={() => { stateRef.current.paddleTouchDirection = null; }}
                  onTouchStart={(e) => { e.preventDefault(); stateRef.current.paddleTouchDirection = 'right'; }}
                  onTouchEnd={(e) => { e.preventDefault(); stateRef.current.paddleTouchDirection = null; }}
                  className="bg-gradient-to-l from-[#ff24e4]/5 to-[#ff24e4]/10 border border-[#ff24e4]/25 active:border-[#ff24e4] active:bg-[#ff24e4]/20 text-xs text-[#ff24e4]/80 active:text-[#ff24e4] rounded-xl flex items-center justify-center gap-2 font-mono font-bold tracking-wider cursor-pointer shadow-[inset_0_0_10px_rgba(255,36,228,0.05)] active:shadow-[0_0_15px_rgba(255,36,228,0.3)] transition-all select-none"
                >
                  STEER RIGHT ▶
                </button>
              </div>
            </motion.div>
          )}

          {/* CUSTOM STORE TAB */}
          {activeTab === 'store' && (
            <motion.div 
              key="store"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md flex flex-col py-2"
            >
              {/* STORE TITLE BLOCK */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="font-mono text-[9px] text-[#ff24e4] uppercase tracking-widest mb-1">Customization</p>
                  <h2 className="font-sora text-2xl font-extrabold text-white">NEONSHARKS STORE</h2>
                </div>
                <div className="bg-[#1c1b1d] px-3 py-1.5 rounded-full border border-[#ff24e4]/30 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#ff24e4]" />
                  <span className="font-mono text-sm font-bold text-[#ff24e4]">
                    {credits.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* FILTER HORIZONTAL CHIPS */}
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                <button 
                  onClick={() => setActiveStoreFilter('all')}
                  className={`px-4 py-1.5 rounded-full border font-mono text-[10px] whitespace-nowrap transition-colors ${activeStoreFilter === 'all' ? 'border-[#ff24e4] bg-[#ff24e4]/10 text-[#ff24e4]' : 'border-[#3a494b] text-[#849495] hover:bg-white/5'}`}
                >
                  ALL ITEMS
                </button>
                <button 
                  onClick={() => setActiveStoreFilter('paddles')}
                  className={`px-4 py-1.5 rounded-full border font-mono text-[10px] whitespace-nowrap transition-colors ${activeStoreFilter === 'paddles' ? 'border-[#ff24e4] bg-[#ff24e4]/10 text-[#ff24e4]' : 'border-[#3a494b] text-[#849495] hover:bg-white/5'}`}
                >
                  PADDLES
                </button>
                <button 
                  className="px-4 py-1.5 rounded-full border border-gray-800 text-gray-600 font-mono text-[10px] whitespace-nowrap cursor-not-allowed"
                  disabled
                >
                  EFFECTS (LVL 50)
                </button>
                <button 
                  className="px-4 py-1.5 rounded-full border border-gray-800 text-gray-600 font-mono text-[10px] whitespace-nowrap cursor-not-allowed"
                  disabled
                >
                  SOUNDS (LVL 60)
                </button>
              </div>

              {/* CARDS LISTING FOR SKINS */}
              <div className="grid grid-cols-1 gap-4">
                {paddles
                  .filter(p => activeStoreFilter === 'all' || activeStoreFilter === 'paddles')
                  .map((skin) => (
                    <div 
                      key={skin.id}
                      className={`bg-[#1c1b1d]/85 backdrop-blur-md rounded-xl p-4 border flex flex-col gap-4 relative overflow-hidden group hover:border-[#ff24e4]/50 transition-colors ${skin.equipped ? 'border-[#ff24e4]' : 'border-[#3a494b]'}`}
                    >
                      {skin.equipped && (
                        <div className="absolute top-0 right-0 bg-[#ff24e4] px-3 py-1 font-mono text-[8px] font-bold text-white rounded-bl-xl uppercase">
                          EQUIPPED
                        </div>
                      )}

                      {/* ROTATE GRAPHICS PREVIEW WINDOW */}
                      <div className="h-28 bg-black/50 rounded-lg border border-[#3a494b]/30 flex flex-col justify-center items-center relative overflow-hidden">
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
                          className="w-28 h-3.5 rounded-full relative flex items-center justify-between px-3"
                          style={{
                            background: `linear-gradient(90deg, ${skin.color} 0%, ${skin.secondaryColor} 50%, ${skin.color} 100%)`,
                            boxShadow: skin.glowColor,
                            width: `${90 * skin.widthMultiplier}px`
                          }}
                        >
                          <span className="w-1 h-2 bg-white/20 rounded-full"></span>
                          <span className="w-1 h-2 bg-white/20 rounded-full"></span>
                        </motion.div>
                      </div>

                      {/* META DESCRIPTION FOR SKIN */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-sora text-base font-extrabold text-white">{skin.name}</h3>
                          {!skin.unlocked && (
                            <div className="flex items-center gap-1 text-[#ff24e4]">
                              <Coins className="w-3.5 h-3.5" />
                              <span className="font-mono text-xs font-bold">{skin.price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[#849495] text-xs leading-relaxed">{skin.description}</p>
                      </div>

                      {/* ACTION TRIGGERS BUTTONS */}
                      {skin.equipped ? (
                        <button className="w-full py-2.5 bg-[#353437] border border-[#ff24e4]/40 text-[#fface8] font-mono text-xs font-bold rounded-lg cursor-default opacity-80 uppercase tracking-widest">
                          ALREADY EQUIPPED
                        </button>
                      ) : skin.unlocked ? (
                        <button 
                          onClick={() => equipPaddle(skin.id)}
                          className="w-full py-2.5 bg-transparent border-2 border-[#00f3ff] text-[#00f3ff] font-sora font-bold text-xs rounded-lg active:scale-95 transition-all hover:bg-[#00f3ff]/10 uppercase tracking-wider cursor-pointer"
                        >
                          EQUIP VEHICLE
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (credits >= skin.price) {
                              buyPaddle(skin.id, skin.price);
                            } else {
                              alert("INSUFFICIENT FUNDS: Mine more credits by destroying blocks or complete missions!");
                            }
                          }}
                          className={`w-full py-2.5 font-sora font-bold text-xs rounded-lg transition-all uppercase tracking-wider ${credits >= skin.price ? 'bg-[#ff24e4] text-white hover:shadow-[0_0_12px_#ff24e4] cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                          PURCHASE &amp; EQUIP
                        </button>
                      )}
                    </div>
                ))}
              </div>

              {/* CURRENCY MINING EXTRA SYSTEM */}
              <div className="mt-6 p-4 rounded-xl border border-[#3a494b] bg-[#0e0e10]/95 flex flex-col gap-3">
                <h4 className="font-mono text-xs font-bold text-white flex items-center gap-2 border-b border-[#3a494b] pb-2">
                  <Info className="w-4 h-4 text-[#ff24e4]" />
                  HOW TO GET CURRENCY
                </h4>
                <p className="font-sans text-xs text-[#849495] leading-relaxed">
                  Earn <span className="text-[#ff24e4] font-bold font-mono">Credits</span> directly by destroying block arrays inside active missions. Win clear stages to receive massive block master multipliers!
                </p>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    onClick={handleWatchAd}
                    className="flex-1 bg-white/5 hover:bg-white/10 active:scale-95 p-3 rounded-lg flex flex-col items-center gap-1 border border-[#3a494b] font-mono text-[9px] text-[#00f3ff] uppercase transition-colors cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-[#00f3ff]" />
                    <span>Watch Arcade Video (+500)</span>
                  </button>

                  <button 
                    onClick={handleBuyCredits}
                    className="flex-1 bg-white/5 hover:bg-white/10 active:scale-95 p-3 rounded-lg flex flex-col items-center gap-1 border border-[#3a494b] font-mono text-[9px] text-[#ff24e4] uppercase transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#ff24e4]" />
                    <span>Direct Load (+2000)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* DYNAMIC LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md flex flex-col py-2"
            >
              {/* TITLE SECTION */}
              <section className="mb-6">
                <div className="flex items-end justify-between mb-2">
                  <h2 className="font-sora text-3xl font-extrabold text-[#00f3ff] leading-none">LEADERBOARD</h2>
                  <span className="font-mono text-[10px] text-[#ff24e4] uppercase animate-pulse tracking-widest font-bold">
                    LIVE_RECORDS
                  </span>
                </div>
                <p className="font-sans text-xs text-[#849495] max-w-[85%] leading-relaxed">
                  The elite cockpit pilots of the Neon Shards Breaker NeonSharks fleet. Defeat bricks to index your name and score high into the terminal!
                </p>
              </section>

              {/* BENTO STATISTICS PANEL */}
              <section className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1c1b1d]/85 backdrop-blur-md p-4 rounded-xl flex flex-col justify-between h-28 border-l-4 border-[#00f3ff]">
                  <span className="font-mono text-[9px] text-[#849495] uppercase">Active Fleet</span>
                  <div className="font-mono text-lg font-bold text-[#00f3ff]">12,402</div>
                  <p className="font-sans text-[10px] text-[#36fd0f] flex items-center">
                    ★ +12% vs last week
                  </p>
                </div>

                <div className="bg-[#1c1b1d]/85 backdrop-blur-md p-4 rounded-xl flex flex-col justify-between h-28 border-l-4 border-[#ff24e4]">
                  <span className="font-mono text-[9px] text-[#849495] uppercase">Next Reward</span>
                  <div className="font-mono text-sm font-bold text-[#ff24e4]">LVL 45 BONUS</div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#ff24e4] h-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </section>

              {/* USER RANKINGS LIST */}
              <section className="space-y-3">
                <div className="flex items-center px-4 font-mono text-[9px] text-[#849495] uppercase">
                  <span className="w-8">#</span>
                  <span className="flex-grow">Pilot</span>
                  <span className="w-24 text-right">Score</span>
                </div>

                <div className="flex flex-col gap-2">
                  {leaderboard.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-center p-3 rounded-lg border transition-colors ${item.isYou ? 'bg-[#ff24e4]/5 border-[#ff24e4]/40 shadow-[0_0_10px_rgba(255,36,228,0.1)]' : 'bg-[#1c1b1d]/80 border-[#3a494b]/50'}`}
                    >
                      {/* RANK POSITION */}
                      <div className={`w-8 font-mono text-sm font-bold ${item.isVIP ? 'text-[#36fd0f]' : item.isYou ? 'text-[#00f3ff]' : 'text-[#849495]'}`}>
                        {item.rank}
                      </div>

                      {/* PILOT AVATAR & METRICS */}
                      <div className="flex items-center flex-grow gap-3">
                        <div className="relative w-10 h-10 rounded-full border border-[#3a494b] overflow-hidden bg-black flex-shrink-0">
                          <img 
                            src={item.avatar} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {item.isYou && (
                            <div className="absolute -top-1 -right-1 bg-[#00f3ff] text-black font-extrabold text-[8px] rounded-full w-4 h-4 flex items-center justify-center border border-black font-mono">
                              YA
                            </div>
                          )}
                        </div>

                        <div>
                          <div className={`font-sora text-sm font-bold flex items-center gap-1.5 ${item.isYou ? 'text-[#00f3ff]' : 'text-white'}`}>
                            {item.name}
                            {item.isVIP && (
                              <span className="text-[8px] uppercase bg-[#36fd0f] text-black font-extrabold px-1 py-0.2 rounded font-mono">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[9px] text-[#849495] uppercase">{item.levelText}</p>
                        </div>
                      </div>

                      {/* SCORE */}
                      <div className="w-24 text-right font-mono text-xs font-bold text-white tracking-wide">
                        {item.score.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#3a494b] to-transparent" />
                  <button 
                    onClick={() => {
                      alert("TERMINAL MESSAGE: Fully populated to maximum current sector ranks!");
                    }}
                    className="mx-4 font-mono text-xs text-[#ff24e4] hover:text-white transition-colors"
                  >
                    LOAD MORE RECORDS
                  </button>
                  <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#3a494b] to-transparent" />
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* TERMINAL SETTINGS PANEL */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1b1d] border border-[#ff24e4]/30 rounded-xl p-6 w-full max-w-sm flex flex-col gap-4 text-center relative"
            >
              <button 
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 text-[#849495] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <Settings className="w-10 h-10 text-[#00f3ff] mx-auto animate-spin" />
              <h3 className="font-sora text-lg font-extrabold text-white">SETTING CONFIGS</h3>
              <p className="font-mono text-[9px] text-[#849495] uppercase">BOARD PARAMETER CALIBRATION</p>

              {/* TOGGLES */}
              <div className="flex flex-col gap-4 text-left mt-2">
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-[#3a494b]/40">
                  <div className="flex flex-col">
                    <span className="font-sora text-sm font-bold text-white">Audio Synthesizer</span>
                    <span className="font-mono text-[9px] text-[#849495]">Classic arcade soundwaves</span>
                  </div>
                  <button 
                    onClick={() => {
                      const enabled = !soundEnabled;
                      setSoundEnabled(enabled);
                      sfx.enabled = enabled;
                      saveSettings(enabled, difficulty);
                    }}
                    className={`p-2 rounded-lg border transition-colors ${soundEnabled ? 'border-[#ff24e4] text-[#fface8] bg-[#ff24e4]/10' : 'border-gray-700 text-gray-500'}`}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex flex-col gap-2 bg-black/40 p-3 rounded-lg border border-[#3a494b]/40">
                  <div className="flex flex-col mb-1">
                    <span className="font-sora text-sm font-bold text-white">Speed Difficulty</span>
                    <span className="font-mono text-[9px] text-[#849495]">Regulates ball initial impulse</span>
                  </div>
                  <div className="flex gap-2">
                    {['easy', 'normal', 'hard'].map((diff) => (
                      <button 
                        key={diff}
                        onClick={() => {
                          setDifficulty(diff as any);
                          saveSettings(soundEnabled, diff as any);
                        }}
                        className={`flex-1 py-1.5 font-mono text-[10px] rounded uppercase border text-center transition-all ${difficulty === diff ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10 font-bold' : 'border-[#3a494b] text-[#849495] hover:bg-white/5'}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RESET SAVE DATA */}
              <button 
                onClick={() => {
                  if (confirm("WARNING: Are you absolutely sure about erasing credentials storage? All credits and ships purchased will return to initial presets!")) {
                    localStorage.clear();
                    setCredits(12450);
                    setPaddles([
                      {
                        id: 'classic',
                        name: 'Classic NeonSharks',
                        description: 'The original interceptor. Reliable and sleek.',
                        price: 0,
                        color: '#00f3ff',
                        secondaryColor: '#ffffff',
                        widthMultiplier: 1.0,
                        glowColor: '0 0 10px rgba(0, 243, 255, 0.8)',
                        unlocked: true,
                        equipped: true
                      },
                      {
                        id: 'magenta',
                        name: 'Magenta Fury',
                        description: 'High-intensity glow with vibrant trailing light.',
                        price: 2500,
                        color: '#ff24e4',
                        secondaryColor: '#ffffff',
                        widthMultiplier: 1.0,
                        glowColor: '0 0 10px rgba(255, 36, 228, 0.8)',
                        unlocked: false,
                        equipped: false
                      },
                      {
                        id: 'emerald',
                        name: 'Emerald Shield',
                        description: 'Industrial grade heavy plating with eco-glow.',
                        price: 5000,
                        color: '#36fd0f',
                        secondaryColor: '#e8ffda',
                        widthMultiplier: 1.25,
                        glowColor: '0 0 12px rgba(54, 253, 15, 0.8)',
                        unlocked: false,
                        equipped: false
                      },
                      {
                        id: 'ghost',
                        name: 'Ghost Interceptor',
                        description: 'Futuristic alpha-shielded holographic interceptor.',
                        price: 12000,
                        color: '#e3fdff',
                        secondaryColor: '#849495',
                        widthMultiplier: 1.1,
                        glowColor: '0 0 15px rgba(227, 253, 255, 0.9)',
                        unlocked: false,
                        equipped: false
                      }
                    ]);
                    setSettingsOpen(false);
                    alert("DATA CLEARED: Master memory banks recycled.");
                  }
                }}
                className="mt-2 py-2 flex items-center justify-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-[10px] rounded uppercase cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sector Data</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSISTENT BOTTOM NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-[#1c1b1d]/85 backdrop-blur-md border-t border-[#3a494b]/60 flex justify-around items-center h-16 pb-safe shadow-2xl">
        <button 
          onClick={() => {
            if (activeTab !== 'play') {
              setActiveTab('play');
            } else if (!isPlaying) {
              startGame(0);
            }
          }}
          className={`flex flex-col items-center justify-center rounded-full p-2.5 transition-all text-sm ${activeTab === 'play' ? 'bg-[#ff24e4]/15 text-[#ff24e4] border border-[#ff24e4]/40 scale-105 shadow-[0_0_15px_rgba(255,36,228,0.2)]' : 'text-[#849495] hover:text-white'}`}
          id="tab-play-game"
        >
          <Play className="w-5 h-5 fill-current" />
        </button>

        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center rounded-full p-2.5 transition-all text-sm ${activeTab === 'leaderboard' ? 'bg-[#ff24e4]/15 text-[#ff24e4] border border-[#ff24e4]/40 scale-105 shadow-[0_0_15px_rgba(255,36,228,0.2)]' : 'text-[#849495] hover:text-white'}`}
          id="tab-leaderboard"
        >
          <Trophy className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setActiveTab('store')}
          className={`flex flex-col items-center justify-center rounded-full p-2.5 transition-all text-sm ${activeTab === 'store' ? 'bg-[#ff24e4]/15 text-[#ff24e4] border border-[#ff24e4]/40 scale-105 shadow-[0_0_15px_rgba(255,36,228,0.2)]' : 'text-[#849495] hover:text-white'}`}
          id="tab-store"
        >
          <ShoppingBag className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center rounded-full p-2.5 transition-all text-sm ${activeTab === 'menu' ? 'bg-[#ff24e4]/15 text-[#ff24e4] border border-[#ff24e4]/40 scale-105 shadow-[0_0_15px_rgba(255,36,228,0.2)]' : 'text-[#849495] hover:text-white'}`}
          id="tab-control-menu"
        >
          <User className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}
