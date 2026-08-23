import { cn } from '@/lib/cn';

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface/80 backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** `title` widens to ReactNode, so the native string-only HTML attribute is omitted. */
interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
}

/** Card with an optional titled header row and an action slot. */
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
  ...props
}: PanelProps) {
  return (
    <Card className={cn('overflow-hidden', className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
            {title && (
              <h3 className="truncate font-display text-xl text-text">{title}</h3>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Card>
  );
}
