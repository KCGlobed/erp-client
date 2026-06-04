import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  TrendingUp,
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'var(--chart-2)';
    case 'INACTIVE':
      return 'var(--muted-foreground)';
    default:
      return 'var(--chart-1)';
  }
}

// ─────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px oklch(0 0 0 / 0.06)',
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </p>
        <p className="text-3xl font-bold mt-0.5 leading-none" style={{ color: 'var(--foreground)' }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Class Card (used by Faculty + Student)
// ─────────────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: any }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3"
      style={{ background: 'var(--muted)' }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        {cls.subject?.slice(0, 2).toUpperCase() || 'CL'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {cls.subject || 'Class'}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {cls.course && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <BookOpen className="h-3 w-3" />
              {cls.course}
            </span>
          )}
          {cls.cohort && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <GraduationCap className="h-3 w-3" />
              {cls.cohort}
            </span>
          )}
          {cls.room && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <MapPin className="h-3 w-3" />
              {cls.room}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <CalendarDays className="h-3 w-3" style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
            {cls.date ? formatDate(cls.date) : 'Scheduled'}{' '}
            {cls.startTime ? `· ${formatTime(cls.startTime)} – ${formatTime(cls.endTime)}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Admin Dashboard
// ─────────────────────────────────────────────────────────────

function AdminDashboard({ data }: { data: any }) {
  const { stats, recentEnrollments } = data;
  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'hsl(221, 83%, 53%)', sub: 'Enrolled students' },
    { label: 'Faculty Members', value: stats.totalFaculty, icon: Users, color: 'hsl(262, 80%, 60%)', sub: 'Teaching staff' },
    { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'hsl(142, 71%, 45%)', sub: `${stats.activeCourses} active` },
    { label: 'Cohorts', value: stats.totalCohorts, icon: Building2, color: 'hsl(32, 95%, 50%)', sub: 'Batches' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Admin Overview</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Welcome back! Here's what's happening across campus.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Recent Enrollments */}
      <div
        className="rounded-xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Recent Enrollments
            </h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            Latest {recentEnrollments?.length || 0}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                {['Student', 'Course', 'Enrolled On'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentEnrollments || []).map((e: any) => (
                <tr
                  key={e.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
                  onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium" style={{ color: 'var(--foreground)' }}>{e.studentName}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{e.studentEmail}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: 'var(--primary)18', color: 'var(--primary)' }}>
                      <BookOpen className="h-3 w-3" />
                      {e.courseCode}
                    </span>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{e.courseName}</div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {e.enrolledAt ? formatDate(e.enrolledAt) : '—'}
                  </td>
                </tr>
              ))}
              {(!recentEnrollments || recentEnrollments.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No enrollments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Faculty Dashboard
// ─────────────────────────────────────────────────────────────

function FacultyDashboard({ data }: { data: any }) {
  const { assignedCourses = [], stats, upcomingClasses = [] } = data;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'hsl(262, 80%, 60%)', color: 'white' }}>
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>My Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Your teaching overview for this term.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Assigned Courses" value={stats.totalAssignedCourses} icon={BookOpen} color="hsl(221, 83%, 53%)" sub="Courses you teach" />
        <StatCard label="My Students" value={stats.totalStudents} icon={Users} color="hsl(142, 71%, 45%)" sub="Enrolled in your courses" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Courses */}
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 p-5 pb-3">
            <BookOpen className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>My Courses</h2>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {assignedCourses.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No courses assigned yet.
              </p>
            ) : (
              assignedCourses.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ background: 'var(--muted)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.code}</p>
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase"
                    style={{ background: `${getStatusColor(c.status)}18`, color: getStatusColor(c.status) }}
                  >
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 p-5 pb-3">
            <Clock className="h-4 w-4" style={{ color: 'hsl(32, 95%, 50%)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upcoming Classes</h2>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {upcomingClasses.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No upcoming classes scheduled.
              </p>
            ) : (
              upcomingClasses.map((cls: any) => <ClassCard key={cls.id} cls={cls} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Student Dashboard
// ─────────────────────────────────────────────────────────────

function StudentDashboard({ data }: { data: any }) {
  const { enrolledCourses = [], stats, upcomingClasses = [] } = data;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'hsl(142, 71%, 45%)', color: 'white' }}>
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>My Learning</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Your academic snapshot for this term.</p>
        </div>
      </div>

      {/* Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Enrolled Courses" value={stats.totalEnrolledCourses} icon={BookOpen} color="hsl(221, 83%, 53%)" sub="Active enrollments" />
        <StatCard label="Upcoming Classes" value={upcomingClasses.length} icon={CalendarDays} color="hsl(32, 95%, 50%)" sub="In your schedule" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Courses */}
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 p-5 pb-3">
            <BookOpen className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>My Courses</h2>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {enrolledCourses.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                You are not enrolled in any courses yet.
              </p>
            ) : (
              enrolledCourses.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ background: 'var(--muted)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {c.code} {c.enrolledAt ? `· Enrolled ${formatDate(c.enrolledAt)}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 p-5 pb-3">
            <Clock className="h-4 w-4" style={{ color: 'hsl(32, 95%, 50%)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upcoming Classes</h2>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {upcomingClasses.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No upcoming classes scheduled.
              </p>
            ) : (
              upcomingClasses.map((cls: any) => <ClassCard key={cls.id} cls={cls} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--muted)' }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiFetch('/dashboard/stats'),
    staleTime: 30_000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Could not load dashboard data. Please try again.
        </p>
      </div>
    );
  }

  const role = data.role as string;

  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || user?.roles?.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r))) {
    return <AdminDashboard data={data} />;
  }

  if (role === 'FACULTY') {
    return <FacultyDashboard data={data} />;
  }

  if (role === 'STUDENT') {
    return <StudentDashboard data={data} />;
  }

  return (
    <div className="rounded-xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Welcome to EduERP. No dashboard configured for your role.
      </p>
    </div>
  );
}
