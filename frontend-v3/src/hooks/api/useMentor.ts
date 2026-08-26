import { useMutation } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { MentorContextType, MentorMessageResponse } from '@/types';

export interface MentorMessageInput {
  message: string;
  contextType?: MentorContextType;
  contextId?: string | null;
  sessionId?: string;
}

export function useSendMentorMessage() {
  return useMutation({
    mutationFn: async (data: MentorMessageInput) => {
      const res = await api.post<MentorMessageResponse>(
        '/mentor/message',
        data,
      );
      return res.data;
    },
  });
}
