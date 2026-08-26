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
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-ion text-white shadow-glow-ion hover:bg-ion-deep hover:shadow-panel',
  ember:
    'bg-ember text-white shadow-glow-ember hover:bg-ember-deep',
  secondary:
    'border border-line bg-surface text-text shadow-card-soft hover:border-ion/50 hover:bg-accent-tint',
  ghost: 'text-muted hover:bg-surface-alt hover:text-text',
  danger:
    'border border-danger/30 bg-danger/5 text-danger hover:border-danger/50 hover:bg-danger/10',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-sm',
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
