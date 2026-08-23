import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, CheckCircle2, Compass } from 'lucide-react';
import { useResetPassword } from '@/hooks/api/useAuth';
import { Button, Input, Card, Eyebrow } from '@/components/common';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'Code must be exactly 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mutation = useResetPassword();

  const initialEmail = (location.state as any)?.email || searchParams.get('email') || '';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await mutation.mutateAsync({
        email: values.email.trim(),
        code: values.code.trim(),
        newPassword: values.newPassword,
      });
      setSuccessMessage(res.message || 'Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to reset password. Please check the 6-digit code.'
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
            <Eyebrow tone="ember">CREDENTIAL UPDATE</Eyebrow>
          </div>
          <h1 className="font-display text-3xl text-text">Set new password</h1>
          <p className="mt-1 text-sm text-muted">
            Enter the 6-digit code and your new secure password
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-panel border-line bg-surface/90 backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
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
              <label className="block text-xs font-medium text-text mb-1.5">
                6-Digit Recovery Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 rounded-lg border border-line bg-surface-2 text-text focus:border-ember focus:outline-none transition-colors"
                {...register('code')}
              />
              {errors.code && (
                <p className="mt-1 text-xs text-danger">{errors.code.message}</p>
              )}
            </div>

            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={mutation.isPending}
            >
              Update Password
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            <Link to="/login" className="font-medium text-ion hover:underline">
              Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
