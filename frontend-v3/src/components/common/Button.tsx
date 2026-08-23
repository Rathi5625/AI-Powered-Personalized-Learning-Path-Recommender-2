import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'ember';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 ease-smooth focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-ion text-void hover:bg-ion/90 shadow-[0_0_24px_-8px_rgba(91,209,224,0.55)]',
  ember:
    'bg-ember text-void hover:bg-ember/90 shadow-[0_0_24px_-8px_rgba(232,162,76,0.55)]',
  secondary:
    'border border-line bg-surface-2 text-text hover:border-ion/40 hover:bg-surface-3',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
  danger:
    'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
  icon: 'h-10 w-10',
};

export function buttonVariants(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
): string {
  return cn(base, variants[variant], sizes[size]);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants(variant, size), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
