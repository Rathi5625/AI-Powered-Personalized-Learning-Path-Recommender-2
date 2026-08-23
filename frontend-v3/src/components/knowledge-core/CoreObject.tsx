import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CORE_KERNEL_COLOR, CORE_LAYERS, type CoreLayer } from './coreConfig';

const DORMANT_COLOR = '#39404e';

function lerp(a: number, b: number, t: number) {
  return THREE.MathUtils.lerp(a, b, t);
}

interface ShellProps {
  layer: CoreLayer;
  separation: number;
  focusLayer: number | null;
  active: boolean;
  reducedMotion: boolean;
}

function Shell({ layer, separation, focusLayer, active, reducedMotion }: ShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Latest driving values, read inside the frame loop.
  const p = useRef({ separation, focusLayer, active });
  p.current = { separation, focusLayer, active };

  const baseOpacity = layer.mode === 'wireframe' ? 0.62 : 0.5;
  const color = useMemo(
    () => new THREE.Color(active ? layer.color : DORMANT_COLOR),
    [active, layer.color],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const { separation: sep, focusLayer: focus, active: isActive } = p.current;
    const anyFocus = focus !== null;
    const isFocused = focus === layer.index;

    // Radial disassembly + foregrounding.
    const spread = 1 + sep * 0.12 * (layer.index + 1) + (isFocused ? 0.22 : 0);
    const targetScale = spread * (anyFocus && !isFocused ? 0.94 : 1);
    const targetZ = isFocused ? 0.55 : anyFocus ? -0.25 : 0;

    const targetOpacity = !isActive
      ? 0.1
      : anyFocus
        ? isFocused
          ? 0.95
          : 0.14
        : baseOpacity;
    const targetEmissive = !isActive ? 0.06 : isFocused ? 1.15 : anyFocus ? 0.2 : 0.5;

    const k = 1 - Math.pow(0.001, delta); // frame-rate independent smoothing
    const s = mesh.scale.x;
    mesh.scale.setScalar(lerp(s, targetScale, k));
    mesh.position.z = lerp(mesh.position.z, targetZ, k);
    mat.opacity = lerp(mat.opacity, targetOpacity, k);
    mat.emissiveIntensity = lerp(mat.emissiveIntensity, targetEmissive, k);
    mat.color.lerp(color, k);
    mat.emissive.lerp(color, k);

    if (!reducedMotion) {
      mesh.rotation.x += layer.rotate[0] * delta;
      mesh.rotation.y += layer.rotate[1] * delta;
      mesh.rotation.z += layer.rotate[2] * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[layer.radius, layer.detail]} />
      <meshStandardMaterial
        ref={matRef}
        color={layer.color}
        emissive={layer.color}
        emissiveIntensity={0.5}
        metalness={0.1}
        roughness={0.5}
        transparent
        opacity={baseOpacity}
        wireframe={layer.mode === 'wireframe'}
        flatShading={layer.mode === 'faceted'}
        depthWrite={false}
      />
    </mesh>
  );
}

function Kernel({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!reducedMotion) {
      mesh.rotation.y += 0.25 * delta;
      mesh.rotation.x += 0.08 * delta;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
      mesh.scale.setScalar(pulse);
    }
  });
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial
        color={CORE_KERNEL_COLOR}
        emissive={CORE_KERNEL_COLOR}
        emissiveIntensity={1.4}
        metalness={0.2}
        roughness={0.35}
      />
    </mesh>
  );
}

export interface CoreObjectProps {
  separation?: number;
  focusLayer?: number | null;
  /** Number of shells "lit" (dashboard progress mode). null => all active. */
  activeShells?: number | null;
  reducedMotion?: boolean;
  driftSpeed?: number;
}

export function CoreObject({
  separation = 0,
  focusLayer = null,
  activeShells = null,
  reducedMotion = false,
  driftSpeed = 0.06,
}: CoreObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (!reducedMotion) {
      g.rotation.y += driftSpeed * delta;
      // gentle tilt breathing
      g.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={1}>
      <Kernel reducedMotion={reducedMotion} />
      {CORE_LAYERS.map((layer) => (
        <Shell
          key={layer.key}
          layer={layer}
          separation={separation}
          focusLayer={focusLayer}
          active={activeShells === null ? true : layer.index < activeShells}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
