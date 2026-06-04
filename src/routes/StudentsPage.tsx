import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  GraduationCap, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  History,
  Download,
  Plus,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

// Mock programs, phones, cities, and guardians to match the reference image style
const MOCK_PROGRAMS = [
  'B.Tech CSE - Year 2nd - Sec A',
  'B.Sc Physics - Year 1st - Sec B',
  'MBA - Year 1st - Sec A',
  'B.Com (H) - Year 3rd - Sec C'
];

const MOCK_PHONES = [
  '+91 98201 23456',
  '+91 99876 11220',
  '+91 90123 55780',
  '+91 98450 67891'
];

const MOCK_CITIES = ['Mumbai', 'Pune', 'Delhi', 'Kochi', 'Bangalore', 'Chennai'];
const MOCK_GUARDIANS = ['Rajeev Mehta', 'Sunita Verma', 'Vikram Khanna', 'Anand Pillai', 'Sanjay Joshi', 'Lata Reddy'];
const MOCK_STATUSES = ['Active', 'Active', 'Active', 'On Leave', 'Graduated', 'Active'];

export function StudentsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // State to hold attendance mapping: { [studentId_dateString]: 'PRESENT' | 'ABSENT' }
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>(() => {
    // Generate some mock history for the last 30 days
    const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
    const today = new Date();
    // We will populate this as students load, or just keep a base map.
    return initial;
  });

  // Modal / History Calendar states
  const [historyModalStudent, setHistoryModalStudent] = useState<any | null>(null);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  const isFaculty = user?.roles?.includes('FACULTY');
  const isAdmin = user?.roles?.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r));

  // Query to fetch students
  const { data: students = [], isLoading } = useQuery<any[]>({
    queryKey: ['students-list', user?.id],
    queryFn: async () => {
      let list = [];
      if (isFaculty) {
        const res = await apiFetch('/faculty-assignments/my-students');
        list = res || [];
      } else {
        const res = await apiFetch('/users?limit=100');
        const dataList = res?.data || [];
        list = dataList.filter((u: any) => u.roles?.includes('STUDENT'));
      }

      // Enrich list with deterministic mock details to mimic the user's design image
      return list.map((s: any, idx: number) => {
        const pIdx = idx % MOCK_PROGRAMS.length;
        const phoneIdx = idx % MOCK_PHONES.length;
        const cityIdx = idx % MOCK_CITIES.length;
        const guardianIdx = idx % MOCK_GUARDIANS.length;
        const statusIdx = idx % MOCK_STATUSES.length;

        // Deterministic mock student ID like STU-2024-001
        const seqNum = String(idx + 1).padStart(3, '0');
        const mockStudentId = `STU-2024-${seqNum}`;

        return {
          ...s,
          studentId: mockStudentId,
          program: MOCK_PROGRAMS[pIdx],
          phone: MOCK_PHONES[phoneIdx],
          city: MOCK_CITIES[cityIdx],
          guardian: MOCK_GUARDIANS[guardianIdx],
          status: MOCK_STATUSES[statusIdx],
        };
      });
    },
  });

  // Generate some automatic random history if we have students and attendance is empty
  useMemo(() => {
    if (students.length > 0 && Object.keys(attendance).length === 0) {
      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      const today = new Date();
      // Generate last 30 days of data
      students.forEach((student: any) => {
        for (let d = 0; d < 30; d++) {
          const date = new Date();
          date.setDate(today.getDate() - d);
          const dateStr = date.toISOString().split('T')[0];
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          
          // 85% attendance rate
          initial[`${student.id}_${dateStr}`] = Math.random() > 0.15 ? 'PRESENT' : 'ABSENT';
        }
      });
      setAttendance(initial);
    }
  }, [students]);

  // Handle single attendance toggle
  const markAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    const key = `${studentId}_${selectedDate}`;
    setAttendance(prev => ({
      ...prev,
      [key]: prev[key] === status ? undefined : status as any // toggle off if clicked again
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setAttendance(prev => {
      const updated = { ...prev };
      filteredStudents.forEach((student) => {
        updated[`${student.id}_${selectedDate}`] = 'PRESENT';
      });
      return updated;
    });
  };

  // Filter students based on search
  const filteredStudents = students.filter((s: any) =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.studentId} ${s.program}`.toLowerCase().includes(search.toLowerCase())
  );

  // Compute stats for current selected date
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;

    filteredStudents.forEach((s) => {
      const status = attendance[`${s.id}_${selectedDate}`];
      if (status === 'PRESENT') presentCount++;
      if (status === 'ABSENT') absentCount++;
    });

    return { presentCount, absentCount };
  }, [filteredStudents, attendance, selectedDate]);

  // Formatting utility for selectedDate button label
  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    const dateObj = new Date(selectedDate);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDate]);

  // Calendar rendering helper logic
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Add empty spaces for offset
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentCalendarMonth]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentCalendarMonth(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return nextMonth;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <nav className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            <span>Home</span><span className="mx-1">›</span>
            <span>People</span><span className="mx-1">›</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Students</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Students
          </h1>
          <p className="text-sm text-gray-500">
            Browse student profiles and mark attendance for any date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-1.5 text-xs h-9">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          {isAdmin && (
            <Button className="flex items-center gap-1.5 text-xs h-9 bg-purple-800 hover:bg-purple-900 text-white border-0">
              <Plus className="h-3.5 w-3.5" /> Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Attendance Control Bar */}
      <div 
        className="rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-purple-700">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Attendance for</p>
            <p className="text-xs text-gray-500">Pick a date and mark each student</p>
          </div>
        </div>

        {/* Date Selector input/wrapper */}
        <div className="relative">
          <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors">
            <CalendarDays className="h-4 w-4 text-purple-700" />
            <span className="font-medium text-gray-800">{formattedDateLabel}</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>

        {/* Attendance Stats & Bulk action */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-purple-700 bg-purple-50">
            Present {stats.presentCount}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-red-700 bg-red-50">
            Absent {stats.absentCount}
          </span>
          <Button 
            onClick={handleMarkAllPresent}
            className="text-xs h-9 bg-purple-800 hover:bg-purple-900 text-white border-0"
          >
            Mark all present
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students by name, email, ID or program..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg text-sm outline-none transition-colors border"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Student Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl h-56" style={{ background: 'var(--muted)' }} />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl p-12 text-center border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-sm text-gray-500">
            {students.length === 0 ? 'No students found.' : 'No matching students found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => {
            const attStatus = attendance[`${student.id}_${selectedDate}`];
            const isPresent = attStatus === 'PRESENT';
            const isAbsent = attStatus === 'ABSENT';

            // Distinct badge colors matching the image
            let badgeStyle = { bg: 'bg-purple-50', text: 'text-purple-700' };
            if (student.status === 'On Leave') {
              badgeStyle = { bg: 'bg-orange-50', text: 'text-orange-700' };
            } else if (student.status === 'Graduated') {
              badgeStyle = { bg: 'bg-gray-100', text: 'text-gray-600' };
            }

            return (
              <div 
                key={student.id} 
                className="relative rounded-xl p-5 border flex flex-col justify-between transition-shadow hover:shadow-md"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {/* Status Badge */}
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                  {student.status}
                </span>

                {/* Profile Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}_${student.lastName}`}
                      alt={student.firstName}
                      className="h-14 w-14 rounded-full border bg-gray-50 shrink-0 object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{student.firstName} {student.lastName}</h3>
                      <p className="text-[10px] font-semibold text-gray-400 font-mono tracking-tight">{student.studentId}</p>
                    </div>
                  </div>

                  {/* Info Rows */}
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-start gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
                      <span className="leading-tight">{student.program}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-700 shrink-0" />
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-700 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
                      <span className="leading-tight">{student.city} · Guardian: {student.guardian}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance & History Buttons */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-1.5">
                  <button 
                    onClick={() => markAttendance(student.id, 'PRESENT')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border font-semibold transition-all cursor-pointer ${
                      isPresent 
                        ? 'bg-purple-800 border-purple-800 text-white' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Present
                  </button>

                  <button 
                    onClick={() => markAttendance(student.id, 'ABSENT')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border font-semibold transition-all cursor-pointer ${
                      isAbsent 
                        ? 'bg-red-600 border-red-600 text-white' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Absent
                  </button>

                  <button 
                    onClick={() => {
                      setHistoryModalStudent(student);
                      setCurrentCalendarMonth(new Date());
                    }}
                    className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    title="Attendance History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Calendar Modal */}
      {historyModalStudent && (
        <Modal 
          isOpen={!!historyModalStudent} 
          onClose={() => setHistoryModalStudent(null)}
          title={`Attendance History — ${historyModalStudent.firstName} ${historyModalStudent.lastName}`}
          className="max-w-md"
        >
          <div className="space-y-4">
            {/* Month Navigator Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {currentCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleMonthChange('prev')}
                  className="p-1.5 rounded hover:bg-gray-100 border border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleMonthChange('next')}
                  className="p-1.5 rounded hover:bg-gray-100 border border-gray-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="py-2" />;

                const dateStr = date.toISOString().split('T')[0];
                const key = `${historyModalStudent.id}_${dateStr}`;
                const status = attendance[key];

                let bgClass = 'hover:bg-gray-50';
                let textClass = 'text-gray-900';
                let indicator = null;

                if (status === 'PRESENT') {
                  bgClass = 'bg-purple-100 text-purple-800';
                  indicator = <div className="h-1.5 w-1.5 rounded-full bg-purple-700 mx-auto mt-0.5" />;
                } else if (status === 'ABSENT') {
                  bgClass = 'bg-red-100 text-red-800';
                  indicator = <div className="h-1.5 w-1.5 rounded-full bg-red-600 mx-auto mt-0.5" />;
                }

                // Check if it is today
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const borderClass = isToday ? 'ring-2 ring-purple-600 ring-offset-1' : '';

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      // Allow toggling/editing history from the calendar grid!
                      setAttendance(prev => {
                        const currentVal = prev[key];
                        const nextVal = currentVal === 'PRESENT' ? 'ABSENT' : currentVal === 'ABSENT' ? undefined : 'PRESENT';
                        return {
                          ...prev,
                          [key]: nextVal
                        };
                      });
                    }}
                    className={`py-2 rounded-lg text-center text-xs font-medium cursor-pointer transition-all ${bgClass} ${textClass} ${borderClass}`}
                  >
                    <div>{date.getDate()}</div>
                    {indicator || <div className="h-1.5 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center justify-center gap-4 text-xs border-t border-gray-100 pt-4 mt-2">
              <div className="flex items-center gap-1.5 text-purple-700">
                <div className="h-2 w-2 rounded-full bg-purple-700" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600">
                <div className="h-2 w-2 rounded-full bg-red-600" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <div className="h-2 w-2 rounded-full bg-transparent border border-gray-300" />
                <span>No Record / Weekend</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400">
              * Tip: You can click on any calendar day to toggle or edit history records.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
