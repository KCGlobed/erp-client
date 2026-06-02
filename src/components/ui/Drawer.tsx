import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ isOpen, onClose, title, description, children, className }: DrawerProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{ backgroundColor: 'oklch(0 0 0 / 0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Drawer panel — slides from right */}
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <div
          className={cn(
            "relative w-screen max-w-md flex flex-col shadow-2xl",
            "animate-in slide-in-from-right duration-300",
            className
          )}
          style={{ backgroundColor: 'var(--background)' }}
        >
          {/* Drawer Header */}
          <div
            className="flex items-start justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {title}
              </h2>
              {description && (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 transition-colors hover:opacity-80 cursor-pointer ml-4 mt-0.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
