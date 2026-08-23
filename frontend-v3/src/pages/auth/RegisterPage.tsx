import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, Compass } from 'lucide-react';
import { useRegister } from '@/hooks/api/useAuth';
import { Button, Input, PasswordInput, Card, Eyebrow } from '@/components/common';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);
    try {
      const res = await registerMutation.mutateAsync(values);
      // Registration requires email verification OTP
      if (res.emailVerificationRequired || !res.token) {
        navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`, {
          state: { email: values.email },
        });
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          'Registration failed. An account with this email may already exist.'
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
            <Eyebrow tone="ion">INITIALIZE PROFILE</Eyebrow>
          </div>
          <h1 className="font-display text-3xl text-text">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Start your AI-guided technical journey
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
              label="Full Name"
              placeholder="Alex Vance"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={registerMutation.isPending}
            >
              Begin Trajectory
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-ion hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
