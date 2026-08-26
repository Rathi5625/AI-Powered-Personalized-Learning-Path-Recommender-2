import { Line } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, type PointerEvent as ReactPointerEvent, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { getConstellationPoints, statusColor, type ConstellationMilestone } from './milestoneConstellationConfig';

interface MilestoneConstellationCanvasProps {
  milestones?: ConstellationMilestone[];
  progressPercent?: number;
  reducedMotion: boolean;
}

type ScopedPointer = { x: number; y: number };

function Waypoint({ point, reducedMotion }: { point: ReturnType<typeof getConstellationPoints>[number]; reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const status = point.milestone?.status;
  const isActive = status === 'IN_PROGRESS';
  const color = statusColor(status);

  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return;
    const pulse = isActive ? 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.08 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 1 - Math.pow(0.001, delta));
  });

  return (
    <mesh ref={meshRef} position={[point.x, point.y, point.z]}>
      <icosahedronGeometry args={[isActive ? 0.18 : 0.13, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 0.8 : status === 'COMPLETED' ? 0.25 : 0.05}
        roughness={0.78}
        metalness={0.04}
      />
    </mesh>
  );
}

function ConstellationScene({
  milestones,
  reducedMotion,
  pointerRef,
}: {
  milestones: ConstellationMilestone[];
  reducedMotion: boolean;
  pointerRef: MutableRefObject<ScopedPointer>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const points = useMemo(() => getConstellationPoints(milestones), [milestones]);
  const linePoints = useMemo(() => points.map((point) => [point.x, point.y, point.z] as [number, number, number]), [points]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || reducedMotion) return;
    const { x: pointerX, y: pointerY } = pointerRef.current;
    const pointerTargetX = pointerY * 0.1;
    const pointerTargetY = pointerX * 0.14 + Math.sin(state.clock.elapsedTime * 0.16) * 0.025;
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, pointerTargetX, 3, delta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, pointerTargetY, 3, delta);
  });

  return (
    <group ref={groupRef}>
      <Line points={linePoints} color="#75b8b4" lineWidth={1.1} transparent opacity={0.72} dashed dashSize={0.08} gapSize={0.06} />
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial color="#e7f4f2" emissive="#0f9488" emissiveIntensity={0.75} roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.405, 48]} />
        <meshBasicMaterial color="#75b8b4" transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      {points.map((point) => <Waypoint key={point.milestone?.id ?? point.index} point={point} reducedMotion={reducedMotion} />)}
    </group>
  );
}

export default function MilestoneConstellationCanvas({ milestones = [], reducedMotion }: MilestoneConstellationCanvasProps) {
  const pointerRef = useRef<ScopedPointer>({ x: 0, y: 0 });

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const handlePointerLeave = () => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7.6], fov: 42 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        frameloop="always"
        role="img"
        aria-label="Interactive milestone constellation"
      >
        <ambientLight intensity={0.48} />
        <directionalLight position={[-3, 4, 5]} intensity={1.6} color="#dfeeee" />
        <pointLight position={[0, 0, 3]} intensity={7} distance={9} color="#0f9488" />
        <ConstellationScene milestones={milestones} reducedMotion={reducedMotion} pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
}
