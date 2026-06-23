import { useEffect, useRef } from "react";
import { useGameStore } from "./store/gameStore";
import Game from "./game/Game";
import MainMenu from "./ui/MainMenu";
import EndScreen from "./ui/EndScreen";

export default function App() {
  const gameState = useGameStore((s) => s.gameState);
  const countdownValue = useGameStore((s) => s.countdownValue);
  const actions = useGameStore((s) => s.actions);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRunning = useRef(false);

  useEffect(() => {
    if (gameState === "COUNTDOWN" && !countdownRunning.current) {
      countdownRunning.current = true;
      let count = 3;
      actions.setCountdown(count);
      const tick = () => {
        count -= 1;
        if (count <= 0) {
          actions.setCountdown(0);
          countdownRunning.current = false;
        } else {
          actions.setCountdown(count);
          countdownRef.current = setTimeout(tick, 1000);
        }
      };
      countdownRef.current = setTimeout(tick, 1000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
      if (gameState === "MENU") countdownRunning.current = false;
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gameState === "PLAYING") actions.pauseGame();
        else if (gameState === "PAUSED") actions.resumeGame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      {/* 3D Game scene - always mounted when not on menu */}
      {(gameState === "PLAYING" || gameState === "PAUSED" || gameState === "COUNTDOWN" || gameState === "ENDED") && (
        <Game />
      )}

      {/* UI overlays */}
      {gameState === "MENU" && <MainMenu />}
      {gameState === "ENDED" && <EndScreen />}

      {/* Countdown overlay */}
      {gameState === "COUNTDOWN" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div key={countdownValue} className="countdown-num">
            <span className="text-[10rem] font-black text-[#FFD700] glow-gold">
              {countdownValue > 0 ? countdownValue : "GO!"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
