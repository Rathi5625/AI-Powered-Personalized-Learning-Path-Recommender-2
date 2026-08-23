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
    neutral: 'border-line bg-surface-2 text-muted',
    ion: 'border-ion/30 bg-ion/10 text-ion',
    ember: 'border-ember/30 bg-ember/10 text-ember',
    success: 'border-success/30 bg-success/10 text-success',
    danger: 'border-danger/30 bg-danger/10 text-danger',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider',
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
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      cls: 'border-success/40 bg-success/10 text-success',
    },
    IN_PROGRESS: {
      label: 'In progress',
      icon: <PlayCircle className="h-3.5 w-3.5" />,
      cls: 'border-ion/40 bg-ion/10 text-ion',
    },
    NOT_STARTED: {
      label: 'Not started',
      icon: <CircleDashed className="h-3.5 w-3.5" />,
      cls: 'border-line bg-surface-2 text-muted',
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

export function LevelBadge({ level }: { level: CourseLevel }) {
  const labels: Record<CourseLevel, string> = {
    BEGINNER: 'Beginner',
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HIGH: 'Advanced',
  };
  return <Badge tone={levelTone[level]}>{labels[level]}</Badge>;
}

export function ResourceTypeBadge({ type }: { type: ResourceType }) {
  return (
    <Badge tone={type === 'VIDEO' ? 'ember' : 'ion'}>
      {type === 'VIDEO' ? 'Video' : 'Course'}
    </Badge>
  );
}
