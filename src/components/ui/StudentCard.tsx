import { Mail, Phone, GraduationCap, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface StudentCardStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  phone?: string;
  program?: string;
  year?: string;
  section?: string;
  city?: string;
  guardian?: string;
  cohortName?: string;
}

interface StudentCardProps {
  student: StudentCardStudent;
  attendanceMark?: 'PRESENT' | 'ABSENT' | null;
  attendanceDate?: string | Date;
  onMarkPresent?: () => void;
  onMarkAbsent?: () => void;
  onOpenHistory?: () => void;
  className?: string;
}

export function StudentCard({
  student,
  attendanceMark,
  attendanceDate,
  onMarkPresent,
  onMarkAbsent,
  onOpenHistory,
  className,
}: StudentCardProps) {
  const fullName = `${student.firstName} ${student.lastName}`;
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}_${student.lastName}`;
  const status = student.status || 'Active';

  const programLabel = [
    student.program || student.cohortName,
    student.year,
    student.section,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition-all duration-300',
        className
      )}
    >
      {/* Top row: avatar + badges */}
      <div className="flex justify-between items-start mb-4">
        <img
          src={avatar}
          alt={fullName}
          className="h-16 w-16 rounded-xl object-cover bg-gray-100 border border-gray-200"
        />
        <div className="flex flex-col items-end gap-1.5">
          {/* Status badge */}
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
              status === 'Active'
                ? 'bg-pink-50 text-pink-800 border-pink-100'
                : status === 'On Leave'
                  ? 'bg-amber-50 text-amber-800 border-amber-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
            )}
          >
            {status}
          </span>

          {/* Attendance badge */}
          {attendanceMark && attendanceDate && (
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                attendanceMark === 'PRESENT'
                  ? 'bg-violet-50 text-violet-800 border-violet-100'
                  : 'bg-red-50 text-red-800 border-red-100'
              )}
            >
              {attendanceMark === 'PRESENT' ? 'Present' : 'Absent'} ·{' '}
              {format(new Date(attendanceDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      {/* Name + ID */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 text-[15px] leading-tight">
          {fullName}
        </h3>
        <p className="text-[11px] font-mono text-gray-500 mt-0.5">
          {student.studentId || student.id.slice(0, 10)}
        </p>
      </div>

      {/* Info rows */}
      <div className="space-y-2 text-[11px] text-gray-500 mb-6 flex-grow">
        <div className="flex items-start gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-violet-700 shrink-0 mt-0.5" />
          <span className="leading-tight">{programLabel || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-violet-700 shrink-0" />
          <span className="truncate">{student.phone || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-violet-700 shrink-0" />
          <span className="truncate">{student.email || '—'}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-violet-700 shrink-0 mt-0.5" />
          <span className="leading-tight">
            {student.city || '—'} · Guardian: {student.guardian || '—'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {(onMarkPresent || onMarkAbsent || onOpenHistory) && (
        <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5 mt-auto">
          {onMarkPresent && (
            <button
              onClick={onMarkPresent}
              className={cn(
                'flex-1 h-8 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer',
                attendanceMark === 'PRESENT'
                  ? 'bg-violet-900 text-white border-violet-900 hover:bg-violet-950'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Present
            </button>
          )}
          {onMarkAbsent && (
            <button
              onClick={onMarkAbsent}
              className={cn(
                'flex-1 h-8 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer',
                attendanceMark === 'ABSENT'
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              )}
            >
              <XCircle className="h-3.5 w-3.5" />
              Absent
            </button>
          )}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 px-3 h-8 border border-transparent hover:bg-gray-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              History
            </button>
          )}
        </div>
      )}
    </div>
  );
}