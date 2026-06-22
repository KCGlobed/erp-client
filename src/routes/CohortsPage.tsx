import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Edit2, Trash2, Users, GraduationCap, ChevronRight, BookOpen } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { DatePicker } from '../components/ui/DatePicker';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';

export function CohortsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Drawers and Modals visibility
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCohortDrawerOpen, setIsCohortDrawerOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<any>(null);

  // Link Course variables
  const [isLinkCourseModalOpen, setIsLinkCourseModalOpen] = useState(false);
  const [linkCourseForm, setLinkCourseForm] = useState({
    courseId: '',
    curriculumId: '',
  });

  // Assign Student/Faculty variables
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const [isAssignFacultyModalOpen, setIsAssignFacultyModalOpen] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<Set<string>>(new Set());

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form states for Cohort
  const [cohortForm, setCohortForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  const isAdmin = user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN');

  // Queries
  const { data: cohorts = [], isLoading } = useQuery<any[]>({
    queryKey: ['cohorts'],
    queryFn: () => apiFetch('/cohorts'),
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['courses'],
    queryFn: () => apiFetch('/courses'),
  });

  const { data: usersData } = useQuery<any>({
    queryKey: ['users'],
    queryFn: () => apiFetch('/users?limit=100'),
  });
  const allUsers = usersData?.data || [];

  // Mutations
  const createCohort = useMutation({
    mutationFn: (data: any) => apiFetch('/cohorts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      closeCohortDrawer();
    },
  });

  const updateCohort = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/cohorts/${editingCohort.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      closeCohortDrawer();
    },
  });

  const deleteCohort = useMutation({
    mutationFn: (id: string) => apiFetch(`/cohorts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      setConfirmDelete(null);
      setIsDetailDrawerOpen(false);
    },
  });

  const linkCourse = useMutation({
    mutationFn: (data: { cohortId: string; body: any }) =>
      apiFetch(`/cohorts/${data.cohortId}/courses`, {
        method: 'POST',
        body: JSON.stringify(data.body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      setIsLinkCourseModalOpen(false);
      if (selectedCohort) {
        apiFetch(`/cohorts/${selectedCohort.id}`).then((updatedCohort) => {
          setSelectedCohort(updatedCohort);
        });
      }
    },
  });

  const assignStudents = useMutation({
    mutationFn: (data: { cohortId: string; studentIds: string[] }) =>
      apiFetch(`/cohorts/${data.cohortId}/students`, {
        method: 'POST',
        body: JSON.stringify({ studentIds: data.studentIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      setIsAssignStudentModalOpen(false);
      if (selectedCohort) {
        apiFetch(`/cohorts/${selectedCohort.id}`).then((updatedCohort) => {
          setSelectedCohort(updatedCohort);
        });
      }
    },
  });

  const assignFaculty = useMutation({
    mutationFn: (data: { cohortId: string; facultyIds: string[] }) =>
      apiFetch(`/cohorts/${data.cohortId}/faculty`, {
        method: 'POST',
        body: JSON.stringify({ facultyIds: data.facultyIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      setIsAssignFacultyModalOpen(false);
      if (selectedCohort) {
        apiFetch(`/cohorts/${selectedCohort.id}`).then((updatedCohort) => {
          setSelectedCohort(updatedCohort);
        });
      }
    },
  });

  // Handlers
  const openCreateCohort = () => {
    setEditingCohort(null);
    setCohortForm({
      name: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
    });
    setIsCohortDrawerOpen(true);
  };

  const openEditCohort = (cohort: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCohort(cohort);
    setCohortForm({
      name: cohort.name,
      startDate: new Date(cohort.startDate).toISOString().split('T')[0],
      endDate: new Date(cohort.endDate).toISOString().split('T')[0],
      status: cohort.status,
    });
    setIsCohortDrawerOpen(true);
  };

  const closeCohortDrawer = () => {
    setIsCohortDrawerOpen(false);
    setEditingCohort(null);
  };

  const handleCohortSubmit = () => {
    const payload = {
      name: cohortForm.name,
      startDate: new Date(cohortForm.startDate).toISOString(),
      endDate: new Date(cohortForm.endDate).toISOString(),
      status: cohortForm.status,
    };
    if (editingCohort) {
      updateCohort.mutate(payload);
    } else {
      createCohort.mutate(payload);
    }
  };

  const openDetailDrawer = (cohort: any) => {
    setSelectedCohort(cohort);
    setIsDetailDrawerOpen(true);
  };

  const openLinkCourse = () => {
    setLinkCourseForm({ courseId: '', curriculumId: '' });
    setIsLinkCourseModalOpen(true);
  };

  const handleLinkCourseSubmit = () => {
    linkCourse.mutate({
      cohortId: selectedCohort.id,
      body: linkCourseForm,
    });
  };

  const openAssignStudents = () => {
    setSelectedStudentIds(new Set(selectedCohort.students?.map((s: any) => s.id) || []));
    setIsAssignStudentModalOpen(true);
  };

  const toggleStudentSelection = (studentId: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    setSelectedStudentIds(next);
  };

  const handleAssignStudentsSubmit = () => {
    assignStudents.mutate({
      cohortId: selectedCohort.id,
      studentIds: Array.from(selectedStudentIds),
    });
  };

  const openAssignFaculty = () => {
    setSelectedFacultyIds(new Set(selectedCohort.facultyCohorts?.map((fc: any) => fc.user?.id).filter(Boolean) || []));
    setIsAssignFacultyModalOpen(true);
  };

  const toggleFacultySelection = (facultyId: string) => {
    const next = new Set(selectedFacultyIds);
    if (next.has(facultyId)) next.delete(facultyId);
    else next.add(facultyId);
    setSelectedFacultyIds(next);
  };

  const handleAssignFacultySubmit = () => {
    assignFaculty.mutate({
      cohortId: selectedCohort.id,
      facultyIds: Array.from(selectedFacultyIds),
    });
  };

  // Filter lists
  const filteredCohorts = cohorts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableStudents = allUsers.filter((u: any) => u.roles?.includes('STUDENT'));
  const availableFaculty = allUsers.filter((u: any) => u.roles?.includes('FACULTY'));

  const selectedCourseDetails = courses.find((c) => c.id === linkCourseForm.courseId);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <span>Home</span><span className="mx-1">›</span>
            <span>Academics</span><span className="mx-1">›</span>
            <span className="text-gray-900 font-medium">Cohorts</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
            Academic Cohorts
          </h1>
          <p className="text-sm text-gray-500">
            Administer batch classes, assign curricula, register student enrollments, and assign faculty.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cohorts..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreateCohort} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Create Cohort
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm text-gray-500">Loading cohorts…</div>
      ) : filteredCohorts.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-500">No cohorts found matching "{search}"</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCohorts.map((cohort: any) => {
            const startStr = new Date(cohort.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endStr = new Date(cohort.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return (
              <Card
                key={cohort.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 group border border-gray-150 flex flex-col justify-between"
                onClick={() => openDetailDrawer(cohort)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {startStr} – {endStr}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${cohort.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cohort.status === 'PLANNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-250'
                        }`}
                    >
                      {cohort.status}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                    {cohort.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Linked courses matrices */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Assigned Curriculums</span>
                    {cohort.cohortCourses?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cohort.cohortCourses.map((cc: any) => (
                          <span key={cc.courseId} className="inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-700 font-semibold px-2 py-0.5 rounded border border-sky-100">
                            <BookOpen className="w-3 h-3" />
                            {cc.course.name} ({cc.curriculum.version})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 italic">No courses linked yet.</div>
                    )}
                  </div>
                  {/* Student and Faculty counts */}
                  <div className="flex gap-4 border-t border-gray-55 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span><strong>{cohort._count?.students || 0}</strong> Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span><strong>{cohort._count?.facultyCohorts || 0}</strong> Faculty</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50/50 border-t border-gray-100/50 py-3 rounded-b-xl">
                  <span className="text-xs font-medium text-gray-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Manage Enrollments <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={(e) => openEditCohort(cohort, e)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                        onClick={() => setConfirmDelete(cohort.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cohort Detail Drawer */}
      <Drawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedCohort?.name || ''}
        description="Configure academic programs, map student lists, and assign cohort faculty."
      >
        {selectedCohort && (
          <div className="space-y-6">
            {/* Courses / Curriculums linked */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Course & Curriculum Selection</span>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={openLinkCourse}>
                    Link Course
                  </Button>
                )}
              </div>
              {selectedCohort.cohortCourses?.length > 0 ? (
                <div className="space-y-2">
                  {selectedCohort.cohortCourses.map((cc: any) => (
                    <div key={cc.courseId} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-150 text-xs">
                      <span className="font-semibold text-gray-800">{cc.course.name} ({cc.course.code})</span>
                      <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{cc.curriculum.version}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No courses mapped to this cohort batch yet.</div>
              )}
            </div>

            {/* Students List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  Assigned Students ({selectedCohort.students?.length || 0})
                </h3>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="h-8" onClick={openAssignStudents}>
                    Assign Students
                  </Button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg bg-white p-2 divide-y divide-gray-50">
                {selectedCohort.students?.map((stu: any) => (
                  <div key={stu.id} className="py-2 px-3 flex items-center justify-between text-xs hover:bg-gray-50 rounded">
                    <div>
                      <span className="font-semibold text-gray-800">{stu.firstName} {stu.lastName}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{stu.email}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Enrolled</span>
                  </div>
                ))}
                {(!selectedCohort.students || selectedCohort.students.length === 0) && (
                  <div className="text-xs text-gray-400 italic text-center py-6">No students assigned to this cohort batch.</div>
                )}
              </div>
            </div>

            {/* Faculty List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  Assigned Instructors ({selectedCohort.facultyCohorts?.length || 0})
                </h3>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="h-8" onClick={openAssignFaculty}>
                    Assign Faculty
                  </Button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg bg-white p-2 divide-y divide-gray-50">
                {selectedCohort.facultyCohorts?.map((fc: any) => (
                  <div key={fc.user?.id} className="py-2 px-3 flex items-center justify-between text-xs hover:bg-gray-50 rounded">
                    <div>
                      <span className="font-semibold text-gray-800">{fc.user?.firstName} {fc.user?.lastName}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{fc.user?.email}</span>
                    </div>
                    <span className="text-[10px] text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">Instructor</span>
                  </div>
                ))}
                {(!selectedCohort.facultyCohorts || selectedCohort.facultyCohorts.length === 0) && (
                  <div className="text-xs text-gray-400 italic text-center py-6">No faculty assigned to this cohort batch.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Cohort Create/Edit Drawer */}
      <Drawer
        isOpen={isCohortDrawerOpen}
        onClose={closeCohortDrawer}
        title={editingCohort ? 'Update Cohort Profile' : 'Create Cohort Batch'}
        description="Configure cohort name, duration periods, and batch status."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Cohort Batch Name</label>
            <Input
              placeholder="e.g. MBA Batch 2026, Leadership Cohort"
              value={cohortForm.name}
              onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <DatePicker
              value={cohortForm.startDate}
              onChange={(val) => setCohortForm({ ...cohortForm, startDate: val })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <DatePicker
              value={cohortForm.endDate}
              onChange={(val) => setCohortForm({ ...cohortForm, endDate: val })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              className="w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
              value={cohortForm.status}
              onChange={(e) => setCohortForm({ ...cohortForm, status: e.target.value })}
            >
              <option value="PLANNING">PLANNING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeCohortDrawer}>Cancel</Button>
            <Button onClick={handleCohortSubmit} disabled={createCohort.isPending || updateCohort.isPending}>
              {createCohort.isPending || updateCohort.isPending ? 'Saving...' : 'Save Cohort'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Link Course Curriculum Modal */}
      <Modal
        isOpen={isLinkCourseModalOpen}
        onClose={() => setIsLinkCourseModalOpen(false)}
        title="Link Course & Curriculum version"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Academic Course</label>
            <select
              className="w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
              value={linkCourseForm.courseId}
              onChange={(e) => setLinkCourseForm({ ...linkCourseForm, courseId: e.target.value, curriculumId: '' })}
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          {selectedCourseDetails && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Curriculum version</label>
              <select
                className="w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
                value={linkCourseForm.curriculumId}
                onChange={(e) => setLinkCourseForm({ ...linkCourseForm, curriculumId: e.target.value })}
              >
                <option value="">-- Choose Curriculum version --</option>
                {selectedCourseDetails.curriculums?.map((curr: any) => (
                  <option key={curr.id} value={curr.id}>{curr.version}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLinkCourseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkCourseSubmit} disabled={linkCourse.isPending || !linkCourseForm.courseId || !linkCourseForm.curriculumId}>
              {linkCourse.isPending ? 'Linking...' : 'Link Course'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Students Modal */}
      <Modal
        isOpen={isAssignStudentModalOpen}
        onClose={() => setIsAssignStudentModalOpen(false)}
        title="Assign Students to Cohort"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Select students to enroll in this cohort. Assigned students will automatically be enrolled in all the cohort's linked courses.
          </p>
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md p-3 divide-y divide-gray-50 space-y-2">
            {availableStudents.map((stu: any) => (
              <label key={stu.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-2 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--ring)]"
                  checked={selectedStudentIds.has(stu.id)}
                  onChange={() => toggleStudentSelection(stu.id)}
                />
                <div className="text-xs flex-1">
                  <span className="font-semibold block text-gray-800">{stu.firstName} {stu.lastName}</span>
                  <span className="text-[10px] text-gray-400">{stu.email}</span>
                </div>
              </label>
            ))}
            {availableStudents.length === 0 && (
              <div className="text-xs text-gray-400 italic text-center py-6">No users found with STUDENT role.</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAssignStudentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignStudentsSubmit} disabled={assignStudents.isPending}>
              {assignStudents.isPending ? 'Assigning...' : 'Assign Students'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Faculty Modal */}
      <Modal
        isOpen={isAssignFacultyModalOpen}
        onClose={() => setIsAssignFacultyModalOpen(false)}
        title="Assign Cohort Instructors"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Select faculty members assigned to teach in this cohort.
          </p>
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md p-3 divide-y divide-gray-50 space-y-2">
            {availableFaculty.map((fac: any) => (
              <label key={fac.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-2 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--ring)]"
                  checked={selectedFacultyIds.has(fac.id)}
                  onChange={() => toggleFacultySelection(fac.id)}
                />
                <div className="text-xs flex-1">
                  <span className="font-semibold block text-gray-800">{fac.firstName} {fac.lastName}</span>
                  <span className="text-[10px] text-gray-400">{fac.email}</span>
                </div>
              </label>
            ))}
            {availableFaculty.length === 0 && (
              <div className="text-xs text-gray-400 italic text-center py-6">No users found with FACULTY role.</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAssignFacultyModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignFacultySubmit} disabled={assignFaculty.isPending}>
              {assignFaculty.isPending ? 'Assigning...' : 'Assign Instructors'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Cohort Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Cohort Batch"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this cohort? All student relationships, faculty cohort assignments, schedules, and calendared slots will be deleted. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteCohort.mutate(confirmDelete)}
              disabled={deleteCohort.isPending}
            >
              {deleteCohort.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
