import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, Compass } from 'lucide-react';
import { useForgotPassword } from '@/hooks/api/useAuth';
import { Button, Input, Card, Eyebrow } from '@/components/common';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const mutation = useForgotPassword();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await mutation.mutateAsync({ email: values.email });
      setSuccessMessage(
        res.message || 'If an account exists, a 6-digit recovery code has been dispatched.'
      );
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(values.email)}`, {
          state: { email: values.email },
        });
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to process password reset request.');
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
            <Eyebrow tone="ember">ACCOUNT RECOVERY</Eyebrow>
          </div>
          <h1 className="font-display text-3xl text-text">Reset your password</h1>
          <p className="mt-1 text-sm text-muted">
            We will send a 6-digit verification code to your email
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={mutation.isPending}
            >
              Send Recovery Code
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
