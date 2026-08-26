import { statusColor, statusLabel, getConstellationPoints, type MilestoneConstellationProps } from './milestoneConstellationConfig';

export function MilestoneConstellationFallback({ milestones = [], progressPercent = 0, className }: MilestoneConstellationProps) {
  const points = getConstellationPoints(milestones);
  const completed = milestones.filter((milestone) => milestone.status === 'COMPLETED').length;
  const active = milestones.filter((milestone) => milestone.status === 'IN_PROGRESS').length;
  const queued = Math.max(0, milestones.length - completed - active);
  const coordinates = points.map((point) => `${50 + point.x * 12},${50 - point.y * 16}`).join(' ');

  return (
    <div className={className} role="img" aria-label={`Milestone constellation showing ${completed} completed, ${active} active, and ${queued} queued milestones.`}>
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="constellationFallbackGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f9488" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#0f9488" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="28" fill="url(#constellationFallbackGlow)" />
        <circle cx="50" cy="50" r="7" fill="#e7f4f2" fillOpacity="0.95" />
        <circle cx="50" cy="50" r="9" fill="none" stroke="#0f9488" strokeOpacity="0.55" />
        {points.length > 1 && <polyline points={coordinates} fill="none" stroke="#75b8b4" strokeOpacity="0.65" strokeWidth="0.7" strokeDasharray="1.5 1.5" />}
        {points.map((point) => {
          const cx = 50 + point.x * 12;
          const cy = 50 - point.y * 16;
          const color = statusColor(point.milestone?.status);
          return (
            <g key={point.milestone?.id ?? point.index}>
              <circle cx={cx} cy={cy} r={point.milestone?.status === 'IN_PROGRESS' ? 3.1 : 2.3} fill={color} fillOpacity={point.milestone?.status === 'NOT_STARTED' ? 0.55 : 0.95} />
              <circle cx={cx} cy={cy} r={point.milestone?.status === 'IN_PROGRESS' ? 5.4 : 3.8} fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="0.7" />
            </g>
          );
        })}
      </svg>
      <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-dark-2/75 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-dark-text/65">
        {progressPercent}% path progress
      </div>
      <div className="sr-only">
        {points.map((point) => `${point.milestone?.sequenceOrder}: ${statusLabel(point.milestone?.status)}`).join('; ')}
      </div>
    </div>
  );
}
