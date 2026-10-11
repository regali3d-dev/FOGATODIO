import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { soundEngine } from './audio/SoundEngine';
import { FaceUploadScreen } from './components/FaceUploadScreen';
import { GameHUD } from './components/GameHUD';
import { LandingScreen } from './components/LandingScreen';
import { MobileControls } from './components/MobileControls';
import { PaymentModal } from './components/PaymentModal';
import { SummaryScreen } from './components/SummaryScreen';
import { HitResult, RageRoomScene } from './game/RageRoomScene';
import { DestructionStats, FloatingText, GameState, LeaderboardEntry, SessionTier, WeaponType } from './types/game';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Viper_Rage', score: 18450, smashed: 38, date: '2026-09-28', tier: 'carnage' },
  { id: '2', name: 'SledgeKing', score: 14200, smashed: 31, date: '2026-09-28', tier: 'carnage' },
  { id: '3', name: 'Demolisher99', score: 9850, smashed: 22, date: '2026-09-29', tier: 'blitz' },
  { id: '4', name: 'Marco_Smash', score: 7400, smashed: 17, date: '2026-09-29', tier: 'blitz' },
  { id: '5', name: 'FuryStrike', score: 5900, smashed: 14, date: '2026-09-29', tier: 'blitz' },
];

const INITIAL_STATS: DestructionStats = {
  totalSmashed: 0,
  totalDamage: 0,
  highestCombo: 0,
  byCategory: {
    tv: 0,
    bottle: 0,
    furniture: 0,
    ceramic: 0,
    window: 0,
    electronics: 0,
    appliance: 0,
    extinguisher: 0,
    printer: 0,
    barrel: 0,
    guitar: 0,
    sanitary: 0,
    carboy: 0,
    telephone: 0,
    plantpot: 0,
    lamp: 0,
    mannequin: 0,
    tires: 0,
  },
  weaponUsed: 'bat',
  elapsedSeconds: 0,
  tier: 'blitz',
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<RageRoomScene | null>(null);

  // Game States
  const [gameState, setGameState] = useState<GameState>('title');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('bat');
  const [sessionTier, setSessionTier] = useState<SessionTier>('blitz');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [smashedCount, setSmashedCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [stats, setStats] = useState<DestructionStats>(INITIAL_STATS);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [showHitMarker, setShowHitMarker] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [showRestockBanner, setShowRestockBanner] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);

  // Free Credits & Room Cleared States
  const [freeCredits, setFreeCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sfogatoio_free_credits_v1');
      return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });
  const [remainingProps, setRemainingProps] = useState<number>(0);
  const [totalWaveProps, setTotalWaveProps] = useState<number>(0);
  const [showRoomClearedBanner, setShowRoomClearedBanner] = useState<boolean>(false);
  const [earnedFreeCreditInSession, setEarnedFreeCreditInSession] = useState<boolean>(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState<boolean>(false);
  const [stripeNotice, setStripeNotice] = useState<{ type: 'success' | 'cancelled' | 'info'; message: string } | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<{ blitz: string; custom_mannequins: string }>({
    blitz: 'https://buy.stripe.com/00wbJ39aie8lg7F7OBbII02',
    custom_mannequins: 'https://buy.stripe.com/aFa14p86e4xLbRp8SFbII01',
  });
  const [customTargetName, setCustomTargetName] = useState<string>('Bersaglio Personalizzato');
  const [customTargetImage, setCustomTargetImage] = useState<string | null>(null);

  const comboTimerRef = useRef<number | null>(null);
  const restockTimeoutRef = useRef<number | null>(null);
  const roomClearedTimeoutRef = useRef<number | null>(null);
  const sessionTierRef = useRef<SessionTier>(sessionTier);

  useEffect(() => {
    sessionTierRef.current = sessionTier;
  }, [sessionTier]);

  // Load configured payment links from server on mount
  useEffect(() => {
    fetch('/api/stripe-config')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.links) {
          setPaymentLinks({
            blitz: data.links.blitz || 'https://buy.stripe.com/00wbJ39aie8lg7F7OBbII02',
            custom_mannequins: data.links.custom_mannequins || 'https://buy.stripe.com/aFa14p86e4xLbRp8SFbII01',
          });
        }
      })
      .catch((e) => console.warn('Could not fetch stripe-config:', e));
  }, []);

  // Handle return from Stripe Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const returnedTier = params.get('tier');

    if (payment === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
      soundEngine.init();
      soundEngine.playPaymentChime();

      if (returnedTier === 'custom_mannequins' || sessionTierRef.current === 'custom_mannequins') {
        setSessionTier('custom_mannequins');
        sessionTierRef.current = 'custom_mannequins';
        setStripeNotice({
          type: 'success',
          message: 'Donazione di 2,00€ completata! Carica il volto per i tuoi manichini personalizzati.',
        });
        setGameState('face_upload');
      } else {
        setSessionTier('blitz');
        sessionTierRef.current = 'blitz';
        setStripeNotice({
          type: 'success',
          message: 'Pagamento Stripe completato (0,50€)! Camera di sfogo sbloccata.',
        });
        setTimeout(() => {
          startGame();
        }, 900);
      }
    } else if (payment === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setStripeNotice({
        type: 'cancelled',
        message: 'Pagamento Stripe annullato. Nessun addebito effettuato.',
      });
    }
  }, []);

  // Load Leaderboard & High Score from localStorage
  useEffect(() => {
    try {
      const savedScore = localStorage.getItem('sfogatoio_high_score');
      if (savedScore) {
        setHighScore(parseInt(savedScore, 10) || 0);
      }

      const savedLB = localStorage.getItem('sfogatoio_leaderboard_v1');
      if (savedLB) {
        const parsed = JSON.parse(savedLB);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeaderboard(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // Detect touch capability & mobile viewport
  useEffect(() => {
    const checkTouch = () => {
      if (typeof window === 'undefined') return false;
      return (
        'ontouchstart' in window ||
        Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        window.innerWidth <= 1024
      );
    };

    setIsTouchDevice(checkTouch());

    const onFirstTouch = () => setIsTouchDevice(true);
    window.addEventListener('touchstart', onFirstTouch, { passive: true });
    window.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        setIsTouchDevice(true);
      }
    });

    const onResize = () => {
      if (window.innerWidth <= 1024) {
        setIsTouchDevice(true);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('touchstart', onFirstTouch);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Initialize Three.js Rage Room Scene on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const rageScene = new RageRoomScene(canvasRef.current);
    sceneRef.current = rageScene;

    rageScene.onSmashCallback = (hit: HitResult) => {
      handlePropHit(hit);
    };

    rageScene.onPointerLockChange = (locked: boolean) => {
      setIsPointerLocked(locked);
    };

    rageScene.onPropsCountChange = (remaining: number, total: number) => {
      setRemainingProps(remaining);
      setTotalWaveProps(total);
    };

    rageScene.onRoomClearedCallback = () => {
      // User smashed 100% of props before time ran out! Reward +1 Free Token (Gettone Gratis)
      setFreeCredits((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('sfogatoio_free_credits_v1', next.toString());
        } catch (e) {}
        return next;
      });
      setEarnedFreeCreditInSession(true);
      setShowRoomClearedBanner(true);

      // IL PUNTEGGIO DEVE CONTINUARE: Aggiunge tempo bonus per continuare la scalata del punteggio!
      const bonusSeconds = sessionTierRef.current === 'carnage' ? 180 : 60;
      setTimeLeft((prev) => prev + bonusSeconds);

      // Bonus Punteggio En Plein: +2500 punti cumulati direttamente allo score attivo!
      const bonusPts = 2500;
      setScore((prev) => prev + bonusPts);
      setStats((prev) => ({
        ...prev,
        totalDamage: prev.totalDamage + 1000,
      }));

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2 - 40;
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: `token_bonus_${Date.now()}`,
          text: `+${bonusPts} GETTONE GRATIS! IL PUNTEGGIO CONTINUA!`,
          x: cx,
          y: cy,
          color: '#10b981',
          scale: 1.5,
          opacity: 1,
          createdAt: Date.now(),
        },
      ]);

      try {
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.35 },
          colors: ['#10b981', '#fbbf24', '#f59e0b', '#ef4444', '#3b82f6', '#ffffff'],
        });
      } catch (e) {}

      if (roomClearedTimeoutRef.current) clearTimeout(roomClearedTimeoutRef.current);
      roomClearedTimeoutRef.current = window.setTimeout(() => {
        setShowRoomClearedBanner(false);
      }, 3500);
    };

    rageScene.onRestockCallback = () => {
      setShowRestockBanner(true);
      if (restockTimeoutRef.current) clearTimeout(restockTimeoutRef.current);
      restockTimeoutRef.current = window.setTimeout(() => {
        setShowRestockBanner(false);
      }, 2500);
    };

    return () => {
      rageScene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Sync selected weapon to 3D scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.equipWeapon(selectedWeapon);
    }
  }, [selectedWeapon]);

  // Floating text lifetime cleaner
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingTexts((prev) =>
        prev
          .filter((item) => now - item.createdAt < 900)
          .map((item) => ({
            ...item,
            y: item.y - 1.2,
            opacity: Math.max(0, 1 - (now - item.createdAt) / 900),
          }))
      );
    }, 30);
    return () => clearInterval(interval);
  }, [floatingTexts.length]);

  // Countdown Timer Loop (60s for blitz, 180s for carnage)
  useEffect(() => {
    if (gameState !== 'playing') {
      soundEngine.stopHeartbeatLoop();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }

        const next = prev - 1;

        if (next <= 15) {
          soundEngine.playTick();
        }
        if (next === 15) {
          soundEngine.startHeartbeatLoop(85);
        } else if (next === 8) {
          soundEngine.startHeartbeatLoop(120);
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      soundEngine.stopHeartbeatLoop();
    };
  }, [gameState]);

  // Handle Prop Hit & Smash logic
  const handlePropHit = (hit: HitResult) => {
    setShowHitMarker(true);
    setTimeout(() => setShowHitMarker(false), 120);

    setCombo((prevCombo) => {
      const newCombo = Math.min(8, prevCombo + 1);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => {
        setCombo(1);
      }, 3000);
      return newCombo;
    });

    const comboMult = combo;
    const earnedScore = (hit.score || 100) * comboMult;

    setScore((prev) => prev + earnedScore);

    const isMannequin = hit.category === 'mannequin';

    setStats((prev) => {
      const cat = hit.category || 'furniture';
      const updatedCat = {
        ...prev.byCategory,
        [cat]: (prev.byCategory[cat] || 0) + (hit.destroyed ? 1 : 0),
      };

      const mStats = prev.mannequinStats || {
        headshots: 0,
        torsoHits: 0,
        limbHits: 0,
        explodedCount: 0,
      };

      if (isMannequin) {
        if (hit.hitZone === 'head') mStats.headshots += 1;
        else if (hit.hitZone === 'torso') mStats.torsoHits += 1;
        else if (hit.hitZone === 'limbs') mStats.limbHits += 1;

        if (hit.destroyed || hit.isExplosion) {
          mStats.explodedCount += 1;
        }
      }

      return {
        ...prev,
        totalSmashed: prev.totalSmashed + (hit.destroyed ? 1 : 0),
        totalDamage: prev.totalDamage + (hit.damage || 50),
        highestCombo: Math.max(prev.highestCombo, combo),
        byCategory: updatedCat,
        mannequinStats: isMannequin ? { ...mStats } : prev.mannequinStats,
      };
    });

    if (hit.destroyed) {
      setSmashedCount((prev) => prev + 1);
      if (isMannequin && hit.isExplosion) {
        try {
          confetti({
            particleCount: 25,
            spread: 55,
            origin: { y: 0.5 },
            colors: ['#ef4444', '#f59e0b', '#ec4899', '#ffffff'],
          });
        } catch (e) {}
      }
    }

    const cx = window.innerWidth / 2 + (Math.random() - 0.5) * 140;
    const cy = window.innerHeight / 2 - 20 + (Math.random() - 0.5) * 70;

    let text = `+${earnedScore} ${hit.name?.toUpperCase() || 'SMASH!'}`;
    let color = '#f59e0b';
    let scale = comboMult > 2 ? 1.35 : 1.1;

    if (isMannequin) {
      if (hit.destroyed || hit.isExplosion) {
        text = `+${earnedScore} 💥 MANICHINO ESPLOSO!`;
        color = '#ef4444';
        scale = 1.7;
      } else if (hit.hitZone === 'head') {
        text = `+${earnedScore} 🎯 HEADSHOT!`;
        color = '#ef4444';
        scale = 1.45;
      } else if (hit.hitZone === 'torso') {
        text = `+${earnedScore} 🥋 PETTO!`;
        color = '#ec4899';
        scale = 1.25;
      } else if (hit.hitZone === 'limbs') {
        text = `+${earnedScore} 🦵 ARTI!`;
        color = '#a855f7';
        scale = 1.15;
      }
    } else if (hit.destroyed) {
      color =
        hit.category === 'tv' || hit.category === 'electronics' || hit.category === 'printer'
          ? '#06b6d4'
          : hit.category === 'extinguisher'
          ? '#ef4444'
          : hit.category === 'window'
          ? '#60a5fa'
          : hit.category === 'sanitary'
          ? '#e2e8f0'
          : hit.category === 'guitar'
          ? '#f43f5e'
          : '#f59e0b';
    }

    setFloatingTexts((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random()}`,
        text,
        x: cx,
        y: cy,
        color,
        scale,
        opacity: 1,
        createdAt: Date.now(),
      },
    ]);
  };

  const handleGameOver = () => {
    soundEngine.stopHeartbeatLoop();
    soundEngine.playTimeUp();

    if (sceneRef.current) {
      sceneRef.current.unlockPointer();
    }

    setGameState('gameover');

    setScore((finalScore) => {
      if (finalScore > highScore) {
        setIsNewRecord(true);
        setHighScore(finalScore);
        try {
          localStorage.setItem('sfogatoio_high_score', finalScore.toString());
        } catch (e) {}
      } else {
        setIsNewRecord(false);
      }
      return finalScore;
    });
  };

  const isTopFive = (() => {
    if (score <= 0) return false;
    if (leaderboard.length < 5) return true;
    return score > (leaderboard[leaderboard.length - 1]?.score || 0);
  })();

  const handleSaveToLeaderboard = (playerName: string) => {
    const newEntry: LeaderboardEntry = {
      id: `${Date.now()}`,
      name: playerName,
      score,
      smashed: smashedCount,
      date: new Date().toISOString().split('T')[0],
      tier: sessionTier,
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setLeaderboard(updated);
    try {
      localStorage.setItem('sfogatoio_leaderboard_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  const startGame = () => {
    soundEngine.init();
    soundEngine.resume();

    const duration = sessionTier === 'carnage' ? 180 : 60;
    setTimeLeft(duration);
    setScore(0);
    setSmashedCount(0);
    setCombo(1);
    setStats({
      ...INITIAL_STATS,
      tier: sessionTier,
    });
    setIsNewRecord(false);
    setShowRestockBanner(false);
    setShowRoomClearedBanner(false);
    setEarnedFreeCreditInSession(false);
    setGameState('playing');

    if (sceneRef.current) {
      sceneRef.current.resetRoom();
      sceneRef.current.equipWeapon(selectedWeapon);
      const isMobile = isTouchDevice || (typeof window !== 'undefined' && window.innerWidth <= 1024);
      if (!isMobile) {
        setTimeout(() => {
          sceneRef.current?.lockPointer();
        }, 100);
      }
    }
  };

  const handleUseFreeCredit = (keepScore: boolean = false) => {
    if (freeCredits <= 0) return;
    setFreeCredits((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem('sfogatoio_free_credits_v1', next.toString());
      } catch (e) {}
      return next;
    });

    if (keepScore) {
      soundEngine.init();
      soundEngine.resume();

      const duration = sessionTier === 'carnage' ? 180 : 60;
      setTimeLeft(duration);
      setCombo(1);
      setIsNewRecord(false);
      setShowRestockBanner(false);
      setShowRoomClearedBanner(false);
      setEarnedFreeCreditInSession(false);
      setGameState('playing');

      if (sceneRef.current) {
        sceneRef.current.resetRoom();
        sceneRef.current.equipWeapon(selectedWeapon);
        const isMobile = isTouchDevice || (typeof window !== 'undefined' && window.innerWidth <= 1024);
        if (!isMobile) {
          setTimeout(() => {
            sceneRef.current?.lockPointer();
          }, 100);
        }
      }
    } else {
      startGame();
    }
  };

  const handleToggleMute = () => {
    soundEngine.init();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleLockPointer = () => {
    soundEngine.init();
    soundEngine.resume();
    sceneRef.current?.lockPointer();
  };

  const handleResetRoom = () => {
    sceneRef.current?.resetRoom();
    soundEngine.playWeaponSwitch();
  };

  const handleStartDonation = () => {
    soundEngine.init();
    soundEngine.resume();
    soundEngine.playWeaponSwitch();
    setSessionTier('blitz');
    sessionTierRef.current = 'blitz';
    setStripeNotice({
      type: 'info',
      message: 'Pagina Stripe da 0,50€ aperta in una nuova scheda. Completa il pagamento e inizia a giocare!',
    });
  };

  const handleStartCustomMannequinDonation = () => {
    soundEngine.init();
    soundEngine.resume();
    soundEngine.playWeaponSwitch();
    setSessionTier('custom_mannequins');
    sessionTierRef.current = 'custom_mannequins';
    setStripeNotice({
      type: 'info',
      message: 'Pagina Stripe da 2,00€ aperta in una nuova scheda. Completa la donazione e carica il volto dei manichini!',
    });
  };

  const handleStartCustomMannequinsGame = (faceDataUrl: string, faceName: string) => {
    soundEngine.init();
    soundEngine.resume();

    const startWithTexture = (texture: THREE.Texture | null) => {
      if (sceneRef.current) {
        sceneRef.current.setCustomFace(texture, faceName);
      }

      setCustomTargetName(faceName);
      setCustomTargetImage(faceDataUrl);
      setSessionTier('custom_mannequins');
      sessionTierRef.current = 'custom_mannequins';

      setTimeLeft(60);
      setScore(0);
      setSmashedCount(0);
      setCombo(1);
      setStats({
        ...INITIAL_STATS,
        tier: 'custom_mannequins',
        mannequinStats: {
          headshots: 0,
          torsoHits: 0,
          limbHits: 0,
          explodedCount: 0,
        },
      });
      setIsNewRecord(false);
      setShowRestockBanner(false);
      setShowRoomClearedBanner(false);
      setEarnedFreeCreditInSession(false);
      setGameState('playing');

      if (sceneRef.current) {
        sceneRef.current.resetRoom();
        sceneRef.current.equipWeapon(selectedWeapon);
        const isMobile = isTouchDevice || (typeof window !== 'undefined' && window.innerWidth <= 1024);
        if (!isMobile) {
          setTimeout(() => {
            sceneRef.current?.lockPointer();
          }, 100);
        }
      }
    };

    // Load texture directly from high-resolution illuminated data URL
    const loader = new THREE.TextureLoader();
    loader.load(
      faceDataUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        startWithTexture(tex);
      },
      undefined,
      (err) => {
        console.warn('Direct texture loader error, fallback without texture:', err);
        startWithTexture(null);
      }
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair touch-none"
      />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />

      {/* --- SCREEN 1: LANDING SCREEN --- */}
      {gameState === 'title' && (
        <LandingScreen
          onStartDonation={handleStartDonation}
          onStartCustomMannequinDonation={handleStartCustomMannequinDonation}
          isConnectingStripe={isConnectingStripe}
          stripeNotice={stripeNotice}
          sessionTier={sessionTier}
          onSelectSessionTier={(t) => setSessionTier(t)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          highScore={highScore}
          leaderboard={leaderboard}
          freeCredits={freeCredits}
          onUseFreeCredit={handleUseFreeCredit}
          onOpenStripeConfig={() => setGameState('payment')}
          blitzPaymentUrl={paymentLinks.blitz}
          customPaymentUrl={paymentLinks.custom_mannequins}
          onProceedCustomMannequins={() => {
            soundEngine.init();
            soundEngine.resume();
            setSessionTier('custom_mannequins');
            sessionTierRef.current = 'custom_mannequins';
            setGameState('face_upload');
          }}
          onProceedBlitz={() => {
            soundEngine.init();
            soundEngine.resume();
            setSessionTier('blitz');
            sessionTierRef.current = 'blitz';
            startGame();
          }}
        />
      )}

      {/* --- SCREEN 2: PAYMENT MODAL --- */}
      {gameState === 'payment' && (
        <PaymentModal
          sessionTier={sessionTier}
          onSuccess={() => {
            if (sessionTier === 'custom_mannequins') {
              setGameState('face_upload');
            } else {
              startGame();
            }
          }}
          onCancel={() => setGameState('title')}
        />
      )}

      {/* --- SCREEN 2.5: FACE UPLOAD SCREEN FOR CUSTOM MANNEQUINS --- */}
      {gameState === 'face_upload' && (
        <FaceUploadScreen
          onConfirmFace={handleStartCustomMannequinsGame}
          onCancel={() => setGameState('title')}
        />
      )}

      {/* --- SCREEN 3: ACTIVE GAMEPLAY HUD & MOBILE CONTROLS --- */}
      {gameState === 'playing' && (
        <>
          <GameHUD
            timeLeft={timeLeft}
            score={score}
            smashedCount={smashedCount}
            combo={combo}
            sessionTier={sessionTier}
            isPointerLocked={isPointerLocked}
            onLockPointer={handleLockPointer}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onResetRoom={handleResetRoom}
            floatingTexts={floatingTexts}
            showHitMarker={showHitMarker}
            isTouchDevice={isTouchDevice}
            showRestockBanner={showRestockBanner}
            freeCredits={freeCredits}
            remainingProps={remainingProps}
            totalWaveProps={totalWaveProps}
            showRoomClearedBanner={showRoomClearedBanner}
            customTargetName={sessionTier === 'custom_mannequins' ? customTargetName : undefined}
            customTargetImage={sessionTier === 'custom_mannequins' ? customTargetImage : undefined}
          />

          {(isTouchDevice || (typeof window !== 'undefined' && window.innerWidth <= 1024)) && (
            <MobileControls
              onSwing={() => sceneRef.current?.swingWeapon()}
              onTouchMove={(forward, right) => {
                if (sceneRef.current) {
                  sceneRef.current.touchMoveVector.set(right, forward);
                }
              }}
              onTouchLook={(deltaX, deltaY) => {
                sceneRef.current?.applyTouchLook(deltaX, deltaY);
              }}
            />
          )}
        </>
      )}

      {/* --- SCREEN 4: SUMMARY & RESULTS --- */}
      {gameState === 'gameover' && (
        <SummaryScreen
          stats={stats}
          score={score}
          highScore={highScore}
          isNewRecord={isNewRecord}
          isTopFive={isTopFive}
          onSaveToLeaderboard={handleSaveToLeaderboard}
          onDonatePlayAgain={() => {
            if (stats.tier === 'custom_mannequins') {
              handleStartCustomMannequinDonation();
            } else {
              handleStartDonation();
            }
          }}
          onStartCustomMannequins={handleStartCustomMannequinDonation}
          onGoHome={() => {
            setGameState('title');
          }}
          freeCredits={freeCredits}
          earnedFreeCreditInSession={earnedFreeCreditInSession}
          onUseFreeCredit={() => handleUseFreeCredit(true)}
          blitzPaymentUrl={paymentLinks.blitz}
          customPaymentUrl={paymentLinks.custom_mannequins}
        />
      )}
    </div>
  );
}
