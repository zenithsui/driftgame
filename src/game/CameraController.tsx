import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CarRef } from "./Car";

interface CameraControllerProps {
  carRef: React.RefObject<CarRef | null>;
}

const CHASE_DISTANCE = 9;
const CHASE_HEIGHT = 3.5;
const CHASE_LOOK_AHEAD = 3;
const POSITION_LERP = 0.065;
const TARGET_LERP = 0.1;
const DRIFT_LEAN_STRENGTH = 1.8;

export default function CameraController({ carRef }: CameraControllerProps) {
  const { camera } = useThree();
  const camPos = useRef(new THREE.Vector3(90 + CHASE_DISTANCE, CHASE_HEIGHT + 1, 0));
  const camTarget = useRef(new THREE.Vector3(90, 0.8, 0));
  const driftLean = useRef(0);

  useFrame((_, delta) => {
    const carState = carRef.current?.getState();
    if (!carState) return;

    const { position, quaternion, velocity, slipAngle, isHandbraking } = carState;

    // Car forward vector (world space)
    const carForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const carRight = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const speed = velocity.length();

    // Drift lean: camera leans slightly toward slide direction
    const velDir = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
    const sideDot = velDir.dot(carRight);
    const targetLean = sideDot * DRIFT_LEAN_STRENGTH;
    driftLean.current += (targetLean - driftLean.current) * Math.min(1, delta * 3);

    // Dynamic chase distance — pulls back slightly at speed
    const dynamicDist = CHASE_DISTANCE + speed * 0.06;
    const dynamicHeight = CHASE_HEIGHT + speed * 0.01;

    // Ideal camera position: behind car, elevated
    const behindCar = carForward.clone().multiplyScalar(-dynamicDist);
    const idealCamPos = position.clone()
      .add(behindCar)
      .add(new THREE.Vector3(0, dynamicHeight, 0))
      .add(carRight.clone().multiplyScalar(driftLean.current));

    // Smooth position
    camPos.current.lerp(idealCamPos, Math.min(1, delta / POSITION_LERP));

    // Look-ahead target
    const lookAheadOffset = carForward.clone().multiplyScalar(CHASE_LOOK_AHEAD);
    const idealTarget = position.clone()
      .add(lookAheadOffset)
      .add(new THREE.Vector3(0, 0.8, 0));

    camTarget.current.lerp(idealTarget, Math.min(1, delta / TARGET_LERP));

    camera.position.copy(camPos.current);
    camera.lookAt(camTarget.current);
  });

  return null;
}
