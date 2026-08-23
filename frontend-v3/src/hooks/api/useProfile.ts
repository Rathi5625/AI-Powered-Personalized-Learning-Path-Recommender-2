import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { LearnerProfileResponse, ProfileUpdateRequest } from '@/types';

export const profileKey = ['profile', 'me'] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: async () => {
      const res = await api.get<LearnerProfileResponse>('/profile/me');
      return res.data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProfileUpdateRequest) => {
      const res = await api.put<LearnerProfileResponse>('/profile/me', data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(profileKey, data);
    },
  });
}

export function useMarkCourseCompleted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId }: { courseId: number | string }) => {
      const res = await api.post<LearnerProfileResponse>(
        `/profile/me/completed-courses/${courseId}`,
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(profileKey, data);
    },
  });
}
