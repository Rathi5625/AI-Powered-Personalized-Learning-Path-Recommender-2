import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Wordmark: a minimal concentric-core glyph + name. The glyph echoes the Knowledge Core. */
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
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <circle cx="13" cy="13" r="11.5" stroke="#262B37" />
        <circle
          cx="13"
          cy="13"
          r="7.5"
          stroke="#5BD1E0"
          strokeOpacity="0.7"
          className="transition-[stroke-opacity] group-hover:stroke-[#5BD1E0]"
        />
        <circle cx="13" cy="13" r="3.2" fill="#DFF6FA" />
      </svg>
      <span className="font-display text-lg tracking-tight text-text">
        Knowledge<span className="text-muted"> Core</span>
      </span>
    </Link>
  );
}
