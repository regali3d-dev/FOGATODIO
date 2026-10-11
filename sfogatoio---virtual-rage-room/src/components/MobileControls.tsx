import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Flame, Maximize2 } from 'lucide-react';

interface MobileControlsProps {
  onSwing: () => void;
  onTouchMove: (forward: number, right: number) => void;
  onTouchLook: (deltaX: number, deltaY: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onSwing,
  onTouchMove,
  onTouchLook,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const leftZoneRef = useRef<HTMLDivElement | null>(null);
  const rightZoneRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Joystick coordinates & state
  const [joystickOrigin, setJoystickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const moveTouchIdRef = useRef<number | null>(null);

  // Look Zone tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number } | null>(null);
  const lookStartTimeRef = useRef<number>(0);
  const lookStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxRadius = 46;

  // Trigger haptic pulse
  const triggerHaptic = (ms: number = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  };

  // Safe reset of movement
  const resetMovement = useCallback(() => {
    moveTouchIdRef.current = null;
    setIsJoystickActive(false);
    setJoystickOrigin(null);
    setJoystickKnob({ x: 0, y: 0 });
    onTouchMove(0, 0);
  }, [onTouchMove]);

  // Safe reset of look
  const resetLook = useCallback(() => {
    lookTouchIdRef.current = null;
    lastLookPosRef.current = null;
  }, []);

  // Update Joystick vector from client (X, Y) relative to origin
  const handleMoveCoords = useCallback(
    (clientX: number, clientY: number, originX: number, originY: number) => {
      const dx = clientX - originX;
      const dy = clientY - originY;
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      setJoystickKnob({ x: knobX, y: knobY });

      // Forward is negative Y (up), Right is positive X
      const normX = knobX / maxRadius;
      const normY = -knobY / maxRadius;
      onTouchMove(normY, normX);
    },
    [onTouchMove]
  );

  // ==========================================
  // LEFT ZONE: TOUCH & POINTER HANDLING
  // ==========================================
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    // If already tracking a move touch, ignore other touches
    if (moveTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    moveTouchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    triggerHaptic(15);

    // Dynamic origin: center joystick where the user touched
    const origin = { x: touch.clientX, y: touch.clientY };
    setJoystickOrigin(origin);
    setJoystickKnob({ x: 0, y: 0 });
    onTouchMove(0, 0);
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    if (moveTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchIdRef.current) {
        if (joystickOrigin) {
          handleMoveCoords(touch.clientX, touch.clientY, joystickOrigin.x, joystickOrigin.y);
        } else if (joystickBaseRef.current) {
          const rect = joystickBaseRef.current.getBoundingClientRect();
          handleMoveCoords(touch.clientX, touch.clientY, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    if (moveTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchIdRef.current) {
        resetMovement();
        break;
      }
    }
  };

  // Pointer fallback for desktop testing / mouse emulation
  const handleLeftPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // Handled by TouchEvent for zero latency
    if (moveTouchIdRef.current !== null) return;

    moveTouchIdRef.current = e.pointerId;
    setIsJoystickActive(true);
    triggerHaptic(15);

    const origin = { x: e.clientX, y: e.clientY };
    setJoystickOrigin(origin);
    setJoystickKnob({ x: 0, y: 0 });
    onTouchMove(0, 0);
  };

  const handleLeftPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerId === moveTouchIdRef.current && joystickOrigin) {
      handleMoveCoords(e.clientX, e.clientY, joystickOrigin.x, joystickOrigin.y);
    }
  };

  const handleLeftPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerId === moveTouchIdRef.current) {
      resetMovement();
    }
  };

  // ==========================================
  // RIGHT ZONE: LOOK & TAP-TO-SWING HANDLING
  // ==========================================
  const handleRightTouchStart = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    lookTouchIdRef.current = touch.identifier;
    lookStartTimeRef.current = Date.now();
    lookStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleRightTouchMove = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current && lastLookPosRef.current) {
        const deltaX = touch.clientX - lastLookPosRef.current.x;
        const deltaY = touch.clientY - lastLookPosRef.current.y;
        onTouchLook(deltaX, deltaY);
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const tapDuration = Date.now() - lookStartTimeRef.current;
        const movedDist = Math.hypot(
          touch.clientX - lookStartPosRef.current.x,
          touch.clientY - lookStartPosRef.current.y
        );

        // Quick tap without dragging executes a weapon strike
        if (tapDuration < 240 && movedDist < 16) {
          triggerHaptic(35);
          onSwing();
        }
        resetLook();
        break;
      }
    }
  };

  // Pointer fallback for right zone (mouse drag)
  const handleRightPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (lookTouchIdRef.current !== null) return;
    lookTouchIdRef.current = e.pointerId;
    lookStartTimeRef.current = Date.now();
    lookStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastLookPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleRightPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerId === lookTouchIdRef.current && lastLookPosRef.current) {
      const deltaX = e.clientX - lastLookPosRef.current.x;
      const deltaY = e.clientY - lastLookPosRef.current.y;
      onTouchLook(deltaX, deltaY);
      lastLookPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleRightPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerId === lookTouchIdRef.current) {
      const tapDuration = Date.now() - lookStartTimeRef.current;
      const movedDist = Math.hypot(
        e.clientX - lookStartPosRef.current.x,
        e.clientY - lookStartPosRef.current.y
      );
      if (tapDuration < 240 && movedDist < 16) {
        triggerHaptic(35);
        onSwing();
      }
      resetLook();
    }
  };

  // Window-level safety listeners to ensure touches/pointers never get stuck
  useEffect(() => {
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (moveTouchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === moveTouchIdRef.current) {
            resetMovement();
            break;
          }
        }
      }
      if (lookTouchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
            resetLook();
            break;
          }
        }
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (e.pointerId === moveTouchIdRef.current) {
        resetMovement();
      }
      if (e.pointerId === lookTouchIdRef.current) {
        resetLook();
      }
    };

    const preventScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp, { passive: true });
    window.addEventListener('pointercancel', handleGlobalPointerUp, { passive: true });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [resetMovement, resetLook]);

  // Fullscreen trigger for mobile
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none">
      {/* ========================================================
          LEFT HALF: 100% DEDICATED MOVEMENT & JOYSTICK ZONE
          Covers the entire left half of the screen.
          Any touch on this side exclusively controls player movement!
          Never triggers look rotation or accidental strikes.
      ======================================================== */}
      <div
        ref={leftZoneRef}
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
        onPointerDown={handleLeftPointerDown}
        onPointerMove={handleLeftPointerMove}
        onPointerUp={handleLeftPointerUp}
        onPointerCancel={handleLeftPointerUp}
        className="absolute left-0 top-0 bottom-0 w-1/2 pointer-events-auto touch-none"
      >
        {/* Floating Dynamic Joystick (Shown where finger touches when active) */}
        {isJoystickActive && joystickOrigin && (
          <div
            className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity duration-150"
            style={{ left: `${joystickOrigin.x}px`, top: `${joystickOrigin.y}px` }}
          >
            <div className="relative w-24 h-24 rounded-full border-2 border-red-500 bg-stone-900/80 shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center justify-center">
              {/* Inner Draggable Knob */}
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-stone-800 via-stone-700 to-stone-600 border border-white/40 shadow-xl flex items-center justify-center"
                style={{
                  transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
                }}
              >
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Resting Fixed Joystick Guide in bottom-left */}
        <div
          ref={joystickBaseRef}
          className="absolute bottom-6 left-5 sm:left-8 pointer-events-none"
        >
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all flex items-center justify-center select-none ${
              isJoystickActive && !joystickOrigin
                ? 'bg-stone-900/80 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)] scale-105'
                : 'bg-black/60 border-stone-600/70 backdrop-blur-sm'
            }`}
          >
            {/* Subtle Crosshair guide lines */}
            <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-px bg-white/15 pointer-events-none" />
            <div className="absolute inset-y-5 left-1/2 -translate-x-1/2 w-px bg-white/15 pointer-events-none" />
            <div className="absolute w-20 h-20 rounded-full border border-white/5 pointer-events-none" />

            {/* Resting Inner Knob */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-stone-800 via-stone-700 to-stone-600 border border-white/30 shadow-xl flex items-center justify-center pointer-events-none transition-transform duration-75"
              style={{
                transform: !joystickOrigin ? `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` : 'translate(0px, 0px)',
              }}
            >
              <div
                className={`w-4 h-4 rounded-full transition-colors ${
                  isJoystickActive ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse' : 'bg-stone-400'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT HALF: 100% DEDICATED LOOK & ATTACK ZONE
          Dragging on this right side rotates camera (yaw/pitch).
          Tapping on this side swings the weapon!
      ======================================================== */}
      <div
        ref={rightZoneRef}
        onTouchStart={handleRightTouchStart}
        onTouchMove={handleRightTouchMove}
        onTouchEnd={handleRightTouchEnd}
        onTouchCancel={handleRightTouchEnd}
        onPointerDown={handleRightPointerDown}
        onPointerMove={handleRightPointerMove}
        onPointerUp={handleRightPointerUp}
        onPointerCancel={handleRightPointerUp}
        className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-auto touch-none"
      />

      {/* 
        RIGHT SIDE PRIMARY ACTION BUTTON: BIG SMASH STRIKE
        High z-index so it sits comfortably on top of the right look zone.
      */}
      <div className="absolute bottom-6 right-5 sm:right-8 pointer-events-auto z-40">
        <button
          type="button"
          onTouchStart={(e) => {
            e.stopPropagation();
            triggerHaptic(40);
            onSwing();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            triggerHaptic(40);
            onSwing();
          }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-amber-500 border-2 border-red-400 text-white flex flex-col items-center justify-center shadow-[0_0_28px_rgba(239,68,68,0.75)] active:scale-90 transition-transform cursor-pointer select-none"
        >
          <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200 animate-pulse pointer-events-none" />
          <span className="text-[10px] sm:text-xs font-chakra font-black tracking-widest uppercase mt-0.5 pointer-events-none">
            SMASH
          </span>
        </button>
      </div>

      {/* Fullscreen Button (Top Right) */}
      <div className="absolute top-3.5 right-14 sm:right-16 pointer-events-auto z-40">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-stone-300 active:text-white cursor-pointer"
          title="Schermo Intero"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
