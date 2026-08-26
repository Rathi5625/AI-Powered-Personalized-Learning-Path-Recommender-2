import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CORE_KERNEL_COLOR, CORE_LAYERS, type CoreLayer } from './coreConfig';

const DORMANT_COLOR = '#9fb7b7';

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
  const p = useRef({ separation, focusLayer, active });
  p.current = { separation, focusLayer, active };

  const baseOpacity = layer.mode === 'wireframe' ? 0.58 : 0.44;
  const color = useMemo(() => new THREE.Color(active ? layer.color : DORMANT_COLOR), [active, layer.color]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const { separation: sep, focusLayer: focus, active: isActive } = p.current;
    const anyFocus = focus !== null;
    const isFocused = focus === layer.index;
    const spread = 1 + sep * 0.12 * (layer.index + 1) + (isFocused ? 0.22 : 0);
    const targetScale = spread * (anyFocus && !isFocused ? 0.94 : 1);
    const targetZ = isFocused ? 0.55 : anyFocus ? -0.25 : 0;
    const targetOpacity = !isActive ? 0.08 : anyFocus ? (isFocused ? 0.9 : 0.14) : baseOpacity;
    const targetEmissive = !isActive ? 0.02 : isFocused ? 0.65 : anyFocus ? 0.12 : 0.28;
    const k = 1 - Math.pow(0.001, delta);
    mesh.scale.setScalar(lerp(mesh.scale.x, targetScale, k));
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

  return <mesh ref={meshRef}>
    <icosahedronGeometry args={[layer.radius, layer.detail]} />
    <meshStandardMaterial ref={matRef} color={layer.color} emissive={layer.color} emissiveIntensity={0.28} metalness={0.04} roughness={0.78} transparent opacity={baseOpacity} wireframe={layer.mode === 'wireframe'} flatShading={layer.mode === 'faceted'} depthWrite={false} />
  </mesh>;
}

function Kernel({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || reducedMotion) return;
    mesh.rotation.y += 0.16 * delta;
    mesh.rotation.x += 0.04 * delta;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.025;
    mesh.scale.setScalar(pulse);
  });
  return <mesh ref={meshRef}>
    <icosahedronGeometry args={[0.5, 1]} />
    <meshStandardMaterial color={CORE_KERNEL_COLOR} emissive="#0f9488" emissiveIntensity={0.55} metalness={0.04} roughness={0.72} />
  </mesh>;
}

export interface CoreObjectProps {
  separation?: number;
  focusLayer?: number | null;
  activeShells?: number | null;
  reducedMotion?: boolean;
  driftSpeed?: number;
}

export function CoreObject({ separation = 0, focusLayer = null, activeShells = null, reducedMotion = false, driftSpeed = 0.04 }: CoreObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g || reducedMotion) return;
    g.rotation.y += driftSpeed * delta;
    g.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.05;
  });
  return <group ref={groupRef} scale={1}>
    <Kernel reducedMotion={reducedMotion} />
    {CORE_LAYERS.map((layer) => <Shell key={layer.key} layer={layer} separation={separation} focusLayer={focusLayer} active={activeShells === null ? true : layer.index < activeShells} reducedMotion={reducedMotion} />)}
  </group>;
}
