import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants: Record<string, React.CSSProperties> = {
      primary: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
      secondary: { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' },
      outline: { backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' },
      ghost: { backgroundColor: 'transparent', color: 'var(--foreground)' },
      destructive: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' },
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 py-2 px-4',
      lg: 'h-11 px-8',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], className)}
        style={variants[variant]}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
