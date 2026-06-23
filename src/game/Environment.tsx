import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EnvironmentProps {
  shadowMapSize: number;
}

export default function Environment({ shadowMapSize }: EnvironmentProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} color="#94b5ff" />

      {/* Main sun */}
      <directionalLight
        ref={sunRef}
        position={[80, 120, 60]}
        intensity={2.5}
        color="#FFF0D0"
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.001}
      />

      {/* Fill light */}
      <directionalLight
        position={[-50, 40, -80]}
        intensity={0.6}
        color="#6090FF"
      />

      {/* Sky */}
      <mesh>
        <sphereGeometry args={[900, 32, 32]} />
        <meshBasicMaterial
          color="#0a1525"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Horizon glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <ringGeometry args={[300, 900, 64]} />
        <meshBasicMaterial color="#1a0a30" side={THREE.DoubleSide} />
      </mesh>

      {/* Moon */}
      <mesh position={[-200, 300, -400]}>
        <sphereGeometry args={[15, 16, 16]} />
        <meshBasicMaterial color="#FFFFF0" />
      </mesh>
      <pointLight position={[-200, 300, -400]} intensity={0.5} color="#FFFFFF" distance={2000} />
    </>
  );
}
