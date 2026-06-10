import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Save, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import Skeleton from '../ui/skeleton';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classSchedule: any;
}

export function AttendanceModal({ isOpen, onClose, classSchedule }: AttendanceModalProps) {
  const queryClient = useQueryClient();
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all students for this faculty, then we will filter by courseId
  const { data: allStudents = [], isLoading: isLoadingStudents } = useQuery<any[]>({
    queryKey: ['my-students'],
    queryFn: () => apiFetch('/faculty-assignments/my-students'),
    enabled: isOpen,
  });

  // Fetch existing attendance for this specific class
  const { data: existingAttendance, isLoading: isLoadingAttendance } = useQuery<any>({
    queryKey: ['attendance', classSchedule?.id],
    queryFn: () => apiFetch(`/attendance/class/${classSchedule?.id}`),
    enabled: isOpen && !!classSchedule?.id,
  });

  // Filter students for the specific course
  const classStudents = allStudents.filter((student) =>
    student.enrollments?.some((enr: any) => enr.course.id === classSchedule?.courseId)
  );

  // Initialize the attendance map
  useEffect(() => {
    if (!isOpen || isLoadingStudents || isLoadingAttendance) return;

    const initialMap: Record<string, 'PRESENT' | 'ABSENT'> = {};

    if (existingAttendance && existingAttendance.records) {
      // Load existing records
      existingAttendance.records.forEach((record: any) => {
        initialMap[record.studentId] = record.status;
      });
    } else {
      // Default to PRESENT for everyone if no attendance exists yet
      classStudents.forEach((student) => {
        initialMap[student.id] = 'PRESENT';
      });
    }

    setAttendanceMap(initialMap);
    setHasChanges(false);
  }, [isOpen, isLoadingStudents, isLoadingAttendance, existingAttendance, classStudents]);

  const saveAttendance = useMutation({
    mutationFn: (body: any) => apiFetch(`/attendance/class/${classSchedule.id}`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', classSchedule?.id] });
      setErrorMessage(null);
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save attendance.');
    },
  });

  const handleSave = () => {
    setErrorMessage(null);

    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    const setStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
      setAttendanceMap((prev) => {
        if (prev[studentId] === status) return prev;

        setHasChanges(true);

        return {
          ...prev,
          [studentId]: status,
        };
      });
    };

    const date = existingAttendance?.date ? existingAttendance.date : (classSchedule?.date || new Date().toISOString());

    saveAttendance.mutate({
      date,
      records,
    });
  };

  const setStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  if (!isOpen || !classSchedule) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Take Attendance - ${classSchedule.subject?.name || 'Class'}`}
    >
      <div className="space-y-4 max-h-[60vh] flex flex-col">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoadingStudents || isLoadingAttendance ? (
          <div className="overflow-y-auto pr-1 flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                <div className="flex flex-col space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : classStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No students enrolled in this course.</div>
        ) : (
          <div className="overflow-y-auto pr-1 flex-1 space-y-2">
            {classStudents.map((student) => {
              const currentStatus = attendanceMap[student.id];

              return (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{student.firstName} {student.lastName}</span>
                    <span className="text-xs text-gray-500">{student.email}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(student.id, 'PRESENT')}
                      className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${currentStatus === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                          : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${currentStatus === 'PRESENT' ? 'text-emerald-500' : 'text-gray-400'}`} />
                      Present
                    </button>

                    <button
                      onClick={() => setStatus(student.id, 'ABSENT')}
                      className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${currentStatus === 'ABSENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                          : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <X className={`w-3.5 h-3.5 ${currentStatus === 'ABSENT' ? 'text-rose-500' : 'text-gray-400'}`} />
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 mt-2 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saveAttendance.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges ||saveAttendance.isPending || isLoadingStudents || classStudents.length === 0}
            className="flex items-center gap-2"
          >
            {saveAttendance.isPending ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Attendance
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
