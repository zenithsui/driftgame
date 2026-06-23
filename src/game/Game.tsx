import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Sky, Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGameStore } from "../store/gameStore";
import Track from "./Track";
import Car, { CarRef } from "./Car";
import CameraController from "./CameraController";
import DriftScorer from "./DriftScorer";
import Environment from "./Environment";
import HUD from "../ui/HUD";
import PauseMenu from "../ui/PauseMenu";
import SmokeSystem from "./SmokeSystem";
import SkidMarks from "./SkidMarks";

export enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  handbrake = "handbrake",
  cameraToggle = "cameraToggle",
}

const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.handbrake, keys: ["Space"] },
  { name: Controls.cameraToggle, keys: ["KeyC"] },
];

function GameScene() {
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  const gameState = useGameStore((s) => s.gameState);
  const carRef = useRef<CarRef>(null);

  const shadowMapSize = qualityPreset === "HIGH" ? 2048 : qualityPreset === "MEDIUM" ? 1024 : 512;
  const paused = gameState === "PAUSED";

  return (
    <>
      <Physics
        gravity={[0, -22, 0]}
        paused={paused}
        timeStep={1 / 60}
      >
        <Track />
        <Car ref={carRef} />
        <DriftScorer carRef={carRef} />
        <SmokeSystem carRef={carRef} />
        <SkidMarks carRef={carRef} />
      </Physics>

      <CameraController carRef={carRef} />
      <Environment shadowMapSize={shadowMapSize} />

      {qualityPreset !== "LOW" && (
        <EffectComposer>
          <Bloom intensity={0.3} luminanceThreshold={0.8} luminanceSmoothing={0.9} />
          <Vignette eskil={false} offset={0.3} darkness={0.5} />
        </EffectComposer>
      )}

      {qualityPreset === "HIGH" && <Stars radius={300} depth={60} count={3000} factor={4} />}
    </>
  );
}

export default function Game() {
  const gameState = useGameStore((s) => s.gameState);

  return (
    <KeyboardControls map={keyMap}>
      <div className="absolute inset-0">
        <Canvas
          shadows
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
          }}
          camera={{ fov: 65, near: 0.5, far: 2000 }}
        >
          <Suspense fallback={null}>
            <GameScene />
          </Suspense>
        </Canvas>
      </div>

      {/* HTML overlays */}
      <HUD />
      {gameState === "PAUSED" && <PauseMenu />}
    </KeyboardControls>
  );
}
