import type { MilestoneResponse, MilestoneStatus } from '@/types';

export type ConstellationMilestone = Pick<MilestoneResponse, 'id' | 'status' | 'sequenceOrder'>;

export interface MilestoneConstellationProps {
  milestones?: ConstellationMilestone[];
  progressPercent?: number;
  className?: string;
}

export interface ConstellationPoint {
  milestone?: ConstellationMilestone;
  x: number;
  y: number;
  z: number;
  index: number;
}

const POSITIONS = [
  [-2.8, 1.0, 0.15],
  [-1.9, -0.55, 0.35],
  [-0.7, 0.85, -0.1],
  [0.15, -0.72, 0.25],
  [1.15, 0.68, -0.2],
  [2.25, -0.35, 0.15],
  [2.95, 1.1, -0.05],
  [1.65, 1.55, 0.3],
  [0.15, 1.7, -0.3],
  [-1.25, 1.85, 0.15],
  [-2.65, -1.2, -0.2],
  [2.55, -1.5, -0.25],
] as const;

export function getConstellationPoints(milestones: ConstellationMilestone[] = []): ConstellationPoint[] {
  const ordered = [...milestones]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .slice(0, POSITIONS.length);

  return POSITIONS.map(([x, y, z], index) => ({
    milestone: ordered[index],
    x,
    y,
    z,
    index,
  })).filter((point) => point.milestone);
}

export function statusColor(status?: MilestoneStatus): string {
  if (status === 'COMPLETED') return '#2fae7d';
  if (status === 'IN_PROGRESS') return '#0f9488';
  return '#8a979d';
}

export function statusLabel(status?: MilestoneStatus): string {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'IN_PROGRESS') return 'active';
  return 'queued';
}
