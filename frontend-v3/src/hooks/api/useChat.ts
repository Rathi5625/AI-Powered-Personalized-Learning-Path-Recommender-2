import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { ChatResponse } from '@/types';
import { dashboardKey } from './useDashboard';
import { learningPathKeys } from './useLearningPath';

/**
 * Onboarding chat. `sessionId` is REQUIRED by the backend (@NotBlank) — generate one
 * per onboarding session with crypto.randomUUID() and reuse it for every turn.
 */
export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { message: string; sessionId: string }) => {
      const res = await api.post<ChatResponse>('/chat/message', data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.profileUpdated || data.learningPathId) {
        qc.invalidateQueries({ queryKey: dashboardKey });
        qc.invalidateQueries({ queryKey: learningPathKeys.mine });
        qc.invalidateQueries({ queryKey: ['profile', 'me'] });
      }
    },
  });
}
