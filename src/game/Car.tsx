import { forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import { Controls } from "./Game";
import type { RapierRigidBody } from "@react-three/rapier";

export interface CarState {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  speed: number;
  slipAngle: number;
  isHandbraking: boolean;
  wheelRPM: number;
  gear: number;
}

export interface CarRef {
  getState: () => CarState;
}

// Car physics constants
const CAR_MASS = 1550;
const MAX_SPEED_MS = 55; // ~200 km/h
const DRIVE_FORCE = 14000;
const BRAKE_FORCE = 18000;
const REVERSE_FORCE = 5000;
const DRAG_COEFFICIENT = 0.5;
const LATERAL_GRIP_NORMAL = 0.94;   // high grip = stays on line
const LATERAL_GRIP_HANDBRAKE = 0.03; // near zero = slides freely
const LATERAL_GRIP_THROTTLE_DRIFT = 0.45; // mid oversteer on power
const ANGULAR_DAMPING = 1.5;
const STEER_STRENGTH = 2.8;
const STEER_SPEED_SENSITIVITY = 0.022;
const MAX_STEER_ANGLE_RAD = 0.62; // ~35 degrees

// Gear ratios + final drive
const GEAR_RATIOS = [3.72, 2.04, 1.35, 1.0, 0.75];
const FINAL_DRIVE = 3.15;
const WHEEL_RADIUS = 0.33;
const RED_LINE_RPM = 7200;
const IDLE_RPM = 900;

function getGear(speedMs: number): number {
  if (speedMs < 0) return 0;
  const rpm = (speedMs / WHEEL_RADIUS) * (FINAL_DRIVE * GEAR_RATIOS[0]) * 9.549;
  for (let g = 0; g < GEAR_RATIOS.length; g++) {
    const gearRpm = (speedMs / WHEEL_RADIUS) * (FINAL_DRIVE * GEAR_RATIOS[g]) * 9.549;
    if (gearRpm < RED_LINE_RPM * 0.85 || g === GEAR_RATIOS.length - 1) return g + 1;
  }
  return GEAR_RATIOS.length;
}

function getWheelRPM(speedMs: number, gear: number): number {
  if (gear === 0 || speedMs <= 0) return IDLE_RPM;
  const ratio = GEAR_RATIOS[Math.min(gear - 1, GEAR_RATIOS.length - 1)];
  return Math.max(IDLE_RPM, (speedMs / WHEEL_RADIUS) * ratio * FINAL_DRIVE * 9.549);
}

// Visual car - BMW M5 E34 silhouette
function CarModel({ wheelRPM }: { wheelRPM: number }) {
  const flWheelRef = useRef<THREE.Mesh>(null);
  const frWheelRef = useRef<THREE.Mesh>(null);
  const rlWheelRef = useRef<THREE.Mesh>(null);
  const rrWheelRef = useRef<THREE.Mesh>(null);
  const [, getKeys] = useKeyboardControls<Controls>();

  useFrame((_, delta) => {
    const spinDelta = (wheelRPM * Math.PI * 2) / 60 * delta;
    [flWheelRef, frWheelRef, rlWheelRef, rrWheelRef].forEach(ref => {
      if (ref.current) ref.current.rotation.x -= spinDelta;
    });

    // Steering visual on front wheels
    const keys = getKeys();
    const targetSteer = (keys.left ? -0.45 : 0) + (keys.right ? 0.45 : 0);
    if (flWheelRef.current) flWheelRef.current.parent!.rotation.y += (targetSteer - flWheelRef.current.parent!.rotation.y) * 0.2;
    if (frWheelRef.current) frWheelRef.current.parent!.rotation.y += (targetSteer - frWheelRef.current.parent!.rotation.y) * 0.2;
  });

  const bodyColor = "#1a3a6b";
  const rimColor = "#C0C0C0";
  const tireColor = "#1a1a1a";

  function Wheel({ meshRef, x, z }: { meshRef: React.RefObject<THREE.Mesh | null>; x: number; z: number }) {
    return (
      <group position={[x, -0.15, z]}>
        {/* Tire */}
        <mesh ref={meshRef} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.22, 16]} />
          <meshStandardMaterial color={tireColor} roughness={0.9} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.23, 12]} />
          <meshStandardMaterial color={rimColor} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Brake disc */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.45, 0.1]} castShadow>
        <boxGeometry args={[1.82, 0.68, 4.55]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 0.94, 0.25]} castShadow>
        <boxGeometry args={[1.68, 0.46, 2.5]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.82, -0.8]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[1.55, 0.48, 0.06]} />
        <meshStandardMaterial color="#4080C0" transparent opacity={0.5} metalness={0.1} roughness={0.05} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.82, 1.35]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[1.55, 0.4, 0.06]} />
        <meshStandardMaterial color="#4080C0" transparent opacity={0.5} metalness={0.1} roughness={0.05} />
      </mesh>

      {/* Hood slope */}
      <mesh position={[0, 0.55, -1.9]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.72, 0.1, 1.0]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Trunk */}
      <mesh position={[0, 0.55, 1.85]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.72, 0.12, 0.9]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.22, -2.38]} castShadow>
        <boxGeometry args={[1.76, 0.3, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.22, 2.38]} castShadow>
        <boxGeometry args={[1.76, 0.3, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.65, 0.38, -2.41]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#FFFAE0" emissive="#FFFAE0" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.65, 0.38, -2.41]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#FFFAE0" emissive="#FFFAE0" emissiveIntensity={2} />
      </mesh>

      {/* Headlight point lights */}
      <pointLight position={[-0.65, 0.38, -3]} intensity={8} distance={25} color="#FFFAE0" />
      <pointLight position={[0.65, 0.38, -3]} intensity={8} distance={25} color="#FFFAE0" />

      {/* Taillights */}
      <mesh position={[-0.65, 0.38, 2.41]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#FF2200" emissive="#FF2200" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.65, 0.38, 2.41]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#FF2200" emissive="#FF2200" emissiveIntensity={1.5} />
      </mesh>

      {/* Side mirrors */}
      <mesh position={[-0.96, 0.75, -0.55]}>
        <boxGeometry args={[0.1, 0.1, 0.25]} />
        <meshStandardMaterial color="#0d2040" />
      </mesh>
      <mesh position={[0.96, 0.75, -0.55]}>
        <boxGeometry args={[0.1, 0.1, 0.25]} />
        <meshStandardMaterial color="#0d2040" />
      </mesh>

      {/* M badge stripe on side */}
      <mesh position={[-0.92, 0.38, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.3]} />
        <meshStandardMaterial color="#4488FF" />
      </mesh>

      {/* Wheels - front (steerable) */}
      <group>
        <Wheel meshRef={flWheelRef} x={-0.92} z={-1.38} />
      </group>
      <group>
        <Wheel meshRef={frWheelRef} x={0.92} z={-1.38} />
      </group>

      {/* Wheels - rear */}
      <group>
        <Wheel meshRef={rlWheelRef} x={-0.92} z={1.38} />
      </group>
      <group>
        <Wheel meshRef={rrWheelRef} x={0.92} z={1.38} />
      </group>

      {/* Exhaust tips */}
      <mesh position={[-0.45, 0.12, 2.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.15, 8]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.3, 0.12, 2.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.15, 8]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

const Car = forwardRef<CarRef>(function Car(_, ref) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const [, getKeys] = useKeyboardControls<Controls>();
  const gameState = useGameStore((s) => s.gameState);
  const updateSpeed = useGameStore((s) => s.actions.updateSpeed);

  const stateRef = useRef<CarState>({
    position: new THREE.Vector3(90, 1.2, 0),
    quaternion: new THREE.Quaternion(),
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    speed: 0,
    slipAngle: 0,
    isHandbraking: false,
    wheelRPM: IDLE_RPM,
    gear: 1,
  });

  const wheelRPMRef = useRef(IDLE_RPM);

  useImperativeHandle(ref, () => ({
    getState: () => stateRef.current,
  }));

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    if (gameState !== "PLAYING") return;

    const keys = getKeys();
    const { forward, back, left, right, handbrake } = keys;

    // Get physics state
    const t = body.translation();
    const r = body.rotation();
    const lv = body.linvel();
    const av = body.angvel();

    const pos = new THREE.Vector3(t.x, t.y, t.z);
    const quat = new THREE.Quaternion(r.x, r.y, r.z, r.w);

    // Car local axes
    const carForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const carRight = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

    // Velocity
    const vel = new THREE.Vector3(lv.x, lv.y, lv.z);
    const velH = new THREE.Vector3(lv.x, 0, lv.z); // horizontal velocity
    const speed = velH.length();
    const forwardSpeed = velH.dot(carForward);
    const lateralSpeed = velH.dot(carRight);

    // Slip angle (degrees) - angle between velocity and car forward
    let slipAngle = 0;
    if (speed > 1) {
      const velDir = velH.clone().normalize();
      const dot = THREE.MathUtils.clamp(carForward.dot(velDir), -1, 1);
      const cross = carForward.clone().cross(velDir).y;
      slipAngle = Math.abs(Math.atan2(cross, dot) * THREE.MathUtils.RAD2DEG);
    }

    const gear = getGear(Math.abs(forwardSpeed));
    const rpm = getWheelRPM(Math.abs(forwardSpeed), gear);
    wheelRPMRef.current = rpm;

    // Update state ref
    stateRef.current = {
      position: pos,
      quaternion: quat,
      velocity: vel,
      angularVelocity: new THREE.Vector3(av.x, av.y, av.z),
      speed,
      slipAngle,
      isHandbraking: handbrake,
      wheelRPM: rpm,
      gear,
    };

    updateSpeed(speed);

    // --- DRIVE FORCE ---
    if (forward && speed < MAX_SPEED_MS) {
      const forceMag = DRIVE_FORCE * Math.max(0.2, 1 - speed / MAX_SPEED_MS);
      body.addForce({ x: carForward.x * forceMag, y: 0, z: carForward.z * forceMag }, true);
    }

    // --- BRAKE / REVERSE ---
    if (back) {
      if (forwardSpeed > 0.5) {
        // Braking
        const brakeMag = Math.min(BRAKE_FORCE, speed * CAR_MASS * 1.5);
        body.addForce({ x: -carForward.x * brakeMag, y: 0, z: -carForward.z * brakeMag }, true);
      } else if (forwardSpeed > -MAX_SPEED_MS * 0.3) {
        // Reverse
        body.addForce({ x: -carForward.x * REVERSE_FORCE, y: 0, z: -carForward.z * REVERSE_FORCE }, true);
      }
    }

    // --- DRAG ---
    const dragMag = speed * speed * DRAG_COEFFICIENT;
    if (speed > 0) {
      body.addForce({
        x: -velH.x / speed * dragMag,
        y: 0,
        z: -velH.z / speed * dragMag
      }, true);
    }

    // --- STEERING ---
    const steerInput = (left ? -1 : 0) + (right ? 1 : 0);
    if (steerInput !== 0) {
      const speedFactor = Math.max(0.1, Math.min(1, speed / 8));
      const steerReduction = 1 / (1 + speed * STEER_SPEED_SENSITIVITY);
      const effectiveSteer = steerInput * STEER_STRENGTH * speedFactor * steerReduction;
      const dirMult = forwardSpeed >= 0 ? 1 : -1;
      body.addTorque({ x: 0, y: -effectiveSteer * dirMult, z: 0 }, true);
    }

    // Countersteer assist — slightly reduce spin when not steering input
    if (steerInput === 0) {
      body.addTorque({ x: 0, y: -av.y * 1.8, z: 0 }, true);
    }

    // --- LATERAL FRICTION (DRIFT CONTROL) ---
    // Determine grip level
    let lateralGrip: number;
    if (handbrake) {
      lateralGrip = LATERAL_GRIP_HANDBRAKE;
    } else if (forward && slipAngle > 8 && speed > 10) {
      // Power oversteer zone
      lateralGrip = LATERAL_GRIP_THROTTLE_DRIFT;
    } else {
      lateralGrip = LATERAL_GRIP_NORMAL;
    }

    // Cancel lateral velocity proportionally to grip
    const lateralCorrection = lateralSpeed * lateralGrip;
    const newLvX = lv.x - carRight.x * lateralCorrection;
    const newLvZ = lv.z - carRight.z * lateralCorrection;
    body.setLinvel({ x: newLvX, y: lv.y, z: newLvZ }, true);

    // --- KEEP UPRIGHT ---
    // Dampen roll/pitch rotation aggressively
    body.addTorque({ x: -av.x * 8, y: 0, z: -av.z * 8 }, true);

    // Keep on ground (cancel upward velocity if on ground)
    if (t.y < 1.6 && lv.y > 0.1) {
      body.setLinvel({ x: lv.x, y: lv.y * 0.7, z: lv.z }, true);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[90, 1.1, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      mass={CAR_MASS}
      linearDamping={0.15}
      angularDamping={ANGULAR_DAMPING}
      colliders={false}
    >
      <CuboidCollider args={[0.85, 0.38, 2.25]} position={[0, 0.38, 0]} />
      <CarModel wheelRPM={wheelRPMRef.current} />
    </RigidBody>
  );
});

export default Car;
