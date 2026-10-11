import React from 'react';
import { Volume2, VolumeX, RotateCcw, Flame, RefreshCw, Trophy } from 'lucide-react';
import { FloatingText, SessionTier } from '../types/game';

interface GameHUDProps {
  timeLeft: number;
  score: number;
  smashedCount: number;
  combo: number;
  sessionTier: SessionTier;
  isPointerLocked: boolean;
  onLockPointer: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetRoom: () => void;
  floatingTexts: FloatingText[];
  showHitMarker: boolean;
  isTouchDevice: boolean;
  showRestockBanner: boolean;
  freeCredits: number;
  remainingProps: number;
  totalWaveProps: number;
  showRoomClearedBanner: boolean;
  customTargetName?: string;
  customTargetImage?: string | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  timeLeft,
  score,
  smashedCount,
  combo,
  sessionTier,
  isPointerLocked,
  onLockPointer,
  isMuted,
  onToggleMute,
  onResetRoom,
  floatingTexts,
  showHitMarker,
  isTouchDevice,
  showRestockBanner,
  freeCredits,
  remainingProps,
  totalWaveProps,
  showRoomClearedBanner,
  customTargetName,
  customTargetImage,
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = timeLeft <= 15;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* --- TOP HUD BAR --- */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-5 flex items-start justify-between">
        {/* Left: Empty spacer - No text on left side of screen */}
        <div className="w-16 sm:w-24 shrink-0" />

        {/* Center: Countdown Timer & Sleek Minimal Stats */}
        <div className="flex flex-col items-center">
          <div
            className={`px-4 sm:px-6 py-1 sm:py-1.5 rounded-lg font-mono font-black text-2xl sm:text-4xl tracking-widest tabular-nums border shadow-2xl transition-all duration-300 ${
              isUrgent
                ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                : 'bg-black/70 backdrop-blur-md border-white/10 text-white shadow-black/50'
            }`}
          >
            {formattedTime}
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">
            {isUrgent ? 'TIMER CRITICO' : 'REMAINING'}
          </span>

          {/* Clean centered HUD info - Left side remains completely free and clear! */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[11px] font-mono text-stone-300 tabular-nums flex items-center gap-2">
              <span className="text-stone-400 text-[10px]">PTS</span>
              <span className="text-amber-400 font-bold font-chakra text-sm">{score.toLocaleString()}</span>
              <span className="text-stone-600">|</span>
              <span className="text-stone-400 text-[10px]">SMASH</span>
              <span className="text-white font-bold font-chakra text-sm">{smashedCount}</span>
              {remainingProps > 0 && (
                <>
                  <span className="text-stone-600">|</span>
                  <span className="text-amber-300 font-semibold text-[10px]">{remainingProps} RIMASTI</span>
                </>
              )}
            </div>

            {combo > 1 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-600/40 border border-red-500/50 text-red-400 font-chakra font-extrabold text-xs uppercase tracking-wider animate-pulse">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>COMBO x{combo}!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onResetRoom}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-black/70 backdrop-blur-md border border-white/10 hover:border-white/30 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Room Props (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-black/70 backdrop-blur-md border border-white/10 hover:border-white/30 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* --- ROOM CLEARED CELEBRATION BANNER (+1 GETTONE GRATIS & PUNTEGGIO CONTINUA!) --- */}
      {showRoomClearedBanner && (
        <div className="absolute top-20 inset-x-0 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-300 z-50 px-3">
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-yellow-400 to-amber-500 border-2 border-yellow-200 text-black font-chakra font-black text-sm sm:text-lg uppercase tracking-wider flex items-center gap-3 shadow-[0_0_40px_rgba(234,179,8,0.95)] animate-bounce text-center">
            <Trophy className="w-7 h-7 text-black shrink-0 animate-pulse" />
            <div>
              <div className="text-base sm:text-xl font-extrabold tracking-tight">
                🏆 EN PLEIN! STANZA COMPLETATA AL 100%!
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-stone-950 mt-0.5">
                HAI VINTO +1 GETTONE GRATIS & TEMPO BONUS! IL PUNTEGGIO CONTINUA!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ROOM RESTOCKED ANIMATED BANNER --- */}
      {showRestockBanner && !showRoomClearedBanner && (
        <div className="absolute top-20 inset-x-0 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-yellow-300 text-black font-chakra font-black text-sm sm:text-base uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.8)]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>STANZA RIFORNITA! NUOVI BERSAGLI PRONTI!</span>
          </div>
        </div>
      )}

      {/* --- CENTER RETICLE --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
          <div className="absolute top-0 w-0.5 h-2 bg-white/40" />
          <div className="absolute bottom-0 w-0.5 h-2 bg-white/40" />
          <div className="absolute left-0 w-2 h-0.5 bg-white/40" />
          <div className="absolute right-0 w-2 h-0.5 bg-white/40" />

          {showHitMarker && (
            <div className="absolute inset-0 flex items-center justify-center animate-out fade-out duration-150">
              <div className="w-5 h-5 border-2 border-red-500 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* --- FLOATING DAMAGE NUMBERS --- */}
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="absolute font-chakra font-black tracking-wider transition-all duration-500 ease-out pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-nowrap"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            color: item.color,
            fontSize: `${item.scale * 1.15}rem`,
            opacity: item.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {item.text}
        </div>
      ))}

      {/* --- DESKTOP ONLY: CLICK TO LOCK POINTER OVERLAY --- */}
      {!isTouchDevice && !isPointerLocked && typeof window !== 'undefined' && window.innerWidth > 1024 && !('ontouchstart' in window) && (!navigator.maxTouchPoints || navigator.maxTouchPoints === 0) && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-auto cursor-pointer z-50"
          onClick={onLockPointer}
        >
          <div className="px-6 py-3 rounded-lg bg-stone-900/90 border border-stone-700 text-stone-100 flex flex-col items-center gap-1.5 shadow-2xl animate-pulse">
            <span className="font-chakra font-bold text-base uppercase text-amber-400">
              CLICK SCREEN TO ENGAGE WEAPON
            </span>
            <span className="text-xs font-mono text-stone-400">
              Lock Mouse for First-Person Look & WASD Movement
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
