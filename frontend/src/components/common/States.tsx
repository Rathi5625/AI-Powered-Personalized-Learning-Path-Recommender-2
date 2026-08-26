import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function LoadingSpinner({
  label,
  className,
  size = 20,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn('flex items-center justify-center gap-3 text-muted', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="animate-spin text-ion" style={{ width: size, height: size }} aria-hidden />
      {label && <span className="font-mono text-hud uppercase">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </div>
  );
}

/** Full-height centered loader for route-level pending states. */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner label={label} />
    </div>
  );
}

export function ErrorState({
  title = 'Something broke',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-danger/25 bg-danger/5 px-6 py-10 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
      <div>
        <p className="font-semibold text-text">{title}</p>
        {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center shadow-card-soft',
        className,
      )}
    >
      <div className="text-ion" aria-hidden>
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <div>
        <p className="font-semibold text-text">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
