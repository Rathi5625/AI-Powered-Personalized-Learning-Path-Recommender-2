import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { LearningPathResponse } from '@/types';
import { dashboardKey } from './useDashboard';

export const learningPathKeys = {
  detail: (id: number | string) => ['learningPath', id] as const,
  mine: ['learningPaths', 'me'] as const,
};

export function useLearningPath(id: number | string | undefined) {
  return useQuery({
    queryKey: learningPathKeys.detail(id ?? 'none'),
    queryFn: async () => {
      const res = await api.get<LearningPathResponse>(`/learning-paths/${id}`);
      return res.data;
    },
    enabled: id !== undefined && id !== null && id !== '',
  });
}

/** GET /learning-paths/me returns an ARRAY (not a page). */
export function useMyLearningPaths() {
  return useQuery({
    queryKey: learningPathKeys.mine,
    queryFn: async () => {
      const res = await api.get<LearningPathResponse[]>('/learning-paths/me');
      return res.data;
    },
  });
}

export function useGeneratePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { goalDescription: string }) => {
      const res = await api.post<LearningPathResponse>(
        '/learning-paths/generate',
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKey });
      qc.invalidateQueries({ queryKey: learningPathKeys.mine });
    },
  });
}

/** Field name is `feedback` (not feedbackText — that is the milestone feedback endpoint). */
export function useRegeneratePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      feedback,
    }: {
      id: number | string;
      feedback: string;
    }) => {
      const res = await api.post<LearningPathResponse>(
        `/learning-paths/${id}/regenerate`,
        { feedback },
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: dashboardKey });
      qc.invalidateQueries({ queryKey: learningPathKeys.mine });
      qc.invalidateQueries({ queryKey: learningPathKeys.detail(data.id) });
    },
  });
}
