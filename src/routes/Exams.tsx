import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Skeleton from '../components/ui/skeleton';

export function Exams() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // const canViewExam =
    //     user?.roles.includes('SUPER_ADMIN') ||
    //     user?.roles.includes('ADMIN') ||
    //     user?.roles.includes('FACULTY');

    const [isExamsDrawerOpen, setIsExamsDrawerOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<any>(null);

    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [examCategory, setExamCategory] = useState('');
    const [excelFile, setExcelFile] = useState<File | null>(null);

    // Form states for Exam
    const [examForm, setExamForm] = useState({
        name: '',
        date: '',
        marks: '',
        no_of_questions: '',
        type: '',
        course: '',
        duration: '',
        startDate: '',
        endDate: '',
    });

    const resetExamForm = () => {
        setExamForm({
            name: '',
            date: '',
            marks: '',
            no_of_questions: '',
            type: '',
            course: '',
            duration: '',
            startDate: '',
            endDate: '',
        });
    };

    const isAdmin = user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN') || user?.roles.includes('FACULTY');

    // Get tasks
    const { data: exams = [], isLoading } = useQuery<any[]>({
        queryKey: ['exams'],
        queryFn: () => apiFetch('/calendar/exams'),
    });

    // const { data: cohorts = [] } = useQuery<any[]>({
    //     queryKey: ['cohorts'],
    //     queryFn: () => apiFetch('/cohorts'),
    // });

    // Mutations
    const createExams = useMutation({
        mutationFn: (data: any) => apiFetch('/calendar/exams', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            closeExamsDrawer();
            resetExamForm();
        },
    });

    const updateExams = useMutation({
        mutationFn: (data: any) =>
            apiFetch(`/calendar/exams/${editingExam.id}`, { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            closeExamsDrawer();
        },
    });

    const deleteExams = useMutation({
        mutationFn: (id: string) => apiFetch(`/calendar/exams/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            setConfirmDelete(null);
            // setIsDetailDrawerOpen(false);
        },
    });

    //   const createSubject = useMutation({
    //     mutationFn: (data: { curriculumId: string; body: any }) =>
    //       apiFetch(`/events/curriculums/${data.curriculumId}/subjects`, {
    //         method: 'POST',
    //         body: JSON.stringify(data.body),
    //       }),
    //     onSuccess: () => {
    //       queryClient.invalidateQueries({ queryKey: ['events'] });
    //       setIsSubjectDrawerOpen(false);
    //       if (selectedEvent) {
    //         apiFetch(`/events/${selectedEvent.id}`).then((updatedEvent) => {
    //           setSelectedEvent(updatedEvent);
    //         });
    //       }
    //       resetSubjectForm();
    //     },
    //   });

    // Exam handlers
    const openCreateExams = () => {
        setEditingExam(null);
        setExamForm({
            name: '',
            date: '',
            marks: '',
            no_of_questions: '',
            type: '',
            course: '',
            duration: '',
            startDate: '',
            endDate: '',
        });
        setIsExamsDrawerOpen(true);
    };

    const openEditExams = (exam: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingExam(exam);
        // setExamForm({
        //     name: exams.name || '',
        //     date: exams.date || '',
        //     marks: exams.marks || '',
        //     no_of_questions: exams.no_of_questions || '',
        //     type: exams.type || '',
        //     course: exams.course || '',
        //     duration: exams.duration || '',
        //     startDate: exams.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
        //     endDate: exams.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
        // });
        console.log(exam)
        setIsExamsDrawerOpen(true);
    };

    const closeExamsDrawer = () => {
        setIsExamsDrawerOpen(false);
        setEditingExam(null);
    };

    const handleExamsSubmit = () => {
        if (editingExam) {
            updateExams.mutate(examForm);
        } else {
            createExams.mutate(examForm);
        }
    };

    const filteredExams = exams.filter(
        (exam) =>
            exam.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                <div className="space-y-2">
                    <nav className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Home</span><span className="mx-1">›</span>
                        <span>Academics</span><span className="mx-1">›</span>
                        <span className="text-gray-900 font-medium">Exams</span>
                    </nav>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
                        Academic Exams
                    </h1>
                    {/* <p className="text-sm text-gray-500">
                        Manage exams profiles, curriculum versions, trimesters, and subject outlines.
                    </p> */}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search exams..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <Button onClick={openCreateExams} className="gap-2 shrink-0">
                            <Plus className="w-4 h-4" />
                            Create Exam
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card
                            key={i}
                            className="border border-gray-100 flex flex-col justify-between h-[250px]"
                        >
                            <CardHeader className="pb-4 flex-1 space-y-3">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-5 w-16 rounded" />
                                    <Skeleton className="h-5 w-14 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-3/4 rounded mt-2" />
                                <div className="space-y-1.5 mt-2">
                                    <Skeleton className="h-4 w-full rounded" />
                                    <Skeleton className="h-4 w-5/6 rounded" />
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4 space-y-3">
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-12 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <Skeleton className="h-3.5 w-24 rounded" />
                                    <Skeleton className="h-3.5 w-8 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="text-center py-20 text-sm text-gray-500">No exams found matching "{search}"</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam: any) => {
                        // const latestVersion = event.curriculums?.[0]?.version || 'None';
                        return (
                            <Card
                                key={exam.id}
                                className="cursor-pointer hover:shadow-md transition-all duration-200 group relative border border-gray-100 flex flex-col justify-between"
                            // onClick={() => openDetailDrawer(exam)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-700">{exam.type}</span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isActive === true
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                        >
                                            {exam.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 text-lg text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                                        {exam.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {exam.description || 'No description provided.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(exam.startDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(exam.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end items-center bg-gray-50/50 rounded-b-xl border-t border-gray-100/50 py-3">
                                    {isAdmin && (
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gray-500"
                                                onClick={(e) => openEditExams(exam, e)}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                                                onClick={() => setConfirmDelete(exam.id)}
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


            <Drawer
                isOpen={isExamsDrawerOpen}
                onClose={closeExamsDrawer}
                title={editingExam ? 'Update Exam Profile' : 'Create Exam Profile'}
                description="Set exam details, start date and end date.">

                <div className="space-y-4">
                    {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-150 mb-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-gray-700">Exam Status</span>
                            <span className="text-[10px] text-gray-500">
                                Set whether this exam is active and visible
                            </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={examForm.isActive}
                                onChange={(e) => setExamForm({ ...examForm, isActive: e.target.checked })}
                            />
                            <div
                                className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                                style={{ backgroundColor: examForm.isActive ? 'var(--primary)' : '#e5e5e5' }}
                            />
                            <span className="ml-2.5 text-xs font-medium text-gray-700 min-w-[50px]">
                                {examForm.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </label>
                    </div> */}
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Exam Title</label>
                        <Input
                            placeholder="e.g. ACCA"
                            value={examForm.name}
                            onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Course</label>
                        <Input
                            placeholder="e.g. MBA"
                            value={examForm.course}
                            onChange={(e) => setExamForm({ ...examForm, course: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Marks</label>
                        <Input
                            placeholder="e.g. 79"
                            value={examForm.marks}
                            onChange={(e) => setExamForm({ ...examForm, marks: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Number of Questions</label>
                        <Input
                            placeholder="e.g. 60"
                            value={examForm.name}
                            onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Duration</label>
                        <Input
                            // type='number'
                            placeholder="e.g. 90 mins"
                            value={examForm.duration}
                            onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Exam Date</label>
                        <Input
                            type='date'
                            value={examForm.date}
                            onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700">Start Date</label>
                            <Input
                                type="date"
                                value={examForm.startDate}
                                onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700">End Date</label>
                            <Input
                                type="date"
                                value={examForm.endDate}
                                onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-700">
                            Question Type
                        </label>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={examCategory === 'MCQS'}
                                    onChange={() =>
                                        setExamCategory(
                                            examCategory === 'MCQS' ? '' : 'MCQS'
                                        )
                                    }
                                />
                                <span>MCQs</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={examCategory === 'WRITTEN'}
                                    onChange={() =>
                                        setExamCategory(
                                            examCategory === 'WRITTEN' ? '' : 'WRITTEN'
                                        )
                                    }
                                />
                                <span>Written</span>
                            </label>
                        </div>
                    </div>

                    {examCategory === 'MCQS' && (
                        <>
                            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                                <label className="text-xs font-semibold text-gray-700">
                                    Upload Questions Excel File
                                </label>

                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) =>
                                        setExcelFile(e.target.files?.[0] || null)
                                    }
                                    className="w-full text-sm"
                                />

                                {excelFile && (
                                    <p className="text-xs text-green-600">
                                        Selected: {excelFile.name}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = '/sample_excel_file.xlsx';
                                        link.download = 'sample_excel_file.xlsx';
                                        link.click();
                                    }}
                                >
                                    Download Sample
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Target filters */}
                    {/* <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-150">
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
                                                checked={examForm.visibleToRoles.includes(role)}
                                                onChange={() => {
                                                    const next = [...examForm.visibleToRoles];
                                                    const idx = next.indexOf(role);
                                                    if (idx > -1) next.splice(idx, 1);
                                                    else next.push(role);
                                                    setExamForm({ ...examForm, visibleToRoles: next });
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
                                                checked={examForm.cohortIds.includes(c.id)}
                                                onChange={() => {
                                                    const next = [...examForm.cohortIds];
                                                    const idx = next.indexOf(c.id);
                                                    if (idx > -1) next.splice(idx, 1);
                                                    else next.push(c.id);
                                                    setExamForm({ ...examForm, cohortIds: next });
                                                }}
                                            />
                                            <span className="text-[11px] text-gray-750">{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div> */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={closeExamsDrawer}>Cancel</Button>
                        <Button onClick={handleExamsSubmit} disabled={createExams.isPending || updateExams.isPending}>
                            {createExams.isPending || updateExams.isPending ? 'Saving...' : 'Save Exam'}
                        </Button>
                    </div>
                </div>
            </Drawer>


            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Delete Exam Profile"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Are you sure you want to delete this exam profile? This will delete the exam completely. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => confirmDelete && deleteExams.mutate(confirmDelete)}
                            disabled={deleteExams.isPending}
                        >
                            {deleteExams.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
