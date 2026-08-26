import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Component, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CoreObject } from './CoreObject';
import { CORE_LAYERS, CORE_KERNEL_COLOR } from './coreConfig';

type Variant = 'hero' | 'dashboard' | 'scrolly';

interface KnowledgeCoreProps {
  variant?: Variant;
  separation?: number;
  focusLayer?: number | null;
  activeShells?: number | null;
  className?: string;
  scale?: number;
}

function CoreFallback({ activeShells }: { activeShells?: number | null }) {
  return <div className="flex h-full w-full items-center justify-center" aria-hidden><svg viewBox="0 0 240 240" className="h-3/4 w-3/4 max-h-[320px] max-w-[320px]">{CORE_LAYERS.map((l, i) => { const on = activeShells == null || i < activeShells; return <circle key={l.key} cx="120" cy="120" r={30 + i * 26} fill="none" stroke={on ? l.color : '#9fb7b7'} strokeOpacity={on ? 0.7 : 0.28} strokeWidth={i % 2 === 0 ? 1.5 : 1} />; })}<circle cx="120" cy="120" r="14" fill={CORE_KERNEL_COLOR} /></svg></div>;
}

class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function KnowledgeCore({ variant = 'hero', separation = 0, focusLayer = null, activeShells = null, className, scale = 1 }: KnowledgeCoreProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const camZ = variant === 'dashboard' ? 7 : variant === 'hero' ? 5.8 : 6;
  const drift = variant === 'hero' ? 0.06 : 0.035;
  return <div className={cn('relative h-full min-h-0 w-full overflow-hidden', className)}><div className="pointer-events-none absolute inset-0 bg-radial-fade opacity-70" /><CanvasBoundary fallback={<CoreFallback activeShells={activeShells} />}><Canvas className="!absolute !inset-0 !h-full !w-full" dpr={[1, 1.5]} camera={{ position: [0, 0, camZ], fov: 45 }} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }} frameloop="always"><ambientLight intensity={0.42} /><pointLight position={[-4, 4, 5]} intensity={8} color="#0f9488" /><pointLight position={[5, -3, 4]} intensity={5} color="#e07a5f" /><pointLight position={[0, 0, 6]} intensity={4} color="#ffffff" /><group scale={scale}><CoreObject separation={separation} focusLayer={focusLayer} activeShells={activeShells} reducedMotion={reducedMotion} driftSpeed={drift} /></group></Canvas></CanvasBoundary></div>;
}
