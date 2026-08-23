import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Edit3, Compass } from 'lucide-react';
import { useVerifyOtp, useResendOtp } from '@/hooks/api/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Card, Eyebrow } from '@/components/common';

export default function VerifyOtpPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const initialEmail = (location.state as any)?.email || searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setIsEditingEmail(true);
      return;
    }
    if (code.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    try {
      const res = await verifyMutation.mutateAsync({
        email: email.trim(),
        code: code.trim(),
      });

      if (res.token && res.user) {
        setAuth(res.token, res.user);
        navigate('/onboarding');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          'Invalid or expired OTP code. Please check your email or request a new code.'
      );
    }
  };

  const handleResend = async () => {
    if (!email) {
      setIsEditingEmail(true);
      return;
    }
    setErrorMessage(null);
    try {
      const res = await resendMutation.mutateAsync({ email: email.trim() });
      setSuccessMessage(res.message || 'A fresh 6-digit code has been dispatched to your email.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to resend verification code.');
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
            <Eyebrow tone="ion">IDENTITY VERIFICATION</Eyebrow>
          </div>
          <h1 className="font-display text-3xl text-text">Verify your email</h1>
          <p className="mt-1 text-sm text-muted">
            Enter the 6-digit code sent to your inbox
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

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Email confirmation / edit strip */}
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 p-3 text-xs">
              {isEditingEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered email"
                  className="w-full bg-transparent text-xs text-text outline-none"
                  autoFocus
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted truncate">
                    <Mail className="h-4 w-4 text-ion shrink-0" />
                    <span className="truncate text-text font-medium">{email || 'No email set'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="p-1 text-muted hover:text-ion transition-colors shrink-0"
                    title="Change email"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            <div>
              <label className="block text-center font-mono text-xs uppercase tracking-widest text-muted mb-2">
                6-Digit Security Code
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 rounded-lg border border-line bg-surface-2 text-text focus:border-ion focus:outline-none transition-colors"
                autoFocus={!isEditingEmail}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={code.length !== 6}
              loading={verifyMutation.isPending}
            >
              Verify & Enter Trajectory
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-4 flex items-center justify-between text-xs text-muted">
            <span>Didn't receive the email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="inline-flex items-center gap-1.5 font-medium text-ion hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
              Resend code
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
