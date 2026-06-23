import { useGameStore, type GameMode } from "../store/gameStore";

function StatCard({ label, value, unit, highlight }: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border transition-all ${
      highlight
        ? "border-[#FFD700]/40 bg-[#FFD700]/8"
        : "border-white/8 bg-white/4"
    }`}>
      <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{label}</div>
      <div className={`hud-value text-3xl font-black ${highlight ? "text-[#FFD700] glow-gold" : "text-white"}`}>
        {value}
        {unit && <span className="text-sm font-medium text-white/40 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export default function EndScreen() {
  const session = useGameStore((s) => s.session);
  const gameMode = useGameStore((s) => s.gameMode);
  const actions = useGameStore((s) => s.actions);

  if (!session) return null;

  const getRating = (score: number) => {
    if (score >= 500000) return { label: "LEGENDARY", color: "#FF2200" };
    if (score >= 200000) return { label: "MASTER", color: "#FF8800" };
    if (score >= 80000) return { label: "EXPERT", color: "#FFD700" };
    if (score >= 30000) return { label: "SKILLED", color: "#88FF44" };
    if (score >= 10000) return { label: "AMATEUR", color: "#4488FF" };
    return { label: "ROOKIE", color: "#888888" };
  };

  const rating = getRating(session.totalScore);

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-8 max-w-lg w-full px-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs uppercase tracking-[0.4em] text-white/30">
            {gameMode === "SCORE_ATTACK" ? "Score Attack · 90 Seconds" : "Practice Session"}
          </div>
          <h2 className="text-5xl font-black uppercase tracking-[-0.02em] text-white">
            Session Complete
          </h2>
          <div
            className="text-2xl font-black uppercase tracking-widest px-6 py-1 rounded-full"
            style={{ color: rating.color, border: `1px solid ${rating.color}40`, background: `${rating.color}12` }}
          >
            {rating.label}
          </div>
        </div>

        {/* Main score */}
        <div className="text-center">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Total Score</div>
          <div className="hud-value text-7xl font-black text-[#FFD700] glow-gold">
            {session.totalScore.toLocaleString()}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <StatCard
            label="Longest Drift"
            value={session.longestDrift.toFixed(1)}
            unit="s"
            highlight={session.longestDrift > 10}
          />
          <StatCard
            label="Best Combo"
            value={`×${session.highestMultiplier.toFixed(1)}`}
            highlight={session.highestMultiplier >= 3}
          />
          <StatCard
            label="Top Speed"
            value={session.highestSpeed}
            unit="km/h"
            highlight={session.highestSpeed > 150}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => actions.startGame(gameMode as GameMode)}
            className="flex-1 py-3.5 rounded-xl font-black text-base uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF6600)" }}
          >
            Try Again
          </button>
          <button
            onClick={actions.returnToMenu}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
