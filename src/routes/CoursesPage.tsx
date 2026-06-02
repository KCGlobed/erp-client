import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Clock, Calendar, Edit2, Trash2, ChevronRight, Award } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

export function CoursesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Course Details/Edit Modal states
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCourseDrawerOpen, setIsCourseDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Subject Creator states
  const [isSubjectDrawerOpen, setIsSubjectDrawerOpen] = useState(false);
  const [targetTrimester, setTargetTrimester] = useState<number>(1);
  const [targetCurriculumId, setTargetCurriculumId] = useState<string>('');

  // Delete Course states
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Curriculum Version states
  const [isNewCurriculumModalOpen, setIsNewCurriculumModalOpen] = useState(false);
  const [newCurriculumVersion, setNewCurriculumVersion] = useState('');
  const [selectedCurriculumIndex, setSelectedCurriculumIndex] = useState<number>(0);

  // Form states for Course
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    duration: '2 years',
    numTrimesters: 3,
  });

  // Form states for Subject
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    credits: 4,
    learningOutcomes: '',
    modulesText: '', // raw newline separated module names
    sessionsText: '', // raw newline separated week details
  });

  const isAdmin = user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN');

  // Queries
  const { data: courses = [], isLoading } = useQuery<any[]>({
    queryKey: ['courses'],
    queryFn: () => apiFetch('/courses'),
  });

  // Mutations
  const createCourse = useMutation({
    mutationFn: (data: any) => apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeCourseDrawer();
    },
  });

  const updateCourse = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/courses/${editingCourse.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeCourseDrawer();
    },
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => apiFetch(`/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setConfirmDelete(null);
      setIsDetailDrawerOpen(false);
    },
  });

  const createCurriculum = useMutation({
    mutationFn: (data: { courseId: string; version: string }) =>
      apiFetch(`/courses/${data.courseId}/curriculums`, {
        method: 'POST',
        body: JSON.stringify({ version: data.version }),
      }),
    onSuccess: (newCurriculum) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsNewCurriculumModalOpen(false);
      setNewCurriculumVersion('');
      // Auto select the new curriculum
      if (selectedCourse) {
        const updatedCourse = {
          ...selectedCourse,
          curriculums: [newCurriculum, ...selectedCourse.curriculums],
        };
        setSelectedCourse(updatedCourse);
        setSelectedCurriculumIndex(0);
      }
    },
  });

  const createSubject = useMutation({
    mutationFn: (data: { curriculumId: string; body: any }) =>
      apiFetch(`/courses/curriculums/${data.curriculumId}/subjects`, {
        method: 'POST',
        body: JSON.stringify(data.body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsSubjectDrawerOpen(false);
      // Reload the selected course to reflect changes
      if (selectedCourse) {
        apiFetch(`/courses/${selectedCourse.id}`).then((updatedCourse) => {
          setSelectedCourse(updatedCourse);
        });
      }
      resetSubjectForm();
    },
  });

  // Course handlers
  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      name: '',
      code: '',
      description: '',
      duration: '2 years',
      numTrimesters: 3,
    });
    setIsCourseDrawerOpen(true);
  };

  const openEditCourse = (course: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      description: course.description || '',
      duration: course.duration,
      numTrimesters: course.numTrimesters,
    });
    setIsCourseDrawerOpen(true);
  };

  const closeCourseDrawer = () => {
    setIsCourseDrawerOpen(false);
    setEditingCourse(null);
  };

  const handleCourseSubmit = () => {
    if (editingCourse) {
      updateCourse.mutate(courseForm);
    } else {
      createCourse.mutate(courseForm);
    }
  };

  const openDetailDrawer = (course: any) => {
    setSelectedCourse(course);
    setSelectedCurriculumIndex(0);
    setIsDetailDrawerOpen(true);
  };

  const handleAddCurriculum = () => {
    if (!newCurriculumVersion.trim()) return;
    createCurriculum.mutate({
      courseId: selectedCourse.id,
      version: newCurriculumVersion.trim(),
    });
  };

  // Subject handlers
  const openAddSubject = (trimesterNum: number, curriculumId: string) => {
    setTargetTrimester(trimesterNum);
    setTargetCurriculumId(curriculumId);
    setIsSubjectDrawerOpen(true);
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: '',
      code: '',
      credits: 4,
      learningOutcomes: '',
      modulesText: '',
      sessionsText: '',
    });
  };

  const handleSubjectSubmit = () => {
    // Parse modules and sessions text
    const modules = subjectForm.modulesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    const sessionPlans = subjectForm.sessionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        week: idx + 1,
        title,
      }));

    createSubject.mutate({
      curriculumId: targetCurriculumId,
      body: {
        name: subjectForm.name,
        code: subjectForm.code,
        trimester: targetTrimester,
        credits: subjectForm.credits,
        learningOutcomes: subjectForm.learningOutcomes,
        modules,
        sessionPlans,
      },
    });
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const activeCurriculum = selectedCourse?.curriculums?.[selectedCurriculumIndex];
  const trimestersArray = selectedCourse
    ? Array.from({ length: selectedCourse.numTrimesters }, (_, i) => i + 1)
    : [];

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <span>Home</span><span className="mx-1">›</span>
            <span>Academics</span><span className="mx-1">›</span>
            <span className="text-gray-900 font-medium">Courses</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
            Academic Courses
          </h1>
          <p className="text-sm text-gray-500">
            Manage course profiles, curriculum versions, trimesters, and subject outlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreateCourse} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm text-gray-500">Loading courses…</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-500">No courses found matching "{search}"</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => {
            const latestVersion = course.curriculums?.[0]?.version || 'None';
            return (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 group relative border border-gray-100 flex flex-col justify-between"
                onClick={() => openDetailDrawer(course)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-semibold">
                      {course.code}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        course.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                    {course.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {course.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {course.numTrimesters} trimesters
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-50">
                    <span className="text-gray-400">Latest Curriculum:</span>
                    <span className="font-medium text-gray-700">{latestVersion}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50/50 rounded-b-xl border-t border-gray-100/50 py-3">
                  <span className="text-xs font-medium text-gray-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Manage Curriculum <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={(e) => openEditCourse(course, e)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                        onClick={() => setConfirmDelete(course.id)}
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

      {/* Course Detail / Curriculum Viewer Drawer */}
      <Drawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : ''}
        description="Browse versioned curriculums, trimester schedules, subjects, and session plans."
      >
        {selectedCourse && (
          <div className="space-y-6">
            {/* Curriculum Version Selector */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Active Curriculum Version</span>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setIsNewCurriculumModalOpen(true)}>
                    Add Version
                  </Button>
                )}
              </div>
              {selectedCourse.curriculums?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.curriculums.map((curr: any, idx: number) => (
                    <button
                      key={curr.id}
                      onClick={() => setSelectedCurriculumIndex(idx)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        selectedCurriculumIndex === idx
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {curr.version} {curr.isActive && '●'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 py-2">No curriculum versions configured yet.</div>
              )}
            </div>

            {/* Trimester outline tabs */}
            {activeCurriculum ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Curriculum Trimester Syllabus</h3>
                <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm space-y-4">
                  {trimestersArray.map((trimesterNum) => {
                    const subjects =
                      activeCurriculum.subjects?.filter((s: any) => s.trimester === trimesterNum) || [];
                    return (
                      <div key={trimesterNum} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-800">Trimester {trimesterNum}</h4>
                          {isAdmin && (
                            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => openAddSubject(trimesterNum, activeCurriculum.id)}>
                              <Plus className="w-3.5 h-3.5" /> Add Subject
                            </Button>
                          )}
                        </div>
                        {subjects.length === 0 ? (
                          <div className="text-xs text-gray-400 italic py-2 pl-4">No subjects added to Trimester {trimesterNum} yet.</div>
                        ) : (
                          <div className="space-y-3 pl-4">
                            {subjects.map((sub: any) => (
                              <div key={sub.id} className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-mono font-bold text-gray-400">{sub.code}</span>
                                    <h5 className="text-xs font-semibold text-gray-800">{sub.name}</h5>
                                  </div>
                                  <span className="flex items-center gap-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                                    <Award className="w-3 h-3" /> {sub.credits} Credits
                                  </span>
                                </div>
                                {sub.learningOutcomes && (
                                  <p className="text-[11px] text-gray-500">
                                    <strong>Learning Outcomes:</strong> {sub.learningOutcomes}
                                  </p>
                                )}
                                {/* Modules and Weekly plan accordion lists */}
                                {sub.modules?.length > 0 && (
                                  <div className="pt-1.5 border-t border-gray-100/50">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Modules ({sub.modules.length})</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {sub.modules.map((m: any) => (
                                        <span key={m.id} className="text-[10px] bg-white border border-gray-150 rounded px-2 py-0.5 text-gray-600">
                                          {m.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {sub.sessionPlans?.length > 0 && (
                                  <div className="pt-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Session Plans</span>
                                    <div className="mt-1 space-y-1">
                                      {sub.sessionPlans.map((sp: any) => (
                                        <div key={sp.id} className="text-[10px] text-gray-500 flex items-start gap-1">
                                          <span className="font-bold text-gray-700">W{sp.week}:</span>
                                          <span>{sp.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Please add or select a curriculum version to view subjects list.
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Course Create/Edit Drawer */}
      <Drawer
        isOpen={isCourseDrawerOpen}
        onClose={closeCourseDrawer}
        title={editingCourse ? 'Update Course Profile' : 'Create Course Profile'}
        description="Set course details, trimester capacities, and status."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course Name</label>
            <Input
              placeholder="e.g. Master of Business Administration"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course Code</label>
            <Input
              placeholder="e.g. MBA-100"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Duration Description</label>
            <Input
              placeholder="e.g. 2 years, 6 months"
              value={courseForm.duration}
              onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Number of Trimesters</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={courseForm.numTrimesters}
              onChange={(e) => setCourseForm({ ...courseForm, numTrimesters: parseInt(e.target.value) || 3 })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input
              placeholder="Brief course summary"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeCourseDrawer}>Cancel</Button>
            <Button onClick={handleCourseSubmit} disabled={createCourse.isPending || updateCourse.isPending}>
              {createCourse.isPending || updateCourse.isPending ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Add Curriculum Version Modal */}
      <Modal
        isOpen={isNewCurriculumModalOpen}
        onClose={() => setIsNewCurriculumModalOpen(false)}
        title="Add Curriculum Version"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Define a new curriculum version for {selectedCourse?.name}. Trimester subjects will be version controlled under this label.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Version Label</label>
            <Input
              placeholder="e.g. v2026, v1.0"
              value={newCurriculumVersion}
              onChange={(e) => setNewCurriculumVersion(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNewCurriculumModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCurriculum} disabled={createCurriculum.isPending || !newCurriculumVersion.trim()}>
              {createCurriculum.isPending ? 'Adding...' : 'Add Version'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subject Creator Drawer */}
      <Drawer
        isOpen={isSubjectDrawerOpen}
        onClose={() => setIsSubjectDrawerOpen(false)}
        title={`Add Subject to Trimester ${targetTrimester}`}
        description="Define subject codes, credit weight, learning outcomes, and structure."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject Name</label>
            <Input
              placeholder="e.g. Corporate Finance"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject Code</label>
            <Input
              placeholder="e.g. FIN201"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Credits</label>
            <Input
              type="number"
              min={1}
              value={subjectForm.credits}
              onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 4 })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Learning Outcomes</label>
            <Input
              placeholder="Outcomes statement..."
              value={subjectForm.learningOutcomes}
              onChange={(e) => setSubjectForm({ ...subjectForm, learningOutcomes: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Modules (One per line)</label>
            <textarea
              className="w-full min-h-[80px] p-2.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
              placeholder="e.g. Module 1: Capital Budgeting&#10;Module 2: Equity & Debt"
              value={subjectForm.modulesText}
              onChange={(e) => setSubjectForm({ ...subjectForm, modulesText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Weekly Session Plans (One per line)</label>
            <textarea
              className="w-full min-h-[80px] p-2.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
              placeholder="e.g. Introduction to Financing&#10;Analyzing Cash Flows"
              value={subjectForm.sessionsText}
              onChange={(e) => setSubjectForm({ ...subjectForm, sessionsText: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsSubjectDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSubjectSubmit} disabled={createSubject.isPending || !subjectForm.name || !subjectForm.code}>
              {createSubject.isPending ? 'Saving...' : 'Add Subject'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Course Profile"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this course profile? This will delete all curriculums, trimesters, and subjects linked to it. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteCourse.mutate(confirmDelete)}
              disabled={deleteCourse.isPending}
            >
              {deleteCourse.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
