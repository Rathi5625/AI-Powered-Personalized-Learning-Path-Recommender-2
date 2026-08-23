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
export interface VerifyOtpInput {
  email: string;
  code: string;
}
export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
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

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (data: VerifyOtpInput) => {
      const res = await api.post<AuthResponse>('/auth/verify-otp', data);
      return res.data;
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await api.post<{ message?: string }>('/auth/resend-otp', data);
      return res.data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await api.post<{ message?: string }>(
        '/auth/forgot-password',
        data,
      );
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const res = await api.post<{ message?: string }>(
        '/auth/reset-password',
        data,
      );
      return res.data;
    },
  });
}
