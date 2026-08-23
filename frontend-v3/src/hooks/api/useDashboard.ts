import { useQuery } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { DashboardResponse } from '@/types';

export const dashboardKey = ['dashboard'] as const;

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: async () => {
      const res = await api.get<DashboardResponse>('/progress/dashboard');
      return res.data;
    },
  });
}
