import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, User, AlertCircle, Sparkles, FileText, ClipboardCheck } from 'lucide-react';
import { AttendanceModal } from '../components/attendance/AttendanceModal';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Modal } from '../components/ui/Modal';

export function TimetablePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date()); // Default to June 2026 (matching seeded data)
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<any | null>(null);

  // Drawer/Modal States
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [schedulerTab, setSchedulerTab] = useState<'class' | 'holiday' | 'event' | 'exam'>('class');
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[] | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<any>(null);

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
    isActive: true,
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
      isActive: true,
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
      isActive: eventForm.isActive,
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

  // Calendar calculation functions & view management helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (view === 'day') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (view === 'day') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  };

  const getDayTitle = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getWeekTitle = (date: Date) => {
    const start = getStartOfWeek(date);
    const end = getEndOfWeek(date);
    const startOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const endOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    if (start.getFullYear() !== end.getFullYear()) {
      startOpt.year = 'numeric';
    }
    return `${start.toLocaleDateString('en-US', startOpt)} – ${end.toLocaleDateString('en-US', endOpt)}`;
  };

  const getHeaderTitle = () => {
    if (view === 'day') return getDayTitle(currentDate);
    if (view === 'week') return getWeekTitle(currentDate);
    if (view === 'month') return `${monthNames[month]} ${year}`;
    return `${year}`;
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  // Create grid cells for Month View
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
  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const holidays = dayEvents.filter((ev) => ev.itemType === 'holiday');
    const timedEvents = dayEvents;

    const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

    const getEventsStartingInHour = (hr: number) => {
      return timedEvents.filter((ev) => {
        const timeVal = ev.startTime || ev.startDate;
        if (!timeVal) return false;
        const d = new Date(timeVal);
        return d.getHours() === hr;
      });
    };

    const formatHour = (hr: number) => {
      if (hr === 0) return '12 AM';
      if (hr === 12) return '12 PM';
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const h = hr % 12 === 0 ? 12 : hr % 12;
      return `${h} ${ampm}`;
    };

    // Mini Calendar Calculations
    const miniYear = currentDate.getFullYear();
    const miniMonth = currentDate.getMonth();
    const miniFirstDayIndex = new Date(miniYear, miniMonth, 1).getDay();
    const miniNumDays = new Date(miniYear, miniMonth + 1, 0).getDate();

    const prevMonthNumDays = new Date(miniYear, miniMonth, 0).getDate();
    const miniDaysArray: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = miniFirstDayIndex - 1; i >= 0; i--) {
      miniDaysArray.push({
        date: new Date(miniYear, miniMonth - 1, prevMonthNumDays - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= miniNumDays; i++) {
      miniDaysArray.push({
        date: new Date(miniYear, miniMonth, i),
        isCurrentMonth: true,
      });
    }
    const remainingCells = 42 - miniDaysArray.length;
    for (let i = 1; i <= remainingCells; i++) {
      miniDaysArray.push({
        date: new Date(miniYear, miniMonth + 1, i),
        isCurrentMonth: false,
      });
    }


    return (
      <div className="space-y-6 bg-white border border-gray-150 rounded-xl shadow-sm overflow-hidden">
        {holidays.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-100 p-4 space-y-2">
            {holidays.map((h, hIdx) => (
              <div
                key={hIdx}
                onClick={() => handleDayClick(currentDate)}
                className="flex flex-col items-start justify-center text-xs font-bold text-rose-700 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="block mb-0.5 text-[9px] text-rose-400 uppercase tracking-widest font-extrabold">holiday</span>
                <span className="leading-snug text-sm">{h.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className=" border-gray-100">
          <div className="overflow-x-auto day-view-scrollbar">
            <div
              className="grid min-w-[2400px] border border-gray-100 rounded-xl divide-x divide-y divide-gray-100 bg-gray-50/20"
              style={{
                gridTemplateColumns: 'repeat(24, minmax(200px, 1fr))',
                gridTemplateRows: 'auto 380px',
              }}
            >
              {/* Header Columns 1-24: Hour Headers */}
              {hours.map((hr, hrIdx) => {
                const hourEvents = getEventsStartingInHour(hr);

                let dotColor = '';

                if (hourEvents.length > 0) {
                  const firstEv = hourEvents[0];

                  if (firstEv.itemType === 'holiday') dotColor = 'bg-rose-500';
                  else if (firstEv.itemType === 'exam') dotColor = 'bg-purple-500';
                  else if (firstEv.itemType === 'event') dotColor = 'bg-emerald-500';
                  else dotColor = 'bg-blue-500';
                }

                return (
                  <div
                    key={`header-${hr}`}
                    className="p-3 text-center border-b border-r border-gray-100 bg-gray-50/50 font-bold text-xs text-gray-400 select-none flex flex-col items-center justify-center"
                    style={{ gridColumn: hrIdx + 1, gridRow: 1 }}
                  >
                    <span>{formatHour(hr)}</span>

                    {hourEvents.length > 0 && (
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full ${dotColor}`}
                      />
                    )}
                  </div>
                );
              })}

              {/* Row 2, Columns 1-24: Hour Cells */}
              {hours.map((hr, hrIdx) => {
                const hourEvents = getEventsStartingInHour(hr);
                return (
                  <div
                    key={`cell-${hr}`}
                    className="p-2 border-r border-gray-100 flex flex-col justify-start gap-1 h-[380px] bg-white overflow-y-auto overflow-x-visible"
                    style={{ gridColumn: hrIdx + 1, gridRow: 2 }}
                  >
                    {hourEvents.length > 0 ? (
                      hourEvents.map((ev, evIdx) => {
                        let colorClass = 'bg-blue-50 text-blue-700 border-blue-100';
                        if (ev.itemType === 'holiday') colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
                        if (ev.itemType === 'exam') colorClass = 'bg-purple-50 text-purple-700 border-purple-100';
                        if (ev.itemType === 'event') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';

                        const isSelected = selectedTimelineEvent?.id === ev.id && selectedTimelineEvent?.itemType === ev.itemType;

                        return (
                          <div
                            key={evIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTimelineEvent(ev);
                              handleDayClick(currentDate);
                            }}
                            className={`text-[10px] font-medium leading-tight px-2 py-1 rounded border-l-4 cursor-pointer hover:opacity-80 transition-all inline-block whitespace-nowrap w-max ${colorClass} ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''
                              }`}
                            title={`${ev.subject?.name || ev.name || ev.title}${ev.room ? ` (Room ${ev.room})` : ''}`}
                          >
                            {ev.subject?.name || ev.name || ev.title}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col justify-between h-full py-4 opacity-40">
                        <div className="border-b border-dashed border-gray-250 w-full" />
                        <div className="border-b border-dashed border-gray-250 w-full" />
                        <div className="border-b border-dashed border-gray-250 w-full" />
                        <div className="border-b border-dashed border-gray-250 w-full" />
                        <div className="border-b border-dashed border-gray-250 w-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

const getEventsStartingInHourForDay = (day: Date, hr: number) => {
  const dayEvents = getEventsForDay(day);

  return dayEvents.filter((ev) => {
    if (ev.itemType === 'holiday') return false;

    const timeValue = ev.startTime || ev.startDate;

    if (!timeValue) return false;

    const d = new Date(timeValue);

    return d.getHours() === hr;
  });
};

    const formatHour = (hr: number) => {
      if (hr === 12) return 'Midday';
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const h = hr % 12 === 0 ? 12 : hr % 12;
      return `${h} ${ampm}`;
    };

    return (
      <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[420px] scrollbar-hide">
          {/* Scrollable weekly timeline grid layout */}
          <div
            className="grid min-w-[1000px] border border-gray-100 rounded-xl divide-x divide-y divide-gray-100 bg-gray-50/20"
            style={{
              gridTemplateColumns: '120px repeat(7, minmax(180px, 1fr))',
              gridTemplateRows: '60px repeat(24, 60px)',
            }}
          >
            {/* Header Column 1: Time label header */}
            <div
              className="p-3 font-bold text-xs text-gray-400 select-none bg-gray-50/50 flex items-center justify-center border-b border-gray-100"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              Time
            </div>
            {/* Header Columns 2-8: Day Headers */}
            {weekDays.map((day, dIdx) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, currentDate);
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;

              let dotColor = '';
              if (hasEvents) {
                const firstEv = dayEvents[0];
                if (firstEv.itemType === 'holiday') dotColor = 'bg-rose-500';
                else if (firstEv.itemType === 'exam') dotColor = 'bg-purple-500';
                else if (firstEv.itemType === 'event') dotColor = 'bg-emerald-500';
                else dotColor = 'bg-blue-500';
              }

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day);
                  }}
                  className={`p-3 text-center border-b border-gray-150 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center relative ${isToday ? 'bg-amber-50/30' : isSelected ? 'bg-blue-50/20' : 'bg-gray-50/50'
                    }`}
                  style={{ gridColumn: dIdx + 2, gridRow: 1 }}
                >
                  <span className="text-[10px] font-extrabold text-gray-500 block uppercase tracking-wider">
                    {dayNamesShort[dIdx]}
                  </span>
                  <div className="relative mt-1 flex flex-col items-center">
                    <span
                      className={`text-sm font-black inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday
                        ? 'bg-[var(--primary)] text-white'
                        : isSelected
                          ? 'bg-blue-100 text-blue-800 font-bold'
                          : 'text-gray-750'
                        }`}
                    >
                      {day.getDate()}
                    </span>
                    {hasEvents && (
                      <span className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Hourly Rows */}
            {hours.flatMap((hr, hrIdx) => {
              const rowIdx = hrIdx + 2;

              // Hour Label Cell (Column 1)
              const hourLabelCell = (
                <div
                  key={`hr-${hr}`}
                  className="p-3 font-bold text-xs text-gray-400 select-none flex items-center justify-center bg-gray-50/30 border-b border-gray-100"
                  style={{ gridColumn: 1, gridRow: rowIdx }}
                >
                  {formatHour(hr)}
                </div>
              );

              // Grid cells for each day under this hour
              const dayCells = weekDays.map((day, dIdx) => {
                const colIdx = dIdx + 2;
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, currentDate);
                const dayEvents = getEventsForDay(day);
                const dayHolidays = dayEvents.filter((ev) => ev.itemType === 'holiday');

                if (dayHolidays.length > 0) {
                  // Render holiday card ONLY on the first hour row (starts at row 2 and spans all hours)
                  if (hrIdx === 0) {
                    return (
                      <div
                        key={`holiday-${day.toISOString()}`}
                        className={`p-2 border-b border-gray-100 flex items-center justify-center ${isToday ? 'bg-amber-50/10' : isSelected ? 'bg-blue-50/10' : 'bg-white'
                          }`}
                        style={{
                          gridColumn: colIdx,
                          gridRow: `2 / span ${hours.length}`
                        }}
                      >
                        {dayHolidays.map((h, hIdx) => (
                          <div
                            key={hIdx}
                            onClick={() => handleDayClick(day)}
                            className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-xs font-bold text-rose-700 bg-transparent rounded-xl p-4 text-center shadow-sm cursor-pointer "
                          >
                            <span className="block mb-2 text-[9px] text-rose-400 uppercase tracking-widest font-extrabold">holiday</span>
                            <span className="leading-snug">{h.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  // Skip rendering for subsequent rows
                  return null;
                }

                // Regular time-day cell
                const hourEvents = getEventsStartingInHourForDay(day, hr);
                return (
                  <div
                    key={`cell-${day.toISOString()}-${hr}`}
                    className={`p-2 border-b border-r border-gray-100 flex flex-col justify-center min-h-[60px] ${isToday ? 'bg-amber-50/10' : isSelected ? 'bg-blue-50/10' : 'bg-white'
                      }`}
                    style={{ gridColumn: colIdx, gridRow: rowIdx }}
                  >
                    {hourEvents.length > 0 ? (
                      hourEvents.map((ev, evIdx) => {
                        let colorClass = 'bg-blue-50 text-blue-700 border-blue-100';
                        if (ev.itemType === 'holiday') colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
                        if (ev.itemType === 'exam') colorClass = 'bg-purple-50 text-purple-700 border-purple-100';
                        if (ev.itemType === 'event') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';

                        return (
                          <div
                            key={evIdx}
                            onClick={() => handleDayClick(day)}
                            className={`text-[9px] font-medium leading-tight px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
                            title={`${ev.subject?.name || ev.name || ev.title}${ev.room ? ` (Room ${ev.room})` : ''}`}
                          >
                            {ev.subject?.name || ev.name || ev.title}
                          </div>
                        );
                      })
                    ) : (
                      // Visual placeholder dash line
                      <div className="border-b border-dashed border-gray-100/80 w-full my-auto" />
                    )}
                  </div>
                );
              });

              return [hourLabelCell, ...dayCells].filter(Boolean);
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="bg-white border border-gray-150 rounded-xl overflow-y-auto scrollbar-hide max-h-[420px] shadow-sm">
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
                className={`p-2 hover:bg-gray-50/80 transition-colors flex flex-col justify-between cursor-pointer min-h-[90px] ${isToday ? 'bg-amber-50/30' : ''
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${isToday ? 'bg-[var(--primary)] text-[var(--primary-foreground)] w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-700'
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
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className="grid grid-cols-1 max-h-[420px] overflow-y-auto scrollbar-hide sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map((mIdx) => {
          const firstDay = new Date(year, mIdx, 1).getDay();
          const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

          // Build local array of cells for this month
          const monthDays: (Date | null)[] = [];
          for (let i = 0; i < firstDay; i++) {
            monthDays.push(null);
          }
          for (let i = 1; i <= daysInMonth; i++) {
            monthDays.push(new Date(year, mIdx, i));
          }

          return (
            <div
              key={mIdx}
              className="bg-white border border-gray-150 rounded-xl p-3 shadow-sm flex flex-col justify-between"
            >
              <h3 className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1.5 uppercase tracking-wide">
                {monthNames[mIdx]}
              </h3>

              {/* Day Labels Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-gray-400 mb-1">
                {dayLabels.map((lbl, idx) => (
                  <div key={idx}>{lbl}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {monthDays.map((day, dIdx) => {
                  if (!day) {
                    return <div key={`empty-${dIdx}`} className="h-5 w-5" />;
                  }

                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const hasEvents = dayEvents.length > 0;

                  // Determine color class if it has events
                  let dotColor = '';
                  if (hasEvents) {
                    const firstEv = dayEvents[0];
                    if (firstEv.itemType === 'holiday') dotColor = 'bg-rose-500';
                    else if (firstEv.itemType === 'exam') dotColor = 'bg-purple-500';
                    else if (firstEv.itemType === 'event') dotColor = 'bg-emerald-500';
                    else dotColor = 'bg-blue-500';
                  }

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => {
                        setCurrentDate(day);
                        setView('day');
                      }}
                      className={`h-5 w-5 text-[10px] font-bold rounded-full flex flex-col items-center justify-center cursor-pointer transition-all relative ${isToday
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-black'
                        : hasEvents
                          ? 'bg-blue-50/50 text-blue-700 font-bold'
                          : 'text-gray-600'
                        }`}
                    >
                      <span>{day.getDate()}</span>

                      {/* Little event indicator dot */}
                      {hasEvents && !isToday && (
                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dotColor}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
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

      {/* Calendar Controls & Navigation */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center bg-[#FEF2FD] border border-gray-200 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white text-gray-600 rounded-md" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 px-3 text-xs font-semibold hover:bg-white text-gray-700 rounded-md border-x border-gray-200 flex items-center gap-1.5 cursor-pointer">
                  <span>{getHeaderTitle()}</span>
                  {/* <span className="text-[10px] text-gray-400 font-normal border-l pl-1.5 ml-0.5 whitespace-nowrap">
                    Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span> */}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-gray-205 rounded-lg shadow-md z-50 pointer-events-auto" align="center">
                <div className="p-2 border-b border-gray-100 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-semibold text-gray-500 pl-1">
                    Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <Button
                    variant="ghost"
                    className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-md cursor-pointer"
                    onClick={() => {
                      handleToday();
                      setIsCalendarOpen(false);
                    }}
                  >
                    Go to Today
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(d) => {
                    if (d) {
                      setCurrentDate(d);
                      setIsCalendarOpen(false);
                    }
                  }}
                  className="rounded-md border shadow p-3"
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white text-gray-600 rounded-md" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* <h2 className="text-sm md:text-base font-bold text-gray-800 min-w-[140px] md:min-w-[180px] text-center md:text-left">
            {getHeaderTitle()}
          </h2> */}
        </div>

        {/* View Switcher Tabs & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-gray-600 font-medium">Classes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-gray-600 font-medium">Holidays</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
              <span className="text-gray-600 font-medium">Exams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-gray-600 font-medium">Events</span>
            </div>
          </div>

          {/* Switcher Tabs */}
          <div className="inline-flex p-0.5 bg-[#FEF2FD] border border-[#F5EDF5] rounded-xl gap-1">
            {(['day', 'week', 'month', 'year'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${view === v
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Body Rendering */}
      <div className="mb-6">
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
        {view === 'year' && renderYearView()}
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

                      {ev.facultyId === user?.id && (
                        <div className="flex flex-col items-end col-span-2 mt-2 border-t pt-2">
                          <Button
                            onClick={() => {
                              setSelectedAttendanceClass(ev);
                              setAttendanceModalOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                            className=" h-10 flex items-center justify-center gap-2 rounded-xl !bg-primary !text-white font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer "
                          >
                            <ClipboardCheck className="w-3 h-3" /> Take Attendance
                          </Button>
                        </div>
                      )}
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
                className={`py-2 px-3 border-b-2 font-medium capitalize transition-colors cursor-pointer ${schedulerTab === tab
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
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-150 mb-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-gray-700">Event Status</span>
                  <span className="text-[10px] text-gray-500">
                    Set whether this event is active and visible
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={eventForm.isActive}
                    onChange={(e) => setEventForm({ ...eventForm, isActive: e.target.checked })}
                  />
                  <div
                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"
                    style={{ backgroundColor: eventForm.isActive ? 'var(--primary)' : '#e5e5e5' }}
                  />
                  <span className="ml-2.5 text-xs font-medium text-gray-700 min-w-[50px]">
                    {eventForm.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
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
                  onChange={(e) => { setExamForm({ ...examForm, cohortId: e.target.value, subjectId: '' }) }}
                >
                  <option value="">-- Choose Cohort Batch --</option>
                  {cohorts?.map((c) => (
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
                  {(cohorts.find((c) => c.id === examForm.cohortId)?.cohortCourses?.flatMap((cc: any) => cc.curriculum?.subjects || []) || []).map((s: any) => (
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

      <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => {
          setAttendanceModalOpen(false);
          setSelectedAttendanceClass(null);
        }}
        classSchedule={selectedAttendanceClass}
      />
    </>
  );
}
