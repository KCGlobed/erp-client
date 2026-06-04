import React from 'react';
import { Mail, Phone, GraduationCap, MapPin, Users } from 'lucide-react';
import { cn } from './Button';

// Deterministic hue from a string (for avatar colour variety)
function hueFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export interface StudentCardStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  // Optional extended fields — show "—" when absent
  phone?: string;
  program?: string;
  city?: string;
  guardian?: string;
  cohortName?: string;
}

interface StudentCardProps {
  student: StudentCardStudent;
  /** compact removes the banner height and some padding for use inside drawers */
  compact?: boolean;
  className?: string;
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? 'ACTIVE').toUpperCase();
  const isActive = s === 'ACTIVE';
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
      style={{
        background: isActive ? 'oklch(0.36 0.18 330 / 0.1)' : 'oklch(0.5 0.04 330 / 0.12)',
        color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
        border: isActive ? '1px solid oklch(0.36 0.18 330 / 0.25)' : '1px solid var(--border)',
      }}
    >
      {isActive ? 'Active' : s === 'INACTIVE' ? 'Inactive' : s}
    </span>
  );
}

export function StudentCard({ student, compact = false, className }: StudentCardProps) {
  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
  const hue = hueFromString(student.id);
  const avatarBg = `hsl(${hue}, 55%, 58%)`;

  const row = (icon: React.ReactNode, value?: string) => (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--primary)' }} className="shrink-0">{icon}</span>
      <span
        className="text-xs truncate"
        style={{ color: value ? 'var(--muted-foreground)' : 'var(--border)' }}
      >
        {value || '—'}
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-md',
        className,
      )}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Banner */}
      {!compact && (
        <div
          className="h-14 w-full shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 55%, 52%), hsl(${(hue + 40) % 360}, 60%, 62%))`,
          }}
        />
      )}

      <div className={cn('px-4 pb-4', compact ? 'pt-4' : '-mt-7')}>
        <div className="flex items-end justify-between mb-2">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow"
            style={{
              background: avatarBg,
              border: compact ? 'none' : '3px solid var(--card)',
            }}
          >
            {initials}
          </div>
          <StatusBadge status={student.status} />
        </div>

        {/* Name + ID */}
        <div className="mt-1">
          <h3 className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
            {fullName}
          </h3>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {student.id.slice(0, 20)}
          </p>
        </div>

        {/* Detail rows */}
        <div className="mt-3 space-y-1.5">
          {row(<GraduationCap className="h-3 w-3" />, student.program || student.cohortName)}
          {row(<Mail className="h-3 w-3" />, student.email)}
          {row(<Phone className="h-3 w-3" />, student.phone)}
          {row(<MapPin className="h-3 w-3" />, student.city)}
          {student.guardian && row(<Users className="h-3 w-3" />, `Guardian: ${student.guardian}`)}
        </div>
      </div>
    </div>
  );
}
