import { HTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export const Card = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('glass-card', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>{children}</div>
);

export const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props}>{children}</h3>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...props}>{children}</div>
);

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props}>{children}</div>
);
