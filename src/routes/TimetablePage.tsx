import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, User, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';

export function TimetablePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Default to June 2026 (matching seeded data)

  // Drawer/Modal States
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [schedulerTab, setSchedulerTab] = useState<'class' | 'holiday' | 'event' | 'exam'>('class');
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[] | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form States - Classes
  const [classForm, setClassForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:30',
    courseId: '',
    cohortId: '',
    subjectId: '',
    facultyId: '',
    room: '',
    topic: '',
  });

  // Form States - Holidays
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'NATIONAL',
    visibleToRoles: [] as string[],
    cohortIds: [] as string[],
  });

  // Form States - Events
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'WORKSHOP',
    visibleToRoles: [] as string[],
    cohortIds: [] as string[],
    courseIds: [] as string[],
  });

  // Form States - Exams
  const [examForm, setExamForm] = useState({
    subjectId: '',
    cohortId: '',
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    room: '',
    type: 'MID_TERM',
    invigilatorId: '',
  });

  const isAdmin = user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN');

  // Queries
  const { data: calendarData = { classes: [], holidays: [], events: [], exams: [] } } = useQuery({
    queryKey: ['personalized-calendar'],
    queryFn: () => apiFetch('/timetable/personalized'),
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['courses'],
    queryFn: () => apiFetch('/courses'),
  });

  const { data: cohorts = [] } = useQuery<any[]>({
    queryKey: ['cohorts'],
    queryFn: () => apiFetch('/cohorts'),
  });

  const { data: usersData } = useQuery<any>({
    queryKey: ['users'],
    queryFn: () => apiFetch('/users?limit=100'),
  });
  const allUsers = usersData?.data || [];
  const facultyUsers = allUsers.filter((u: any) => u.roles?.includes('FACULTY'));

  // Mutations
  const scheduleClass = useMutation({
    mutationFn: (body: any) => apiFetch('/timetable/schedule', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalized-calendar'] });
      setIsSchedulerOpen(false);
      setErrorMessage(null);
      resetClassForm();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Double-booking conflict detected.');
    },
  });

  const createHoliday = useMutation({
    mutationFn: (body: any) => apiFetch('/calendar/holidays', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalized-calendar'] });
      setIsSchedulerOpen(false);
      resetHolidayForm();
    },
  });

  const createEvent = useMutation({
    mutationFn: (body: any) => apiFetch('/calendar/events', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalized-calendar'] });
      setIsSchedulerOpen(false);
      resetEventForm();
    },
  });

  const createExam = useMutation({
    mutationFn: (body: any) => apiFetch('/calendar/exams', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalized-calendar'] });
      setIsSchedulerOpen(false);
      resetExamForm();
    },
  });

  // Resets
  const resetClassForm = () => {
    setClassForm({
      date: '',
      startTime: '09:00',
      endTime: '10:30',
      courseId: '',
      cohortId: '',
      subjectId: '',
      facultyId: '',
      room: '',
      topic: '',
    });
  };

  const resetHolidayForm = () => {
    setHolidayForm({
      name: '',
      startDate: '',
      endDate: '',
      type: 'NATIONAL',
      visibleToRoles: [],
      cohortIds: [],
    });
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      type: 'WORKSHOP',
      visibleToRoles: [],
      cohortIds: [],
      courseIds: [],
    });
  };

  const resetExamForm = () => {
    setExamForm({
      subjectId: '',
      cohortId: '',
      date: '',
      startTime: '09:00',
      endTime: '12:00',
      room: '',
      type: 'MID_TERM',
      invigilatorId: '',
    });
  };

  // Submit Handlers
  const handleClassSubmit = () => {
    setErrorMessage(null);
    const startStr = `${classForm.date}T${classForm.startTime}:00.000Z`;
    const endStr = `${classForm.date}T${classForm.endTime}:00.000Z`;
    scheduleClass.mutate({
      date: new Date(classForm.date).toISOString(),
      startTime: new Date(startStr).toISOString(),
      endTime: new Date(endStr).toISOString(),
      courseId: classForm.courseId,
      cohortId: classForm.cohortId,
      subjectId: classForm.subjectId,
      facultyId: classForm.facultyId,
      room: classForm.room,
      topic: classForm.topic || undefined,
    });
  };

  const handleHolidaySubmit = () => {
    const sDate = `${holidayForm.startDate}T00:00:00.000Z`;
    const eDate = `${holidayForm.endDate}T23:59:59.000Z`;
    createHoliday.mutate({
      name: holidayForm.name,
      startDate: new Date(sDate).toISOString(),
      endDate: new Date(eDate).toISOString(),
      type: holidayForm.type,
      visibleToRoles: holidayForm.visibleToRoles.length > 0 ? holidayForm.visibleToRoles : undefined,
      cohortIds: holidayForm.cohortIds.length > 0 ? holidayForm.cohortIds : undefined,
    });
  };

  const handleEventSubmit = () => {
    const sDate = `${eventForm.startDate}T09:00:00.000Z`;
    const eDate = `${eventForm.endDate}T17:00:00.000Z`;
    createEvent.mutate({
      title: eventForm.title,
      description: eventForm.description || undefined,
      startDate: new Date(sDate).toISOString(),
      endDate: new Date(eDate).toISOString(),
      type: eventForm.type,
      visibleToRoles: eventForm.visibleToRoles.length > 0 ? eventForm.visibleToRoles : undefined,
      cohortIds: eventForm.cohortIds.length > 0 ? eventForm.cohortIds : undefined,
      courseIds: eventForm.courseIds.length > 0 ? eventForm.courseIds : undefined,
    });
  };

  const handleExamSubmit = () => {
    const sDate = `${examForm.date}T${examForm.startTime}:00.000Z`;
    const eDate = `${examForm.date}T${examForm.endTime}:00.000Z`;
    createExam.mutate({
      subjectId: examForm.subjectId,
      cohortId: examForm.cohortId,
      date: new Date(examForm.date).toISOString(),
      startTime: new Date(sDate).toISOString(),
      endTime: new Date(eDate).toISOString(),
      room: examForm.room || undefined,
      type: examForm.type,
      invigilatorId: examForm.invigilatorId || undefined,
    });
  };

  // Calendar calculation functions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isDateBetween = (date: Date, start: Date, end: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return d >= s && d <= e;
  };

  const getEventsForDay = (day: Date) => {
    const dayClasses = (calendarData.classes || []).filter((c: any) => isSameDay(day, new Date(c.date)));
    const dayHolidays = (calendarData.holidays || []).filter((h: any) => isDateBetween(day, new Date(h.startDate), new Date(h.endDate)));
    const dayEvents = (calendarData.events || []).filter((e: any) => isDateBetween(day, new Date(e.startDate), new Date(e.endDate)));
    const dayExams = (calendarData.exams || []).filter((ex: any) => isSameDay(day, new Date(ex.date)));

    return [
      ...dayClasses.map((c: any) => ({ ...c, itemType: 'class' })),
      ...dayHolidays.map((h: any) => ({ ...h, itemType: 'holiday' })),
      ...dayEvents.map((e: any) => ({ ...e, itemType: 'event' })),
      ...dayExams.map((ex: any) => ({ ...ex, itemType: 'exam' })),
    ];
  };

  const handleDayClick = (day: Date | null) => {
    if (!day) return;
    const events = getEventsForDay(day);
    if (events.length > 0) {
      setSelectedDayEvents(events);
      setSelectedDayLabel(day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    }
  };

  // Selectors details filtering
  const selectedCohortDetails = cohorts.find((c) => c.id === classForm.cohortId);
  const selectedCohortCourses = selectedCohortDetails?.cohortCourses || [];
  // Subjects linked to selected course in class Form
  const selectedCourseId = classForm.courseId;
  const courseCurriculum = courses.find((c) => c.id === selectedCourseId);
  // Flatten subjects from curriculums
  const availableSubjects = courseCurriculum?.curriculums?.flatMap((curr: any) => curr.subjects || []) || [];

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <span>Home</span><span className="mx-1">›</span>
            <span>Academics</span><span className="mx-1">›</span>
            <span className="text-gray-900 font-medium">Timetable & Planning</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            Academic Calendar
          </h1>
          <p className="text-sm text-gray-500">
            Personalized consolidated view of classes, exams, academic sessions, and institutional holidays.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isAdmin && (
            <Button onClick={() => setIsSchedulerOpen(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Schedule / Plan Activity
            </Button>
          )}
        </div>
      </div>

      {/* Calendar navigation header */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border border-gray-150 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-md font-bold text-gray-800 w-36 text-center">
            {monthNames[month]} {year}
          </h2>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-gray-600 font-medium">Classes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-gray-600 font-medium">Holidays</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            <span className="text-gray-600 font-medium">Exams</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-gray-600 font-medium">Events</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm">
        {/* Days of week labels */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-150 text-center py-2 text-xs font-semibold text-gray-600">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        {/* Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-150 min-h-[480px]">
          {daysArray.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-gray-50/50" />;
            }
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`p-2 hover:bg-gray-50/80 transition-colors flex flex-col justify-between cursor-pointer min-h-[90px] ${
                  isToday ? 'bg-amber-50/30' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${
                    isToday ? 'bg-[var(--primary)] text-[var(--primary-foreground)] w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-700'
                  }`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  {dayEvents.slice(0, 3).map((ev: any, evIdx: number) => {
                    let colorClass = 'bg-blue-50 text-blue-700 border-blue-100';
                    if (ev.itemType === 'holiday') colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
                    if (ev.itemType === 'exam') colorClass = 'bg-purple-50 text-purple-700 border-purple-100';
                    if (ev.itemType === 'event') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';

                    return (
                      <div
                        key={evIdx}
                        className={`text-[9px] font-medium leading-tight truncate px-1 py-0.5 rounded border ${colorClass}`}
                      >
                        {ev.subject?.name || ev.name || ev.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[8px] text-gray-400 font-semibold pl-1">
                      + {dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date detail Modal */}
      <Modal
        isOpen={!!selectedDayEvents}
        onClose={() => setSelectedDayEvents(null)}
        title={selectedDayLabel}
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {selectedDayEvents?.map((ev: any, idx: number) => {
            let badgeColor = 'bg-blue-100 text-blue-800';
            let icon = <Clock className="w-4 h-4 text-blue-500" />;
            if (ev.itemType === 'holiday') {
              badgeColor = 'bg-rose-100 text-rose-800';
              icon = <Sparkles className="w-4 h-4 text-rose-500" />;
            }
            if (ev.itemType === 'exam') {
              badgeColor = 'bg-purple-100 text-purple-800';
              icon = <FileText className="w-4 h-4 text-purple-500" />;
            }
            if (ev.itemType === 'event') {
              badgeColor = 'bg-emerald-100 text-emerald-800';
              icon = <CalendarIcon className="w-4 h-4 text-emerald-500" />;
            }

            const startTimeStr = ev.startTime ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const endTimeStr = ev.endTime ? new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-gray-800 truncate">
                      {ev.subject?.name || ev.name || ev.title}
                    </h4>
                    <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${badgeColor}`}>
                      {ev.itemType}
                    </span>
                  </div>
                  {ev.itemType === 'class' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {startTimeStr} – {endTimeStr}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Room {ev.room}</div>
                      <div className="flex items-center gap-1"><User className="w-3 h-3" /> {ev.faculty?.firstName} {ev.faculty?.lastName}</div>
                      <div className="flex items-center gap-1 font-semibold text-gray-700">Cohort: {ev.cohort?.name}</div>
                      {ev.topic && <div className="col-span-2 mt-1 bg-white p-1 rounded border border-gray-100">Topic: {ev.topic}</div>}
                    </div>
                  )}
                  {ev.itemType === 'exam' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {startTimeStr} – {endTimeStr}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Room {ev.room}</div>
                      <div className="flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-1 rounded">Type: {ev.type}</div>
                      <div className="flex items-center gap-1">Invigilator: {ev.invigilator?.firstName || 'None'}</div>
                    </div>
                  )}
                  {ev.itemType === 'holiday' && (
                    <div className="text-[10px] text-gray-500">
                      <span>Category: <strong>{ev.type}</strong></span>
                    </div>
                  )}
                  {ev.itemType === 'event' && (
                    <div className="text-[10px] text-gray-500 space-y-1">
                      <div>Category: <strong>{ev.type}</strong></div>
                      {ev.description && <p className="bg-white p-1 rounded border border-gray-100 mt-1">{ev.description}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Admin Scheduler Drawer */}
      <Drawer
        isOpen={isSchedulerOpen}
        onClose={() => {
          setIsSchedulerOpen(false);
          setErrorMessage(null);
        }}
        title="Schedule Academic Activity"
        description="Schedule classes, list campus holidays, host events, or publish examination timetables."
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 text-xs">
            {(['class', 'holiday', 'event', 'exam'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSchedulerTab(tab);
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 border-b-2 font-medium capitalize transition-colors cursor-pointer ${
                  schedulerTab === tab
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Conflict Error Message Display */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form tab Content */}
          {schedulerTab === 'class' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Cohort</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={classForm.cohortId}
                  onChange={(e) => setClassForm({ ...classForm, cohortId: e.target.value, courseId: '', subjectId: '' })}
                >
                  <option value="">-- Choose Cohort Batch --</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Course</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={classForm.courseId}
                  disabled={!classForm.cohortId}
                  onChange={(e) => setClassForm({ ...classForm, courseId: e.target.value, subjectId: '' })}
                >
                  <option value="">-- Choose Course --</option>
                  {selectedCohortCourses.map((cc: any) => (
                    <option key={cc.course.id} value={cc.course.id}>{cc.course.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Subject</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={classForm.subjectId}
                  disabled={!classForm.courseId}
                  onChange={(e) => setClassForm({ ...classForm, subjectId: e.target.value })}
                >
                  <option value="">-- Choose Subject --</option>
                  {availableSubjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Faculty</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={classForm.facultyId}
                  onChange={(e) => setClassForm({ ...classForm, facultyId: e.target.value })}
                >
                  <option value="">-- Choose Instructor --</option>
                  {facultyUsers.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Date</label>
                <Input
                  type="date"
                  value={classForm.date}
                  onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Start Time</label>
                  <Input
                    type="time"
                    value={classForm.startTime}
                    onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">End Time</label>
                  <Input
                    type="time"
                    value={classForm.endTime}
                    onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Lecture Room</label>
                <Input
                  placeholder="e.g. Room A101"
                  value={classForm.room}
                  onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Topic Outline (Optional)</label>
                <Input
                  placeholder="e.g. Introduction to Balance Sheet"
                  value={classForm.topic}
                  onChange={(e) => setClassForm({ ...classForm, topic: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsSchedulerOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleClassSubmit}
                  disabled={scheduleClass.isPending || !classForm.cohortId || !classForm.subjectId || !classForm.facultyId || !classForm.date}
                >
                  {scheduleClass.isPending ? 'Scheduling...' : 'Schedule Class'}
                </Button>
              </div>
            </div>
          )}

          {schedulerTab === 'holiday' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Holiday Label</label>
                <Input
                  placeholder="e.g. Christmas Day"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Start Date</label>
                  <Input
                    type="date"
                    value={holidayForm.startDate}
                    onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">End Date</label>
                  <Input
                    type="date"
                    value={holidayForm.endDate}
                    onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Category</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                >
                  <option value="NATIONAL">NATIONAL</option>
                  <option value="FESTIVAL">FESTIVAL</option>
                  <option value="INSTITUTION">INSTITUTION</option>
                  <option value="SEMESTER_BREAK">SEMESTER BREAK</option>
                </select>
              </div>
              {/* Target filters */}
              <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-150">
                <span className="text-[10px] font-bold text-gray-400 block mb-1">AUDIENCE TARGET FILTERS (LEAVE EMPTY FOR GLOBAL)</span>
                <div className="space-y-3 mt-2 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Specific Roles Only</label>
                    <div className="flex gap-2">
                      {['STUDENT', 'FACULTY'].map((role) => (
                        <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[var(--primary)]"
                            checked={holidayForm.visibleToRoles.includes(role)}
                            onChange={() => {
                              const next = [...holidayForm.visibleToRoles];
                              const idx = next.indexOf(role);
                              if (idx > -1) next.splice(idx, 1);
                              else next.push(role);
                              setHolidayForm({ ...holidayForm, visibleToRoles: next });
                            }}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Specific Cohorts Only</label>
                    <div className="max-h-24 overflow-y-auto border border-gray-200 rounded bg-white p-1">
                      {cohorts.map((c) => (
                        <label key={c.id} className="flex items-center gap-1.5 p-1 cursor-pointer hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[var(--primary)]"
                            checked={holidayForm.cohortIds.includes(c.id)}
                            onChange={() => {
                              const next = [...holidayForm.cohortIds];
                              const idx = next.indexOf(c.id);
                              if (idx > -1) next.splice(idx, 1);
                              else next.push(c.id);
                              setHolidayForm({ ...holidayForm, cohortIds: next });
                            }}
                          />
                          <span className="text-[11px] text-gray-750">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsSchedulerOpen(false)}>Cancel</Button>
                <Button onClick={handleHolidaySubmit} disabled={createHoliday.isPending || !holidayForm.name || !holidayForm.startDate || !holidayForm.endDate}>
                  {createHoliday.isPending ? 'Saving...' : 'Add Holiday'}
                </Button>
              </div>
            </div>
          )}

          {schedulerTab === 'event' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Event Title</label>
                <Input
                  placeholder="e.g. Financial Management Seminar"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Description</label>
                <Input
                  placeholder="Seminar description..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Start Date</label>
                  <Input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">End Date</label>
                  <Input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Event Type</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                >
                  <option value="ORIENTATION">ORIENTATION</option>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="SEMINAR">SEMINAR</option>
                  <option value="GUEST_LECTURE">GUEST LECTURE</option>
                  <option value="CONVOCATION">CONVOCATION</option>
                  <option value="FACULTY_MEETING">FACULTY MEETING</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              {/* Target filters */}
              <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-150">
                <span className="text-[10px] font-bold text-gray-400 block mb-1">AUDIENCE TARGET FILTERS (LEAVE EMPTY FOR GLOBAL)</span>
                <div className="space-y-3 mt-2 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Specific Roles Only</label>
                    <div className="flex gap-2">
                      {['STUDENT', 'FACULTY'].map((role) => (
                        <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[var(--primary)]"
                            checked={eventForm.visibleToRoles.includes(role)}
                            onChange={() => {
                              const next = [...eventForm.visibleToRoles];
                              const idx = next.indexOf(role);
                              if (idx > -1) next.splice(idx, 1);
                              else next.push(role);
                              setEventForm({ ...eventForm, visibleToRoles: next });
                            }}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Specific Cohorts Only</label>
                    <div className="max-h-24 overflow-y-auto border border-gray-200 rounded bg-white p-1">
                      {cohorts.map((c) => (
                        <label key={c.id} className="flex items-center gap-1.5 p-1 cursor-pointer hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[var(--primary)]"
                            checked={eventForm.cohortIds.includes(c.id)}
                            onChange={() => {
                              const next = [...eventForm.cohortIds];
                              const idx = next.indexOf(c.id);
                              if (idx > -1) next.splice(idx, 1);
                              else next.push(c.id);
                              setEventForm({ ...eventForm, cohortIds: next });
                            }}
                          />
                          <span className="text-[11px] text-gray-750">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsSchedulerOpen(false)}>Cancel</Button>
                <Button onClick={handleEventSubmit} disabled={createEvent.isPending || !eventForm.title || !eventForm.startDate || !eventForm.endDate}>
                  {createEvent.isPending ? 'Saving...' : 'Add Event'}
                </Button>
              </div>
            </div>
          )}

          {schedulerTab === 'exam' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Cohort</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={examForm.cohortId}
                  onChange={(e) => setExamForm({ ...examForm, cohortId: e.target.value, subjectId: '' })}
                >
                  <option value="">-- Choose Cohort Batch --</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Subject</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={examForm.subjectId}
                  disabled={!examForm.cohortId}
                  onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                >
                  <option value="">-- Choose Subject --</option>
                  {/* Pull subjects for cohort */}
                  {cohorts.find((c) => c.id === examForm.cohortId)?.cohortCourses?.flatMap((cc: any) => cc.curriculum.subjects).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Select Invigilator</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={examForm.invigilatorId}
                  onChange={(e) => setExamForm({ ...examForm, invigilatorId: e.target.value })}
                >
                  <option value="">-- Choose Faculty member --</option>
                  {facultyUsers.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Exam Date</label>
                <Input
                  type="date"
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Start Time</label>
                  <Input
                    type="time"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">End Time</label>
                  <Input
                    type="time"
                    value={examForm.endTime}
                    onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Exam Room</label>
                <Input
                  placeholder="e.g. Examination Hall B"
                  value={examForm.room}
                  onChange={(e) => setExamForm({ ...examForm, room: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Assessment Type</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  value={examForm.type}
                  onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                >
                  <option value="MID_TERM">MID TERM</option>
                  <option value="FINAL">FINAL EXAM</option>
                  <option value="VIVA">VIVA VOCE</option>
                  <option value="PRACTICAL">PRACTICAL</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsSchedulerOpen(false)}>Cancel</Button>
                <Button onClick={handleExamSubmit} disabled={createExam.isPending || !examForm.cohortId || !examForm.subjectId || !examForm.date}>
                  {createExam.isPending ? 'Scheduling...' : 'Schedule Exam'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
