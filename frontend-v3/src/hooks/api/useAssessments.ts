import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type {
  AssessmentResponse,
  AssessmentAttemptResponse,
  AnswerSubmissionItem,
  PageResponse,
} from '@/types';

export const assessmentKeys = {
  detail: (id: number | string) => ['assessment', id] as const,
  attempts: (page: number, size: number) =>
    ['assessmentAttempts', page, size] as const,
};

/** Body is optional; omit `topic` to let the backend pick from reached milestones. */
export function useGenerateAssessment() {
  return useMutation({
    mutationFn: async (data: { topic?: string } = {}) => {
      const res = await api.post<AssessmentResponse>(
        '/assessments/generate',
        data,
      );
      return res.data;
    },
  });
}

export function useAssessment(id: number | string | undefined) {
  return useQuery({
    queryKey: assessmentKeys.detail(id ?? 'none'),
    queryFn: async () => {
      const res = await api.get<AssessmentResponse>(`/assessments/${id}`);
      return res.data;
    },
    enabled: id !== undefined && id !== null && id !== '',
  });
}

export function useSubmitAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      answers,
    }: {
      id: number | string;
      answers: AnswerSubmissionItem[];
    }) => {
      const res = await api.post<AssessmentAttemptResponse>(
        `/assessments/${id}/submit`,
        { answers },
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessmentAttempts'] });
    },
  });
}

export function useMyAttempts(page = 0, size = 10) {
  return useQuery({
    queryKey: assessmentKeys.attempts(page, size),
    queryFn: async () => {
      const res = await api.get<PageResponse<AssessmentAttemptResponse>>(
        '/assessments/me',
        { params: { page, size } },
      );
      return res.data;
    },
  });
}
