import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  tone?: 'ion' | 'ember' | 'success';
  showLabel?: boolean;
  label?: string;
}

/** Accessible linear progress. Percentage is announced; not color-only. */
export function ProgressBar({
  value,
  max = 100,
  className,
  tone = 'ion',
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill =
    tone === 'ember'
      ? 'bg-ember'
      : tone === 'success'
        ? 'bg-success'
        : 'bg-ion';
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && (
        <div className="flex justify-between font-mono text-hud uppercase text-muted">
          <span>{label ?? 'Progress'}</span>
          <span className="text-text">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-smooth', fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
