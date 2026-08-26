import {
  keepPreviousData,
  useQuery,
  useMutation,
} from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type {
  CourseResponse,
  CourseLevel,
  ResourceType,
  PageResponse,
} from '@/types';

export interface CourseQuery {
  skill?: string;
  level?: CourseLevel;
  platform?: string;
  resourceType?: ResourceType;
  page?: number;
  size?: number;
}

export const courseKeys = {
  list: (params: CourseQuery) => ['courses', params] as const,
  detail: (id: number | string) => ['course', id] as const,
  search: (query: string, limit: number) =>
    ['courses', 'search', query, limit] as const,
};

export function useCourses(params: CourseQuery) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const res = await api.get<PageResponse<CourseResponse>>('/courses', {
        params,
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCourse(id: number | string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(id ?? 'none'),
    queryFn: async () => {
      const res = await api.get<CourseResponse>(`/courses/${id}`);
      return res.data;
    },
    enabled: id !== undefined && id !== null && id !== '',
  });
}

/** Semantic search over the catalog. Enabled only when there is a query. */
export function useCourseSearch(query: string, limit = 12) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: courseKeys.search(trimmed, limit),
    queryFn: async () => {
      const res = await api.get<CourseResponse[]>('/courses/search', {
        params: { query: trimmed, limit },
      });
      return res.data;
    },
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
  });
}

/** Imperative variant of search for a submit-on-enter search box. */
export function useCourseSearchMutation() {
  return useMutation({
    mutationFn: async ({ query, limit = 12 }: { query: string; limit?: number }) => {
      const res = await api.get<CourseResponse[]>('/courses/search', {
        params: { query, limit },
      });
      return res.data;
    },
  });
}
