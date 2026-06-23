import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Drift circuit: stadium oval with wide hairpins
// Outer boundary ellipse: 105m x 145m
// Inner boundary ellipse: 45m x 75m
// Track width varies ~40m (wide for sliding)

const OUTER_A = 105; // semi-major (X)
const OUTER_B = 145; // semi-minor (Z)
const INNER_A = 45;
const INNER_B = 75;
const WALL_HEIGHT = 1.5;
const WALL_THICKNESS = 0.8;
const N_WALL_SEGMENTS = 40; // walls per oval

function generateOvalPoints(a: number, b: number, n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(a * Math.cos(theta), 0, b * Math.sin(theta)));
  }
  return pts;
}

function WallSegments({ a, b, n, isInner }: { a: number; b: number; n: number; isInner: boolean }) {
  const pts = useMemo(() => generateOvalPoints(a, b, n), [a, b, n]);

  return (
    <>
      {pts.map((pt, i) => {
        const next = pts[(i + 1) % pts.length];
        const dir = new THREE.Vector3().subVectors(next, pt);
        const len = dir.length();
        const angle = Math.atan2(dir.x, dir.z);
        const mid = new THREE.Vector3().addVectors(pt, next).multiplyScalar(0.5);

        return (
          <RigidBody key={i} type="fixed" position={[mid.x, WALL_HEIGHT / 2, mid.z]}>
            <mesh rotation={[0, angle, 0]} castShadow receiveShadow>
              <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, len]} />
              <meshStandardMaterial
                color={isInner ? "#CC2200" : "#CC2200"}
                roughness={0.5}
                metalness={0.2}
              />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}

function TrackSurface() {
  const shape = useMemo(() => {
    const outerPts: THREE.Vector2[] = [];
    const innerPts: THREE.Vector2[] = [];
    const N = 80;

    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * Math.PI * 2;
      outerPts.push(new THREE.Vector2(OUTER_A * Math.cos(theta), OUTER_B * Math.sin(theta)));
    }
    for (let i = N; i >= 0; i--) {
      const theta = (i / N) * Math.PI * 2;
      innerPts.push(new THREE.Vector2(INNER_A * Math.cos(theta), INNER_B * Math.sin(theta)));
    }

    const shape = new THREE.Shape(outerPts);
    const hole = new THREE.Path(innerPts);
    shape.holes.push(hole);
    return shape;
  }, []);

  const geometry = useMemo(
    () => new THREE.ShapeGeometry(shape, 64),
    [shape]
  );

  // Rotate geometry so it lies flat on XZ plane
  const geo = useMemo(() => {
    const g = geometry.clone();
    g.rotateX(-Math.PI / 2);
    return g;
  }, [geometry]);

  return (
    <mesh geometry={geo} receiveShadow position={[0, 0.01, 0]}>
      <meshStandardMaterial
        color="#1a1a1a"
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}

function RunoffArea() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#2d4a1e" roughness={0.95} />
    </mesh>
  );
}

function StartFinishLine() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[OUTER_A - 10, 0.02, 0]}>
      <planeGeometry args={[18, 3]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

function TrackMarkings() {
  const centerLinePts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 120;
    const midA = (OUTER_A + INNER_A) / 2;
    const midB = (OUTER_B + INNER_B) / 2;
    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(midA * Math.cos(theta), 0.015, midB * Math.sin(theta)));
    }
    return pts;
  }, []);

  const centerLineCurve = useMemo(
    () => new THREE.CatmullRomCurve3(centerLinePts, true),
    [centerLinePts]
  );

  const centerLineGeo = useMemo(() => {
    const pts = centerLineCurve.getPoints(200);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, [centerLineCurve]);

  return (
    <lineLoop geometry={centerLineGeo}>
      <lineBasicMaterial color="#FFD700" linewidth={2} transparent opacity={0.4} />
    </lineLoop>
  );
}

function Barriers() {
  // Tire stacks along inner wall — visual only
  const positions = useMemo(() => {
    const pts: { x: number; z: number; angle: number }[] = [];
    const N = 20;
    for (let i = 0; i < N; i++) {
      const theta = (i / N) * Math.PI * 2;
      const x = INNER_A * Math.cos(theta);
      const z = INNER_B * Math.sin(theta);
      const nx = INNER_A * Math.cos(theta + 0.15);
      const nz = INNER_B * Math.sin(theta + 0.15);
      const angle = Math.atan2(nx - x, nz - z);
      pts.push({ x, z, angle });
    }
    return pts;
  }, []);

  return (
    <>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, 0.3, p.z]} rotation={[0, p.angle, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.6, 8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#FF3300" : "#FFFFFF"}
            roughness={0.7}
          />
        </mesh>
      ))}
    </>
  );
}

export default function Track() {
  return (
    <group>
      {/* Physics ground */}
      <RigidBody type="fixed">
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[600, 1, 600]} />
          <meshStandardMaterial color="#1a2a10" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Visual track surface */}
      <TrackSurface />
      <RunoffArea />
      <StartFinishLine />
      <TrackMarkings />
      <Barriers />

      {/* Physics walls */}
      <WallSegments a={OUTER_A} b={OUTER_B} n={N_WALL_SEGMENTS} isInner={false} />
      <WallSegments a={INNER_A} b={INNER_B} n={N_WALL_SEGMENTS} isInner={true} />

      {/* Grandstand lights (visual poles) */}
      {[-120, 0, 120].map((z, i) => (
        <group key={i} position={[OUTER_A + 10, 0, z]}>
          <mesh position={[0, 8, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 16, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
          </mesh>
          <pointLight position={[0, 16, 0]} intensity={3} distance={80} color="#FFF5E0" castShadow />
        </group>
      ))}
      {[-120, 0, 120].map((z, i) => (
        <group key={`l${i}`} position={[-(OUTER_A + 10), 0, z]}>
          <mesh position={[0, 8, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 16, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
          </mesh>
          <pointLight position={[0, 16, 0]} intensity={3} distance={80} color="#FFF5E0" castShadow />
        </group>
      ))}
    </group>
  );
}
