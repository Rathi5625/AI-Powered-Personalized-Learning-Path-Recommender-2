import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { MilestoneResponse } from '@/types';
import { dashboardKey } from './useDashboard';
import { learningPathKeys } from './useLearningPath';

function invalidateProgress(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: dashboardKey });
  qc.invalidateQueries({ queryKey: learningPathKeys.mine });
  qc.invalidateQueries({ queryKey: ['learningPath'] });
}

export function useStartMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: number | string }) => {
      const res = await api.post<MilestoneResponse>(
        `/progress/milestones/${milestoneId}/start`,
      );
      return res.data;
    },
    onSuccess: () => invalidateProgress(qc),
  });
}

export function useCompleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: number | string }) => {
      const res = await api.post<MilestoneResponse>(
        `/progress/milestones/${milestoneId}/complete`,
      );
      return res.data;
    },
    onSuccess: () => invalidateProgress(qc),
  });
}

/** Field name is `feedbackText`. The endpoint returns the updated MilestoneResponse. */
export function useMilestoneFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      feedbackText,
    }: {
      milestoneId: string;
      feedbackText: string;
    }) => {
      const res = await api.post<MilestoneResponse>(
        `/progress/milestones/${milestoneId}/feedback`,
        { feedbackText },
      );
      return res.data;
    },
    onSuccess: () => invalidateProgress(qc),
  });
}
