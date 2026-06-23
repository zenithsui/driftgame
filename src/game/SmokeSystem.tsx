import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CarRef } from "./Car";

interface SmokeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 120;

interface SmokeSystemProps {
  carRef: React.RefObject<CarRef | null>;
}

export default function SmokeSystem({ carRef }: SmokeSystemProps) {
  const particles = useRef<SmokeParticle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);
  const emitTimer = useRef(0);

  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#CCCCCC",
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame(({ camera }, delta) => {
    const state = carRef.current?.getState();
    if (!state) return;

    const { position, quaternion, slipAngle, isHandbraking, speed } = state;
    const isDrifting = slipAngle > 12 && speed > 5;

    // Emit new particles
    emitTimer.current += delta;
    const emitRate = isDrifting ? 0.015 : isHandbraking && speed > 2 ? 0.04 : 0.5;

    if (emitTimer.current > emitRate && particles.current.length < MAX_PARTICLES) {
      emitTimer.current = 0;

      // Wheel positions in world space (rear wheels)
      const carRight = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
      const carForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      const rearCenter = position.clone().add(carForward.clone().multiplyScalar(-1.38));

      const density = isDrifting ? 2 : 1;
      for (let d = 0; d < density; d++) {
        const side = d % 2 === 0 ? -1 : 1;
        const wheelPos = rearCenter.clone().add(carRight.clone().multiplyScalar(side * 0.92));
        wheelPos.y = 0.2;

        const size = isDrifting
          ? 0.4 + Math.random() * 0.6
          : 0.2 + Math.random() * 0.3;

        particles.current.push({
          position: wheelPos.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            0,
            (Math.random() - 0.5) * 0.5
          )),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            0.5 + Math.random() * 1.2,
            (Math.random() - 0.5) * 1.5
          ),
          life: 0,
          maxLife: isDrifting ? 1.5 + Math.random() * 1.5 : 0.8 + Math.random() * 0.5,
          size,
        });
      }
    }

    // Update particles
    particles.current = particles.current.filter(p => p.life < p.maxLife);

    particles.current.forEach(p => {
      p.life += delta;
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= delta * 0.5; // slight gravity
      p.velocity.multiplyScalar(0.98); // drag
    });

    // Render
    const mesh = meshRef.current;
    if (!mesh) return;

    const count = Math.min(particles.current.length, MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < count) {
        const p = particles.current[i];
        const t = p.life / p.maxLife;
        const scale = p.size * (0.5 + t * 1.5);
        const alpha = (1 - t) * 0.5;

        dummyMatrix.makeTranslation(p.position.x, p.position.y, p.position.z);
        // Billboard toward camera
        const lookDir = camera.position.clone().sub(p.position).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = up.clone().cross(lookDir).normalize();
        const newUp = lookDir.clone().cross(right).normalize();
        dummyMatrix.makeBasis(right, newUp, lookDir);
        dummyMatrix.scale(new THREE.Vector3(scale, scale, scale));
        dummyMatrix.setPosition(p.position);

        mesh.setMatrixAt(i, dummyMatrix);
        const grayVal = 0.7 + t * 0.25;
        dummyColor.setRGB(grayVal, grayVal, grayVal);
        mesh.setColorAt(i, dummyColor);
      } else {
        // Hide unused
        dummyMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, dummyMatrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, MAX_PARTICLES]} frustumCulled={false} />
  );
}
