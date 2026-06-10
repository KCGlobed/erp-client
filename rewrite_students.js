const fs = require('fs');

const path = './src/routes/StudentsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  "import { useState, useMemo } from 'react';",
  "import { useState, useMemo, useEffect, useRef } from 'react';"
);
content = content.replace(
  "import { useQuery } from '@tanstack/react-query';",
  "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';"
);
content = content.replace(
  "  ClipboardCheck,\n} from 'lucide-react';",
  "  ClipboardCheck,\n  Save\n} from 'lucide-react';"
);

// 2. Add queries and new state variables inside the component
const componentStartStr = `export function StudentsPage() {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');`;

const newComponentState = `export function StudentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
`;
content = content.replace(componentStartStr, newComponentState);

// 3. Inject timetable and class filtering logic right before "const isFaculty"
const beforeIsFaculty = `  const isFaculty = user?.roles?.includes('FACULTY');`;
const newQueries = `
  const { data: scheduleData } = useQuery<any>({
    queryKey: ['timetable'],
    queryFn: () => apiFetch('/timetable/personalized'),
  });

  const classesOnDate = useMemo(() => {
    if (!scheduleData?.classes) return [];
    return scheduleData.classes.filter((c: any) => {
      return format(new Date(c.date), 'yyyy-MM-dd') === format(attDate, 'yyyy-MM-dd');
    });
  }, [scheduleData, attDate]);

  useEffect(() => {
    if (selectedClassId && !classesOnDate.find((c: any) => c.id === selectedClassId)) {
      setSelectedClassId('');
    }
  }, [classesOnDate, selectedClassId]);

  const selectedClass = classesOnDate.find((c: any) => c.id === selectedClassId);

  const { data: existingAttendance } = useQuery<any>({
    queryKey: ['attendance', selectedClassId],
    queryFn: () => apiFetch('/attendance/class/' + selectedClassId),
    enabled: !!selectedClassId,
  });

  useEffect(() => {
    if (existingAttendance?.records && selectedClassId) {
      const newMap: AttendanceMap = {};
      const dKey = format(attDate, 'yyyy-MM-dd');
      existingAttendance.records.forEach((r: any) => {
        newMap[r.studentId] = { [dKey]: r.status.toLowerCase() as 'present' | 'absent' };
      });
      setAttendance(newMap);
    } else {
      setAttendance({});
    }
  }, [existingAttendance, selectedClassId, attDate]);

  const saveAttendance = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch('/attendance/class/' + selectedClassId, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedClassId] });
      // Remove any annoying alerts, just quiet success
    },
    onError: (error: any) => {
      alert('Error saving attendance: ' + error.message);
    }
  });

  const triggerSave = (updates: AttendanceMap) => {
    if (!selectedClassId) return;
    const records = Object.entries(updates).map(([studentId, dates]) => {
      const status = dates[format(attDate, 'yyyy-MM-dd')];
      if (!status) return null;
      return { studentId, status: status.toUpperCase() };
    }).filter(Boolean);
    
    saveAttendance.mutate({
      date: attDate.toISOString(),
      records,
    });
  };

  const scheduleAutoSave = (updates: AttendanceMap) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(updates);
    }, 2000);
  };

  const isFaculty = user?.roles?.includes('FACULTY');`;
content = content.replace(beforeIsFaculty, newQueries);

// 4. Update students filter logic to only include enrolled students if a class is selected
const oldFilteredStr = `  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.email.toLowerCase().includes(query.toLowerCase()) ||
          s.studentId.toLowerCase().includes(query.toLowerCase()) ||
          s.program.toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  );`;

const newFilteredStr = `  const filtered = useMemo(() => {
    let list = students;
    if (selectedClass) {
      list = list.filter((s) => s.enrollments?.some((e: any) => e.course?.id === selectedClass.courseId));
    } else {
      list = []; // If no class selected, maybe show nothing or keep all? Let's show nothing if faculty, or keep all.
      // Actually, if faculty, only show students when a class is selected.
      if (isFaculty) list = [];
    }
    
    return list.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.studentId.toLowerCase().includes(query.toLowerCase()) ||
      s.program.toLowerCase().includes(query.toLowerCase())
    );
  }, [students, query, selectedClass, isFaculty]);`;
content = content.replace(oldFilteredStr, newFilteredStr);

// 5. Update setMark to trigger auto-save
const oldSetMarkStr = `  const setMark = (studentId: string, value: 'present' | 'absent') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [dateKey]: value },
    }));
  };`;
const newSetMarkStr = `  const setMark = (studentId: string, value: 'present' | 'absent') => {
    setAttendance((prev) => {
      const updates = {
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), [dateKey]: value },
      };
      scheduleAutoSave(updates);
      return updates;
    });
  };`;
content = content.replace(oldSetMarkStr, newSetMarkStr);

// 6. Update onConfirm to trigger auto-save for "Mark all present"
const oldOnConfirmStr = `          if (pendingAction.action === 'all-present') {
            const updates: AttendanceMap = { ...attendance };

            filtered.forEach((s) => {
              updates[s.studentId] = {
                ...(updates[s.studentId] || {}),
                [dateKey]: 'present',
              };
            });

            setAttendance(updates);
          }`;
const newOnConfirmStr = `          if (pendingAction.action === 'all-present') {
            const updates: AttendanceMap = { ...attendance };
            filtered.forEach((s) => {
              updates[s.studentId] = {
                ...(updates[s.studentId] || {}),
                [dateKey]: 'present',
              };
            });
            setAttendance(updates);
            scheduleAutoSave(updates);
          }`;
content = content.replace(oldOnConfirmStr, newOnConfirmStr);

// 7. Inject Class Selector and Save Button into the UI
// Look for the date popover
const popoverStr = `          <Popover>
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
          </Popover>`;

const popoverWithClassSelector = popoverStr + `

          {isFaculty && (
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
          )}`;

content = content.replace(popoverStr, popoverWithClassSelector);

// Add Save button next to Mark all present
const markAllStr = `            <button
              onClick={() => {
                setPendingAction({
                  action: 'all-present',
                });

                setConfirmOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
            >
              Mark all present
            </button>`;

const markAllWithSaveStr = markAllStr + `
            {isFaculty && selectedClassId && (
              <button
                onClick={() => triggerSave(attendance)}
                disabled={saveAttendance.isPending}
                className="inline-flex items-center gap-2 px-3 h-8 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer ml-2"
              >
                <Save className="h-4 w-4" />
                {saveAttendance.isPending ? 'Saving...' : 'Save Attendance'}
              </button>
            )}`;

content = content.replace(markAllStr, markAllWithSaveStr);

// Show empty state if faculty and no class selected
const oldEmptyStateStr = `        {!isLoading && filtered.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No students match your search.
            </CardContent>
          </Card>
        )}`;

const newEmptyStateStr = `        {!isLoading && filtered.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {isFaculty && !selectedClassId 
                ? 'Please select a class from the dropdown to take attendance.' 
                : 'No students match your search.'}
            </CardContent>
          </Card>
        )}`;
content = content.replace(oldEmptyStateStr, newEmptyStateStr);


fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated StudentsPage.tsx');
