import { CheckCircle2, CircleDashed, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { MilestoneStatus, CourseLevel, ResourceType } from '@/types';

export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'ion' | 'ember' | 'success' | 'danger';
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line bg-surface-alt text-muted',
    ion: 'border-ion/20 bg-accent-tint text-ion-deep',
    ember: 'border-ember/25 bg-ember/10 text-ember-deep',
    success: 'border-success/25 bg-success/10 text-success-deep',
    danger: 'border-danger/25 bg-danger/10 text-danger',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Milestone status — never conveyed by color alone (icon + label + color). */
export function StatusPill({ status }: { status: MilestoneStatus }) {
  const map = {
    COMPLETED: {
      label: 'Completed',
      icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />,
      cls: 'border-success/30 bg-success/10 text-success-deep',
    },
    IN_PROGRESS: {
      label: 'In progress',
      icon: <PlayCircle className="h-3.5 w-3.5" aria-hidden />,
      cls: 'border-ion/30 bg-accent-tint text-ion-deep',
    },
    NOT_STARTED: {
      label: 'Not started',
      icon: <CircleDashed className="h-3.5 w-3.5" aria-hidden />,
      cls: 'border-line bg-surface-alt text-muted',
    },
  } as const;
  const s = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        s.cls,
      )}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

const levelTone: Record<CourseLevel, 'success' | 'ion' | 'ember' | 'danger'> = {
  BEGINNER: 'success',
  EASY: 'ion',
  MEDIUM: 'ember',
  HIGH: 'danger',
};

export function LevelBadge({ level }: { level?: CourseLevel | string | null }) {
  const labels: Record<string, string> = {
    BEGINNER: 'Beginner',
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HIGH: 'Advanced',
  };
  const tone = (level && (levelTone as any)[level]) || 'ion';
  const label = (level && labels[level]) || (level ? String(level) : 'Beginner');
  return <Badge tone={tone}>{label}</Badge>;
}

export function ResourceTypeBadge({ type }: { type?: ResourceType | string | null }) {
  const isVideo = type === 'VIDEO';
  return (
    <Badge tone={isVideo ? 'ember' : 'ion'}>
      {isVideo ? 'Video' : 'Course'}
    </Badge>
  );
}
