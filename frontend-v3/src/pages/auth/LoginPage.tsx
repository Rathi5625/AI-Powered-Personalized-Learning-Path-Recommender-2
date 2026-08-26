import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, CheckCircle2, Compass, ShieldCheck } from 'lucide-react';
import { useLogin } from '@/hooks/api/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Input, PasswordInput, Card, Eyebrow } from '@/components/common';

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

  const registeredNotice = (location.state as any)?.registered;

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

      if (res.token && res.user) {
        setAuth(res.token, res.user);
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          'Authentication failed. Please check your email and password.',
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-void px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(231,244,242,0.95),transparent_42%),linear-gradient(135deg,#fff_0%,#fff 42%,#e7f4f2 100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-10rem)] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <div className="hidden max-w-lg lg:block">
          <Eyebrow>Personalized learning system</Eyebrow>
          <h1 className="mt-5 text-balance font-sans text-6xl font-extrabold leading-[0.96] tracking-[-0.06em] text-text">
            Continue the path that is <span className="text-ion">yours.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Access your personalized learning trajectory and pick up exactly where your next milestone begins.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-card border border-line bg-line shadow-card-soft">
            {[
              ['01', 'Goal context'],
              ['02', 'Path order'],
              ['03', 'Mentor access'],
            ].map(([number, label]) => (
              <div key={number} className="bg-surface/80 p-4">
                <p className="font-sans text-2xl font-bold text-text">{number}</p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center">
          <Card className="relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ion via-success to-ion/20" />
            <div className="mb-7">
              <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-text group">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ion/25 bg-accent-tint transition-colors group-hover:border-ion/60">
                  <Compass className="h-5 w-5 text-ion" aria-hidden />
                </span>
                <span className="font-sans text-xl tracking-tight">Knowledge<span className="text-ion"> Core</span></span>
              </Link>
              <Eyebrow>Secure entry</Eyebrow>
              <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-[-0.045em] text-text">Welcome back</h1>
              <p className="mt-1 text-sm text-muted">Access your personalized learning trajectory</p>
            </div>

            {registeredNotice && !errorMessage && (
              <div className="mb-6 flex items-center gap-2.5 rounded-control border border-success/25 bg-success/10 p-3 text-xs text-success-deep" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                <span>Registration successful! Please sign in to continue.</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 flex items-center gap-2.5 rounded-control border border-danger/25 bg-danger/5 p-3 text-xs text-danger" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
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

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" loading={loginMutation.isPending}>
                Sign In
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </form>

            <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-ion-deep hover:text-ion hover:underline">
                Create trajectory
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-2">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              Protected by secure JWT authentication
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
