import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, Compass } from 'lucide-react';
import { useLogin } from '@/hooks/api/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Input, Card, Eyebrow } from '@/components/common';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const loginMutation = useLogin();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const res = await loginMutation.mutateAsync(values);

      if (res.emailVerificationRequired || !res.token) {
        navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`, {
          state: { email: values.email },
        });
        return;
      }

      if (res.token && res.user) {
        setAuth(res.token, res.user);
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          'Authentication failed. Please check your email and password.'
      );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-2 group-hover:border-ion transition-colors">
              <Compass className="h-5 w-5 text-ion" />
            </div>
            <span className="font-display text-2xl tracking-tight text-text">
              Aether<span className="text-ion italic">Path</span>
            </span>
          </Link>
          <div className="mb-2">
            <Eyebrow tone="ion">SECURE ENTRY</Eyebrow>
          </div>
          <h1 className="font-display text-3xl text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Access your personalized learning trajectory
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-panel border-line bg-surface/90 backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <span />
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted hover:text-ion transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loginMutation.isPending}
            >
              Sign In
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-ion hover:underline">
              Create trajectory
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
