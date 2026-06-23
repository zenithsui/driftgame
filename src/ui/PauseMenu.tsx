import { useGameStore } from "../store/gameStore";

export default function PauseMenu() {
  const actions = useGameStore((s) => s.actions);
  const score = useGameStore((s) => s.score);

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Title */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white">Paused</h2>
          <div className="text-sm text-white/40 uppercase tracking-widest">
            Score: <span className="text-[#FFD700] font-bold">{Math.floor(score).toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <button
            onClick={actions.resumeGame}
            className="py-3.5 rounded-xl font-black text-base uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF6600)" }}
          >
            Resume
          </button>

          <button
            onClick={() => actions.startGame("SCORE_ATTACK")}
            className="py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Restart
          </button>

          <button
            onClick={actions.returnToMenu}
            className="py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
          >
            Main Menu
          </button>
        </div>

        <div className="text-xs text-white/25 uppercase tracking-widest">Press Esc to resume</div>
      </div>
    </div>
  );
}
