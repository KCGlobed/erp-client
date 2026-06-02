import React from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md px-3 py-2 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            error && 'ring-2 ring-destructive',
            className
          )}
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--input)',
            color: 'var(--foreground)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--ring)';
            e.currentTarget.style.boxShadow = '0 0 0 2px oklch(0.36 0.18 330 / 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--input)';
            e.currentTarget.style.boxShadow = '';
          }}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
