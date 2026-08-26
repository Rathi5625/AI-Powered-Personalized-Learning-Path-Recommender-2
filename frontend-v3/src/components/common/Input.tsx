import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

const controlBase =
  'w-full rounded-control border bg-surface px-3.5 text-text placeholder:text-muted-2 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/30 focus-visible:border-ion/60 disabled:opacity-50';

function fieldWrap(error?: string) {
  return cn(controlBase, error ? 'border-danger/70' : 'border-line');
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-xs font-semibold text-ink-soft">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={cn(fieldWrap(error), 'h-11', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-xs font-semibold text-ink-soft">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={showPassword ? 'text' : 'password'}
            className={cn(fieldWrap(error), 'h-11 pr-11', className)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldProps {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, id, className, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-xs font-semibold text-ink-soft">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={cn(fieldWrap(error), 'resize-y py-2.5', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextArea.displayName = 'TextArea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    FieldProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className, options, placeholder, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-xs font-semibold text-ink-soft">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={cn(fieldWrap(error), 'h-11 appearance-none pr-9', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
