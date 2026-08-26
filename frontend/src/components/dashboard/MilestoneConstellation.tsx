import { lazy, Suspense, Component, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MilestoneConstellationFallback } from './MilestoneConstellationFallback';
import type { MilestoneConstellationProps } from './milestoneConstellationConfig';

const MilestoneConstellationCanvas = lazy(() => import('./MilestoneConstellationCanvas'));

class ConstellationBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function MilestoneConstellation({ milestones = [], progressPercent = 0, className }: MilestoneConstellationProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const fallback = <MilestoneConstellationFallback milestones={milestones} progressPercent={progressPercent} className="absolute inset-0" />;

  return (
    <div
      className={cn('relative isolate h-full min-h-[240px] w-full overflow-hidden', className)}
      style={{ contain: 'layout paint' }}
    >
      <ConstellationBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <MilestoneConstellationCanvas milestones={milestones} progressPercent={progressPercent} reducedMotion={reducedMotion} />
        </Suspense>
      </ConstellationBoundary>
    </div>
  );
}
