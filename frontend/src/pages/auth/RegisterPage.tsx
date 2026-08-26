import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, CheckCircle2, Compass, MessageCircle, Route } from 'lucide-react';
import { useRegister } from '@/hooks/api/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Input, PasswordInput, Card, Eyebrow } from '@/components/common';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
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
      if (res.token && res.user) {
        setAuth(res.token, res.user);
        navigate('/onboarding');
      } else {
        navigate('/login', { state: { registered: true } });
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          'Registration failed. An account with this email may already exist.',
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-void px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(15,148,136,0.14),transparent_34%),linear-gradient(135deg,#fff_0%,#fff 46%,#e7f4f2 100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-10rem)] max-w-5xl items-stretch overflow-hidden rounded-card border border-line bg-surface shadow-panel lg:grid-cols-[1.08fr_0.92fr]">
        <div className="p-6 sm:p-10 lg:p-12">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-text group">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ion/25 bg-accent-tint transition-colors group-hover:border-ion/60">
              <Compass className="h-5 w-5 text-ion" aria-hidden />
            </span>
            <span className="font-sans text-xl tracking-tight">Knowledge<span className="text-ion"> Core</span></span>
          </Link>
          <Eyebrow>Initialize profile</Eyebrow>
          <h1 className="mt-2 font-sans text-4xl font-extrabold tracking-[-0.05em] text-text sm:text-5xl">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Start your AI-guided technical journey</p>

          <Card className="mt-9 border-0 p-0 shadow-none">
            {errorMessage && (
              <div className="mb-6 flex items-center gap-2.5 rounded-control border border-danger/25 bg-danger/5 p-3 text-xs text-danger" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Full Name" placeholder="Alex Vance" error={errors.fullName?.message} {...register('fullName')} />
              <Input label="Email Address" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <PasswordInput label="Password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
              <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" loading={registerMutation.isPending}>
                Begin Trajectory
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </form>

            <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-ion-deep hover:text-ion hover:underline">Sign in</Link>
            </div>
          </Card>
        </div>

        <aside className="relative hidden overflow-hidden bg-dark p-8 text-dark-text lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="pointer-events-none absolute -right-28 top-10 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative">
            <Eyebrow className="text-dark-text/65">Your next step</Eyebrow>
            <h2 className="mt-5 max-w-sm font-sans text-3xl font-extrabold leading-tight tracking-[-0.04em] text-white">
              A clearer route to the work you want.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-dark-text/75">
              Your profile helps the mentor understand where to begin, what to skip, and how to shape your path.
            </p>
          </div>

          <div className="relative space-y-5">
            {[
              { icon: <CheckCircle2 className="h-4 w-4" aria-hidden />, title: 'Create your account', copy: 'Secure entry to your workspace', active: true },
              { icon: <MessageCircle className="h-4 w-4" aria-hidden />, title: 'Share your goals', copy: 'A short conversation with your mentor', active: false },
              { icon: <Route className="h-4 w-4" aria-hidden />, title: 'Explore your path', copy: 'Milestones ordered for your next move', active: false },
            ].map((step, index) => (
              <div key={step.title} className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${step.active ? 'border-white bg-white text-dark' : 'border-white/20 text-dark-text/60'}`}>
                  {step.active ? step.icon : <span className="font-mono text-xs">{index + 1}</span>}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${step.active ? 'text-white' : 'text-dark-text/70'}`}>{step.title}</p>
                  <p className="mt-0.5 text-xs text-dark-text/55">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
