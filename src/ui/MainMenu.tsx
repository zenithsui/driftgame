import { useState } from "react";
import { useGameStore, type GameMode, type QualityPreset } from "../store/gameStore";

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  const counterSteerAssist = useGameStore((s) => s.counterSteerAssist);
  const units = useGameStore((s) => s.units);
  const actions = useGameStore((s) => s.actions);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="bg-[#0d1520] border border-white/10 rounded-xl p-8 w-[420px] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Settings</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Quality */}
        <div className="space-y-2">
          <label className="text-xs text-white/50 uppercase tracking-widest">Graphics Quality</label>
          <div className="flex gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as QualityPreset[]).map((q) => (
              <button
                key={q}
                onClick={() => actions.setQuality(q)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                  qualityPreset === q
                    ? "bg-[#FFD700] text-black"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Speed units */}
        <div className="space-y-2">
          <label className="text-xs text-white/50 uppercase tracking-widest">Speed Units</label>
          <div className="flex gap-2">
            {(["KMH", "MPH"] as const).map((u) => (
              <button
                key={u}
                onClick={() => units !== u && actions.toggleUnits()}
                className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                  units === u
                    ? "bg-[#FFD700] text-black"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Countersteer assist */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-white">Countersteer Assist</div>
            <div className="text-xs text-white/40">Helps maintain drift control</div>
          </div>
          <button
            onClick={actions.toggleCounterSteerAssist}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              counterSteerAssist ? "bg-[#FFD700]" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                counterSteerAssist ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="text-xs text-white/30 space-y-1">
            <div className="font-medium text-white/50 mb-2">Controls</div>
            <div>W / ↑ — Throttle · S / ↓ — Brake</div>
            <div>A / ← D / → — Steer · Space — Handbrake</div>
            <div>Esc — Pause · C — Camera</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MainMenu() {
  const actions = useGameStore((s) => s.actions);
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = (mode: GameMode) => {
    actions.startGame(mode);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 60% 50%, #1a0a35 0%, #050810 60%)",
        }}
      />
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100,150,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,150,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(400px) rotateX(30deg)",
          transformOrigin: "50% 100%",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-16"
              style={{ background: "linear-gradient(to bottom, #FFD700, #FF6600)" }}
            />
            <div>
              <h1
                className="text-7xl font-black uppercase tracking-[-0.02em] text-white"
                style={{ textShadow: "0 0 40px rgba(255,200,0,0.5)" }}
              >
                DRIFT
              </h1>
              <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-[#FFD700]">
                PROTOCOL
              </h2>
            </div>
          </div>
          <div className="text-sm uppercase tracking-[0.4em] text-white/30">
            BMW M5 E34 · Physics-Driven Drift Racing
          </div>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-3 w-80">
          <button
            onClick={() => handleStart("SCORE_ATTACK")}
            className="group relative overflow-hidden py-4 rounded-xl font-black text-lg uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF6600)" }}
          >
            <span className="relative z-10">Score Attack</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>

          <button
            onClick={() => handleStart("PRACTICE")}
            className="group relative overflow-hidden py-4 rounded-xl font-black text-lg uppercase tracking-widest text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
          >
            Free Practice
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="py-3 rounded-xl font-medium text-sm uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
          >
            Settings
          </button>
        </div>

        {/* Credits */}
        <div className="text-xs text-white/20 text-center space-y-1">
          <div>Built with Three.js + React Three Fiber + Rapier Physics</div>
          <div>BMW M5 E34 © Original owners · Track assets: Creative Commons</div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
