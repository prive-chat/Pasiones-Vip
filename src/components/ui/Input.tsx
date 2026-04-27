import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  labelClassName?: string;
  description?: string;
  variant?: 'default' | 'glass';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftElement, rightElement, labelClassName, description, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white/5 text-white border-white/10 placeholder:text-white/20 focus-visible:ring-passion-red/50',
      glass: 'bg-white/5 text-white border-white/10 placeholder:text-white/20 focus-visible:ring-passion-red/50',
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className={cn('text-xs font-black uppercase tracking-widest text-passion-red/80', labelClassName)}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
              variant === 'glass' ? "text-white/40" : "text-slate-400"
            )}>
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
              variants[variant],
              leftElement && 'pl-8',
              rightElement && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              variant === 'glass' ? "text-white/40" : "text-slate-400"
            )}>
              {rightElement}
            </div>
          )}
        </div>
        {description && <p className="text-xs text-white/50">{description}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
