import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-b from-[#FF4D4D] via-[#E60000] to-[#8B0000] text-white hover:brightness-110 shadow-lg shadow-passion-red/20 font-bold',
      secondary: 'bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm border border-white/10',
      outline: 'border border-passion-red/30 bg-transparent hover:bg-passion-red/5 text-passion-red',
      ghost: 'bg-transparent hover:bg-white/5 text-white',
      danger: 'bg-transparent border border-neon-scarlet/50 text-neon-scarlet hover:bg-neon-scarlet/10 shadow-[0_0_10px_rgba(255,49,49,0.2)]',
      glass: 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
