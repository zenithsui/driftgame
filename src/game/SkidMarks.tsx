import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CarRef } from "./Car";

const MAX_MARKS = 512;
const SKID_WIDTH = 0.22;

interface SkidMarksProps {
  carRef: React.RefObject<CarRef | null>;
}

export default function SkidMarks({ carRef }: SkidMarksProps) {
  const positionsRef = useRef(new Float32Array(MAX_MARKS * 3));
  const opacitiesRef = useRef(new Float32Array(MAX_MARKS));
  const markCount = useRef(0);
  const lastPositions = useRef<{ l: THREE.Vector3; r: THREE.Vector3 } | null>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_MARKS * 6 * 3); // 2 triangles per mark segment
    const uvs = new Float32Array(MAX_MARKS * 6 * 2);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#000000",
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const addSegment = (l1: THREE.Vector3, r1: THREE.Vector3, l2: THREE.Vector3, r2: THREE.Vector3) => {
    const positions = geometry.attributes.position.array as Float32Array;
    const i = (markCount.current % (MAX_MARKS / 2)) * 6 * 3;

    // Triangle 1: l1, r1, l2
    positions.set([l1.x, l1.y, l1.z], i);
    positions.set([r1.x, r1.y, r1.z], i + 3);
    positions.set([l2.x, l2.y, l2.z], i + 6);

    // Triangle 2: r1, r2, l2
    positions.set([r1.x, r1.y, r1.z], i + 9);
    positions.set([r2.x, r2.y, r2.z], i + 12);
    positions.set([l2.x, l2.y, l2.z], i + 15);

    geometry.attributes.position.needsUpdate = true;
    markCount.current++;
  };

  useFrame((_, delta) => {
    const state = carRef.current?.getState();
    if (!state) return;

    const { position, quaternion, slipAngle, isHandbraking, speed } = state;
    const isSkidding = (slipAngle > 14 || isHandbraking) && speed > 3;

    if (isSkidding) {
      const carRight = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
      const carForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      const rearCenter = position.clone().add(carForward.clone().multiplyScalar(-1.38));
      rearCenter.y = 0.02;

      const lPos = rearCenter.clone().add(carRight.clone().multiplyScalar(-0.92));
      const rPos = rearCenter.clone().add(carRight.clone().multiplyScalar(0.92));

      // Add skid marks for each rear wheel
      if (lastPositions.current) {
        const { l: lPrev, r: rPrev } = lastPositions.current;
        const distL = lPos.distanceTo(lPrev);
        const distR = rPos.distanceTo(rPrev);

        if (distL > 0.15 || distR > 0.15) {
          const halfW = SKID_WIDTH * 0.5;
          // Left tire mark
          addSegment(
            lPrev.clone().add(carRight.clone().multiplyScalar(-halfW)),
            lPrev.clone().add(carRight.clone().multiplyScalar(halfW)),
            lPos.clone().add(carRight.clone().multiplyScalar(-halfW)),
            lPos.clone().add(carRight.clone().multiplyScalar(halfW))
          );
          // Right tire mark
          addSegment(
            rPrev.clone().add(carRight.clone().multiplyScalar(-halfW)),
            rPrev.clone().add(carRight.clone().multiplyScalar(halfW)),
            rPos.clone().add(carRight.clone().multiplyScalar(-halfW)),
            rPos.clone().add(carRight.clone().multiplyScalar(halfW))
          );

          lastPositions.current = { l: lPos, r: rPos };
        }
      } else {
        lastPositions.current = { l: lPos, r: rPos };
      }
    } else {
      lastPositions.current = null;
    }
  });

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} />
  );
}
