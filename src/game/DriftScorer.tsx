import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import type { CarRef } from "./Car";

interface DriftScorerProps {
  carRef: React.RefObject<CarRef | null>;
}

export default function DriftScorer({ carRef }: DriftScorerProps) {
  const updateDrift = useGameStore((s) => s.actions.updateDrift);
  const tickTimer = useGameStore((s) => s.actions.tickTimer);
  const gameState = useGameStore((s) => s.gameState);

  useFrame((_, delta) => {
    if (gameState !== "PLAYING") return;

    const state = carRef.current?.getState();
    if (!state) return;

    const { slipAngle, speed } = state;
    tickTimer(delta);
    updateDrift(slipAngle, speed, delta);
  });

  return null;
}
