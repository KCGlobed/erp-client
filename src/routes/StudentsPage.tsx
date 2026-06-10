import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Download,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CalendarIcon,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Save
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { BigCalendar } from '../components/ui/BigCalendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { cn } from '../components/ui/Button';
import ConfirmDialog from '../components/ui/configDialog';

// ─── Mock enrichment data ────────────────────────────────────────────────────
const MOCK_PROGRAMS = ['B.Tech CSE', 'B.Sc Physics', 'MBA', 'B.Com (H)', 'B.Tech ECE', 'B.A English'];
const MOCK_YEARS = ['1st', '2nd', '3rd', '4th'];
const MOCK_SECTIONS = ['A', 'B', 'C'];
const MOCK_PHONES = ['+91 98201 23456', '+91 99876 11220', '+91 90123 55780', '+91 98450 67891', '+91 99100 22334', '+91 97045 66012'];
const MOCK_CITIES = ['Mumbai', 'Pune', 'Delhi', 'Kochi', 'Chandigarh', 'Bengaluru'];
const MOCK_GUARDIANS = ['Rajeev Mehta', 'Sunita Verma', 'Vikram Khanna', 'Anand Pillai', 'Manjit Singh', 'Lakshmi Reddy'];
const MOCK_STATUSES: ('Active' | 'On Leave' | 'Graduated')[] = ['Active', 'Active', 'Active', 'On Leave', 'Graduated', 'Active'];
// Pravatar images so the card avatars look identical to the inspiration
const MOCK_AVATARS = [12, 47, 33, 45, 15, 48, 8, 49, 11, 20, 25, 3, 7, 22, 27];

type AttendanceMap = Record<string, Record<string, 'present' | 'absent' | 'all-present'>>;

export function StudentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const saveTimeoutRef = useRef(null);

  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [attDate, setAttDate] = useState<Date>(new Date());
  const [attStudent, setAttStudent] = useState<any | null>(null);
  const [openBigCalender, setOpenBigCalender] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    studentId?: string;
    studentName?: string;
    action: 'present' | 'absent' | 'all-present';
  } | null>(null);


  const isFaculty = user?.roles?.includes('FACULTY');
  const isAdmin = user?.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));

  const { data: scheduleData } = useQuery({
    queryKey: ['timetable', isAdmin ? 'all' : 'personal'],
    queryFn: async () => {
      if (isAdmin) {
        const res = await apiFetch('/timetable/schedule');
        // Admin /timetable/schedule returns an array directly, whereas personalized returns { classes, ... }
        return { classes: Array.isArray(res) ? res : res?.data || [] };
      }
      return apiFetch('/timetable/personalized');
    },
  });

  const classesOnDate = useMemo(() => {
    if (!scheduleData?.classes) return [];
    return scheduleData.classes.filter((c) => {
      return format(new Date(c.date), 'yyyy-MM-dd') === format(attDate, 'yyyy-MM-dd');
    });
  }, [scheduleData, attDate]);

  useEffect(() => {
    if (classesOnDate.length > 0) {
      if (!selectedClassId || !classesOnDate.find((c: any) => c.id === selectedClassId)) {
        setSelectedClassId(classesOnDate[0].id);
      }
    } else {
      setSelectedClassId('');
    }
  }, [classesOnDate, selectedClassId]);

  const selectedClass = classesOnDate.find((c) => c.id === selectedClassId);

  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClassId],
    queryFn: () => apiFetch('/attendance/class/' + selectedClassId),
    enabled: !!selectedClassId,
  });

  useEffect(() => {
    if (existingAttendance?.records && selectedClassId) {
      const newMap = {};
      const dKey = format(attDate, 'yyyy-MM-dd');
      existingAttendance.records.forEach((r) => {
        newMap[r.studentId] = { [dKey]: r.status.toLowerCase() };
      });
      setAttendance(newMap);
    } else {
      setAttendance({});
    }
  }, [existingAttendance, selectedClassId, attDate]);

  const saveAttendance = useMutation({
    mutationFn: async (payload: { date: string; records: { studentId: string; status: string }[] }) => {
      return apiFetch('/attendance/class/' + selectedClassId, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedClassId] });
      // Remove any annoying alerts, just quiet success
    },
    onError: (error) => {
      alert('Error saving attendance: ' + error.message);
    }
  });

  const triggerSave = (updates: any) => {
    if (!selectedClassId) {
      alert('Please select a class from the dropdown before marking attendance.');
      return;
    }
    const records = Object.entries(updates).map(([studentId, dates]: [string, any]) => {
      const status = dates[format(attDate, 'yyyy-MM-dd')];
      if (!status) return null;
      return { studentId, status: status.toUpperCase() };
    }).filter(Boolean);
    
    saveAttendance.mutate({
      date: attDate.toISOString(),
      records,
    });
  };

  const scheduleAutoSave = (updates) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(updates);
    }, 2000);
  };
  // Role checks removed

  // ── Fetch students ──────────────────────────────────────────────────────────
  const { data: students = [], isLoading } = useQuery<any[]>({
    queryKey: ['students-list', user?.id],
    queryFn: async () => {
      let list: any[] = [];
      if (isFaculty) {
        const res = await apiFetch('/faculty-assignments/my-students');
        list = res || [];
      } else {
        const res = await apiFetch('/users?limit=100');
        list = (res?.data || []).filter((u: any) => u.roles?.includes('STUDENT'));
      }

      return list.map((s: any, idx: number) => ({
        ...s,
        name: `${s.firstName} ${s.lastName}`,
        displayId: `STU-2024-${String(idx + 1).padStart(3, '0')}`,
        program: MOCK_PROGRAMS[idx % MOCK_PROGRAMS.length],
        year: MOCK_YEARS[idx % MOCK_YEARS.length],
        section: MOCK_SECTIONS[idx % MOCK_SECTIONS.length],
        phone: MOCK_PHONES[idx % MOCK_PHONES.length],
        city: MOCK_CITIES[idx % MOCK_CITIES.length],
        guardian: MOCK_GUARDIANS[idx % MOCK_GUARDIANS.length],
        status: MOCK_STATUSES[idx % MOCK_STATUSES.length],
        avatar: `https://i.pravatar.cc/200?img=${MOCK_AVATARS[idx % MOCK_AVATARS.length]}`,
      }));
    },
  });

  const handleAttendanceClick = (
    studentId: string,
    studentName: string,
    action: 'present' | 'absent'
  ) => {
    setMark(studentId, action);
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = students;
    if (selectedClass) {
      list = list.filter((s) => s.enrollments?.some((e) => e.course?.id === selectedClass.courseId));
    } else {
      list = [];
    }
    
    return list.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.displayId.toLowerCase().includes(query.toLowerCase()) ||
      s.program.toLowerCase().includes(query.toLowerCase())
    );
  }, [students, query, selectedClass, isFaculty]);

  const dateKey = format(attDate, 'yyyy-MM-dd');
  const getMark = (studentId: string) => attendance[studentId]?.[dateKey];
  const setMark = (studentId: string, value: 'present' | 'absent') => {
    setAttendance((prev) => {
      const updates = {
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), [dateKey]: value },
      };
      scheduleAutoSave(updates);
      return updates;
    });
  };

  const presentCount = filtered.filter((s) => getMark(s.id) === 'present').length;
  const absentCount = filtered.filter((s) => getMark(s.id) === 'absent').length;

  const openAttendanceFor = (s: any) => {
    setAttStudent(s);
    setOpenBigCalender(true);
  };

  const { data: studentHistory } = useQuery({
    queryKey: ['attendance-history', attStudent?.id],
    queryFn: () => apiFetch('/attendance/student/' + attStudent?.id),
    enabled: !!attStudent?.id,
  });

  const calendarEvents = useMemo(() => {
    if (!studentHistory) return [];
    return studentHistory.map((record: any) => {
      const dateObj = new Date(record.date);
      return {
        id: `${attStudent?.id}-${dateObj.getTime()}`,
        title: record.status.toUpperCase() === 'PRESENT' ? 'Present' : 'Absent',
        date: dateObj,
        type: record.status.toLowerCase(),
      };
    });
  }, [studentHistory, attStudent]);

  const studentStats = useMemo(() => {
    if (!studentHistory) return { present: 0, absent: 0, total: 0, rate: 0 };
    const present = studentHistory.filter((v: any) => v.status.toUpperCase() === 'PRESENT').length;
    const absent = studentHistory.filter((v: any) => v.status.toUpperCase() === 'ABSENT').length;
    const total = studentHistory.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, rate };
  }, [studentHistory]);

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Home</span><span className="mx-1">›</span>
            <span>People</span><span className="mx-1">›</span>
            <span className="font-medium text-foreground">Students</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">Browse student profiles and mark attendance for any date.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 h-9 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors cursor-pointer">
            <Download className="h-4 w-4" /> Export
          </button>
          {isAdmin && (
            <button className="inline-flex items-center gap-2 px-3 h-9 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
              <Plus className="h-4 w-4" /> Add Student
            </button>
          )}
        </div>
      </div>

      {/* ── Attendance toolbar ───────────────────────────────────────────── */}
      <Card className="border-border/60 mb-6 overflow-hidden">
        <div className="h-1 w-full" style={{ background: 'var(--gradient-primary, linear-gradient(135deg,hsl(267,55%,52%),hsl(307,60%,62%)))' }} />
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Attendance for</div>
              <div className="text-xs text-muted-foreground">Pick a date and mark each student</div>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button className="lg:ml-4 inline-flex items-center gap-2 px-3 h-9 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors cursor-pointer">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {format(attDate, 'EEEE, MMM d, yyyy')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={attDate}
                onSelect={(d) => d && setAttDate(d)}
                className="rounded-md border shadow"
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 lg:ml-4">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48"
            >
              <option value="">-- Select Class --</option>
              {classesOnDate.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.subject.name} ({format(new Date(c.startTime), 'HH:mm')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <Badge variant="outline" className="border-primary/30 h-8 text-primary bg-primary/5">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Present {presentCount}
            </Badge>
            <Badge variant="outline" className="border-destructive/30 h-8 text-destructive bg-destructive/5">
              <XCircle className="h-3 w-3 mr-1" /> Absent {absentCount}
            </Badge>
            <button
              onClick={() => {
                setPendingAction({
                  action: 'all-present',
                });

                setConfirmOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
            >
              Mark all present
            </button>
            {selectedClassId && (
              <button
                onClick={() => triggerSave(attendance)}
                disabled={saveAttendance.isPending}
                className="inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer ml-2"
              >
                <Save className="h-4 w-4" />
                {saveAttendance.isPending ? 'Saving...' : 'Save Attendance'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search students by name, email, ID or program…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* ── Cards grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl h-72 bg-muted" />
          ))
          : filtered.map((s) => {
            const mark = getMark(s.id);
            return (
              <Card
                key={s.id}
                className="border-border/60 overflow-hidden group hover:shadow-md transition-all duration-300"
              >
                {/* Gradient banner */}
                <div
                  className="h-20 relative"
                // style={{ background: 'var(--gradient-primary, linear-gradient(135deg,hsl(267,55%,52%),hsl(307,60%,62%)))' }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'absolute top-3 right-3 bg-white/95 backdrop-blur',
                      s.status === 'Active' && 'border-primary/30 text-primary',
                      s.status === 'On Leave' && 'border-amber-400/40 text-amber-700',
                      s.status === 'Graduated' && 'border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {s.status}
                  </Badge>
                </div>

                <CardContent className="px-5 pb-5 -mt-10">
                  {/* Avatar row */}
                  <div className="flex items-end justify-between">
                    <img
                      src={s.avatar}
                      alt={s.name}
                      className="h-20 w-20 rounded-2xl border-4 border-background object-cover bg-muted shadow-sm"
                    />
                    {mark && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'mb-1',
                          mark === 'present'
                            ? 'border-primary/30 text-primary bg-primary/5'
                            : 'border-destructive/30 text-destructive bg-destructive/5',
                        )}
                      >
                        {mark === 'present' ? 'Present' : 'Absent'} · {format(attDate, 'MMM d')}
                      </Badge>
                    )}
                  </div>

                  {/* Name + ID */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-base leading-tight">{s.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{s.displayId}</p>
                  </div>

                  {/* Info rows */}
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{s.program} · Year {s.year} · Sec {s.section}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{s.city} · Guardian: {s.guardian}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-4 border-t flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleAttendanceClick(
                          s.id,
                          s.name,
                          'present'
                        )
                      }
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer',
                        mark === 'present'
                          ? 'bg-primary text-primary-foreground border-primary hover:opacity-90'
                          : 'bg-background text-foreground border-border hover:bg-accent',
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Present
                    </button>
                    <button
                      onClick={() =>
                        handleAttendanceClick(
                          s.id,
                          s.name,
                          'absent'
                        )
                      }
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-semibold border transition-colors cursor-pointer',
                        mark === 'absent'
                          ? 'bg-destructive text-white border-destructive hover:opacity-90'
                          : 'bg-background text-foreground border-border hover:bg-accent',
                      )}
                    >
                      <XCircle className="h-4 w-4" /> Absent
                    </button>
                    <button
                      onClick={
                        () => openAttendanceFor(s)
                      }
                      className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-semibold border border-border bg-background hover:bg-accent transition-colors cursor-pointer"
                    >
                      History
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {!isLoading && filtered.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {!selectedClassId 
                ? 'Please select a class from the dropdown to take attendance.' 
                : 'No students match your search.'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Attendance history calendar dialog ────────────────────────────── */}
      <Dialog open={openBigCalender} onOpenChange={setOpenBigCalender}>
        <DialogContent className="max-w-6xl w-[95vw] sm:w-[90vw] max-h-[90vh] overflow-y-auto rounded-xl p-6">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="text-primary">{attStudent?.name}</span>
              <span className="text-muted-foreground font-normal text-sm">Attendance History</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              ID: {attStudent?.studentId} • Program: {attStudent?.program} • Section: {attStudent?.section}
            </DialogDescription>
          </DialogHeader>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-2">
            <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Attendance Rate</span>
              <span className="text-lg font-bold text-primary mt-1">{studentStats.rate}%</span>
            </div>
            <div className="p-3 rounded-lg border bg-card bg-emerald-50/10 border-emerald-100/50 shadow-sm flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Present Days</span>
              <span className="text-lg font-bold text-emerald-600 mt-1">{studentStats.present}</span>
            </div>
            <div className="p-3 rounded-lg border bg-card bg-rose-50/10 border-rose-100/50 shadow-sm flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Absent Days</span>
              <span className="text-lg font-bold text-rose-600 mt-1">{studentStats.absent}</span>
            </div>
            <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Sessions</span>
              <span className="text-lg font-bold text-foreground mt-1">{studentStats.total}</span>
            </div>
          </div>

          <div>
            <BigCalendar events={calendarEvents} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        action={pendingAction?.action || 'present'}
        studentName={pendingAction?.studentName || ''}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          if (!pendingAction) return;

          if (pendingAction.action === 'all-present') {
            const updates: AttendanceMap = { ...attendance };
            filtered.forEach((s) => {
              updates[s.id] = {
                ...(updates[s.id] || {}),
                [dateKey]: 'present',
              };
            });
            setAttendance(updates);
            scheduleAutoSave(updates);
          } else {
            setMark(
              pendingAction.studentId!,
              pendingAction.action
            );
          }

          setConfirmOpen(false);
          setPendingAction(null);
        }}
      />
    </>
  );
}
