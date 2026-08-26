import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Wordmark: a minimal concentric-core glyph + name. */
export function Logo({
  className,
  to = '/',
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Knowledge Core home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ion/25 bg-accent-tint transition-colors group-hover:border-ion/60">
        <svg width="20" height="20" viewBox="0 0 26 26" fill="none" aria-hidden>
          <circle cx="13" cy="13" r="10.5" stroke="#0f9488" strokeOpacity="0.35" />
          <circle cx="13" cy="13" r="6.5" stroke="#0f9488" strokeOpacity="0.85" />
          <circle cx="13" cy="13" r="2.8" fill="#0f9488" />
        </svg>
      </span>
      <span className="font-sans text-lg font-bold tracking-tight text-text">
        Knowledge<span className="text-ion"> Core</span>
      </span>
    </Link>
  );
}
