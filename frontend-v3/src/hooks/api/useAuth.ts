import { useMutation } from '@tanstack/react-query';
import api from '@/lib/apiClient';
import type { AuthResponse } from '@/types';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await api.post<AuthResponse>('/auth/register', data);
      return res.data;
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post<AuthResponse>('/auth/login', data);
      return res.data;
    },
  });
}
