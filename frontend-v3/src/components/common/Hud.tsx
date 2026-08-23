import { cn } from '@/lib/cn';

/** Small monospace uppercase label used to introduce sections. */
export function Eyebrow({
  children,
  className,
  tone = 'ion',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'ion' | 'ember' | 'muted';
}) {
  return (
    <div
      className={cn(
        'font-mono text-eyebrow uppercase',
        tone === 'ion' && 'text-ion',
        tone === 'ember' && 'text-ember',
        tone === 'muted' && 'text-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A HUD telemetry readout: monospace LABEL with a value, styled like an instrument panel.
 * Used sparingly — hero catalog counter, dashboard milestone counter, layer labels.
 */
export function HudReadout({
  label,
  value,
  tone = 'ion',
  className,
  live,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'ion' | 'ember' | 'muted';
  className?: string;
  live?: boolean;
}) {
  const toneColor =
    tone === 'ember' ? 'text-ember' : tone === 'muted' ? 'text-muted' : 'text-ion';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 font-mono text-hud uppercase',
        className,
      )}
    >
      {live && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full animate-pulse-soft',
            tone === 'ember' ? 'bg-ember' : 'bg-ion',
          )}
          aria-hidden
        />
      )}
      <span className="text-muted-dim">{label}</span>
      <span className={cn('tracking-normal', toneColor)}>{value}</span>
    </div>
  );
}

/**
 * Wraps content with thin HUD corner ticks and an optional top-corner label.
 * Purely decorative chrome; keep off ordinary forms.
 */
export function HudFrame({
  children,
  className,
  label,
  scanline,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  scanline?: boolean;
}) {
  const corner = 'pointer-events-none absolute h-3 w-3 border-muted/40';
  return (
    <div className={cn('relative', className)}>
      <span className={cn(corner, 'left-0 top-0 border-l border-t')} />
      <span className={cn(corner, 'right-0 top-0 border-r border-t')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b border-l')} />
      <span className={cn(corner, 'bottom-0 right-0 border-b border-r')} />
      {label && (
        <span className="absolute -top-2 left-4 bg-void px-2 font-mono text-hud uppercase text-muted-dim">
          {label}
        </span>
      )}
      {scanline && (
        <span className="scanline pointer-events-none absolute inset-0 opacity-40" />
      )}
      {children}
    </div>
  );
}
