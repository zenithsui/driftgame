import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

function SpeedDisplay() {
  const speed = useGameStore((s) => s.speed);
  const units = useGameStore((s) => s.units);
  const displaySpeed = units === "KMH" ? Math.round(speed * 3.6) : Math.round(speed * 2.237);

  return (
    <div className="flex flex-col items-end">
      <span className="hud-value text-6xl font-black text-white leading-none">{displaySpeed}</span>
      <span className="text-sm font-medium text-white/60 uppercase tracking-widest">{units}</span>
    </div>
  );
}

function DriftMeter() {
  const driftAngle = useGameStore((s) => s.driftAngle);
  const isDrifting = driftAngle > 12;
  const fillPct = Math.min(100, (driftAngle / 60) * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-medium text-white/50 uppercase tracking-widest">Drift Angle</div>
      <div className="flex items-center gap-2">
        <div className="w-32 h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${fillPct}%`,
              background: isDrifting
                ? `linear-gradient(90deg, #FFD700, #FF6600)`
                : `linear-gradient(90deg, #4488FF, #0099FF)`,
              boxShadow: isDrifting ? "0 0 8px rgba(255, 180, 0, 0.8)" : "none",
            }}
          />
        </div>
        <span className={`hud-value text-sm font-bold ${isDrifting ? "text-yellow-400 glow-gold" : "text-white/70"}`}>
          {Math.round(driftAngle)}°
        </span>
      </div>
    </div>
  );
}

function ScoreDisplay() {
  const score = useGameStore((s) => s.score);
  const prevScore = useRef(0);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Math.floor(score) > Math.floor(prevScore.current) + 100 && flashRef.current) {
      flashRef.current.style.opacity = "1";
      flashRef.current.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (flashRef.current) {
          flashRef.current.style.opacity = "0";
          flashRef.current.style.transform = "translateY(-30px)";
        }
      }, 100);
    }
    prevScore.current = score;
  }, [score]);

  return (
    <div className="flex flex-col items-start relative">
      <div className="text-xs font-medium text-white/50 uppercase tracking-widest">Score</div>
      <div className="hud-value text-4xl font-black text-[#FFD700] glow-gold leading-tight">
        {Math.floor(score).toLocaleString()}
      </div>
    </div>
  );
}

function MultiplierDisplay() {
  const multiplier = useGameStore((s) => s.multiplier);
  const driftComboTime = useGameStore((s) => s.driftComboTime);
  const isDrifting = driftComboTime > 0;

  return (
    <div className="flex flex-col items-start">
      <div className="text-xs font-medium text-white/50 uppercase tracking-widest">Combo</div>
      <div className={`hud-value text-3xl font-black leading-tight transition-colors duration-150 ${
        multiplier >= 4 ? "text-red-400 glow-red" :
        multiplier >= 2 ? "text-orange-400" :
        isDrifting ? "text-yellow-300" : "text-white/40"
      } ${isDrifting && multiplier > 1 ? "multiplier-pulse" : ""}`}>
        ×{multiplier.toFixed(1)}
      </div>
    </div>
  );
}

function TimerDisplay() {
  const gameMode = useGameStore((s) => s.gameMode);
  const sessionTime = useGameStore((s) => s.sessionTime);
  const sessionDuration = useGameStore((s) => s.sessionDuration);

  if (gameMode === "PRACTICE") {
    const mins = Math.floor(sessionTime / 60);
    const secs = Math.floor(sessionTime % 60);
    return (
      <div className="hud-value text-sm font-medium text-white/50">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
    );
  }

  // Score attack - countdown
  const remaining = Math.max(0, sessionDuration - sessionTime);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const isUrgent = remaining < 20;

  return (
    <div className={`hud-value text-xl font-black ${isUrgent ? "text-red-400 glow-red" : "text-white/80"}`}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

function GearIndicator() {
  const speed = useGameStore((s) => s.speed);
  // Approximate gear from speed
  const gear = speed < 8 ? 1 : speed < 18 ? 2 : speed < 28 ? 3 : speed < 38 ? 4 : 5;

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-white/40 uppercase tracking-widest">Gear</div>
      <div className="hud-value text-2xl font-black text-white/70">{gear}</div>
    </div>
  );
}

function ComboBar() {
  const driftComboTime = useGameStore((s) => s.driftComboTime);
  const multiplier = useGameStore((s) => s.multiplier);
  const nextMult = multiplier + 0.5;
  const timeToNext = 2.5;
  const timeInCurrent = driftComboTime % timeToNext;
  const pct = (timeInCurrent / timeToNext) * 100;

  if (driftComboTime <= 0) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs text-white/50 uppercase tracking-widest">Next ×{nextMult.toFixed(1)}</div>
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
            style={{ width: `${pct}%`, transition: "width 0.1s linear" }}
          />
        </div>
      </div>
    </div>
  );
}

function ControlsHint() {
  return (
    <div className="flex flex-col gap-0.5 text-xs text-white/25">
      <span>W/↑ Throttle · S/↓ Brake</span>
      <span>A/← D/→ Steer · Space Handbrake</span>
      <span>Esc Pause</span>
    </div>
  );
}

export default function HUD() {
  const gameState = useGameStore((s) => s.gameState);
  if (gameState !== "PLAYING" && gameState !== "PAUSED") return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <ScoreDisplay />
          <MultiplierDisplay />
        </div>
        <div className="flex flex-col items-end gap-1">
          <TimerDisplay />
          <DriftMeter />
        </div>
      </div>

      {/* Bottom right: Speedometer */}
      <div className="absolute bottom-6 right-6 flex items-end gap-4">
        <GearIndicator />
        <SpeedDisplay />
      </div>

      {/* Bottom left: Controls hint */}
      <div className="absolute bottom-6 left-6">
        <ControlsHint />
      </div>

      {/* Center combo bar */}
      <ComboBar />

      {/* Drift active indicator */}
      {gameState === "PLAYING" && <DriftActiveFlash />}
    </div>
  );
}

function DriftActiveFlash() {
  const driftAngle = useGameStore((s) => s.driftAngle);
  const isDrifting = driftAngle > 20;

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-200"
      style={{
        boxShadow: isDrifting
          ? `inset 0 0 60px rgba(255, 150, 0, 0.15)`
          : "none",
        opacity: isDrifting ? 1 : 0,
      }}
    />
  );
}
