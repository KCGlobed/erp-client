import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MoreHorizontal,
  BookOpen,
  X,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Users,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { StudentCard } from '../components/ui/StudentCard';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/Card';
import { CalendarIcon } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';

interface UserRoleTabsProps {
  activeTab: 'all' | 'student' | 'faculty';
  onChange: (tab: 'all' | 'student' | 'faculty') => void;
}

export function UserRoleTabs({ activeTab, onChange }: UserRoleTabsProps) {
  const tabs = [
    { id: 'all', label: 'All Users', icon: <Users className="w-4 h-4" /> },
    { id: 'student', label: 'Students', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'faculty', label: 'Faculty', icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onChange={(id) => onChange(id as 'all' | 'student' | 'faculty')}
    />
  );
}


// Mock enrichment data structures to align both pages perfectly
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

export function UsersPage() {
  const [page] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'courses' | 'students'>('details');
  const [activeRoleTab, setActiveRoleTab] = useState<'all' | 'student' | 'faculty'>('all');

  // Custom confirm popup state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'delete';
    title: string;
    message: string;
    data?: any;
  } | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ADMIN');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => apiFetch(`/users?page=${page}&limit=10`),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiFetch('/permissions'),
    enabled: isSuperAdmin,
  });

  const { data: userDirectPermsData } = useQuery({
    queryKey: ['user-permissions', editingUser?.id],
    queryFn: () => apiFetch(`/users/${editingUser.id}/permissions`),
    enabled: !!editingUser?.id && isSuperAdmin,
  });

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
  });
  const [formError, setFormError] = useState('');

  const createUserMutation = useMutation({
    mutationFn: (newUser: any) => apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(newUser),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDrawerOpen(false);
      setFormData({ email: '', firstName: '', lastName: '', role: 'STUDENT' });
      setFormError('');
    },
    onError: (error: any) => {
      setFormError(error.message || 'Failed to create user');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...rest }: any) => apiFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(rest),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDrawerOpen(false);
      setEditingUser(null);
      setFormData({ email: '', firstName: '', lastName: '', role: 'STUDENT' });
      setFormError('');
    },
    onError: (error: any) => {
      setFormError(error.message || 'Failed to update user');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to delete user');
    }
  });

  const grantPermMutation = useMutation({
    mutationFn: ({ userId, permissionId }: any) => apiFetch(`/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionId }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-permissions', editingUser?.id] }),
  });

  const revokePermMutation = useMutation({
    mutationFn: ({ userId, permissionId }: any) => apiFetch(`/users/${userId}/permissions/${permissionId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-permissions', editingUser?.id] }),
  });

  // ── Faculty Course Assignment queries ───────────────────────────────────
  const editingUserIsFaculty = editingUser?.roles?.includes('FACULTY');

  const { data: allCoursesData } = useQuery({
    queryKey: ['all-courses-for-assignment'],
    queryFn: () => apiFetch('/courses'),
    enabled: !!editingUser && editingUserIsFaculty && (isSuperAdmin || isAdmin),
  });

  const { data: facultyCoursesData, refetch: refetchFacultyCourses } = useQuery({
    queryKey: ['faculty-courses', editingUser?.id],
    queryFn: () => apiFetch(`/faculty-assignments/${editingUser.id}/courses`),
    enabled: !!editingUser?.id && editingUserIsFaculty && (isSuperAdmin || isAdmin),
  });

  const { data: facultyStudentsData } = useQuery({
    queryKey: ['faculty-students', editingUser?.id],
    queryFn: () => apiFetch(`/faculty-assignments/${editingUser.id}/students`),
    enabled: !!editingUser?.id && editingUserIsFaculty && (isSuperAdmin || isAdmin),
  });

  // Local state for searching/filtering students in the tab
  const [studentSearch, setStudentSearch] = useState('');

  // --- Attendance States for Faculty Drawer Students Tab ---
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  // const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  // const [pickerMonth, setPickerMonth] = useState(new Date());

  // History Calendar Modal state
  const [historyModalStudent, setHistoryModalStudent] = useState<any | null>(null);
  const [_currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  // Formatting utility for selectedDate button label
  /*
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

  const pickerDays = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [pickerMonth]);

  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
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
  */

  // Mock enrichment logic to match the main page exactly
  const enrichedStudentsList = useMemo(() => {
    const list = facultyStudentsData?.data || [];
    return list.map((s: any, idx: number) => {
      const pIdx = idx % MOCK_PROGRAMS.length;
      const phoneIdx = idx % MOCK_PHONES.length;
      const cityIdx = idx % MOCK_CITIES.length;
      const guardianIdx = idx % MOCK_GUARDIANS.length;
      const statusIdx = idx % MOCK_STATUSES.length;

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
  }, [facultyStudentsData]);

  // Seeding local mock history
  useMemo(() => {
    if (enrichedStudentsList.length > 0 && Object.keys(attendance).length === 0) {
      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      const today = new Date();
      enrichedStudentsList.forEach((student: any) => {
        for (let d = 0; d < 30; d++) {
          const date = new Date();
          date.setDate(today.getDate() - d);
          const dateStr = date.toISOString().split('T')[0];
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          initial[`${student.id}_${dateStr}`] = Math.random() > 0.15 ? 'PRESENT' : 'ABSENT';
        }
      });
      setAttendance(initial);
    }
  }, [enrichedStudentsList]);

  // Handle single attendance toggle
  const markAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    const key = `${studentId}_${selectedDate}`;
    setAttendance(prev => ({
      ...prev,
      [key]: prev[key] === status ? undefined : status as any
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setAttendance(prev => {
      const updated = { ...prev };
      enrichedStudentsList.forEach((student: any) => {
        updated[`${student.id}_${selectedDate}`] = 'PRESENT';
      });
      return updated;
    });
  };

  // Stats
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    enrichedStudentsList.forEach((s: any) => {
      const status = attendance[`${s.id}_${selectedDate}`];
      if (status === 'PRESENT') presentCount++;
      if (status === 'ABSENT') absentCount++;
    });
    return { presentCount, absentCount };
  }, [enrichedStudentsList, attendance, selectedDate]);

  const assignCourseMutation = useMutation({
    mutationFn: ({ userId, courseId }: any) =>
      apiFetch('/faculty-assignments', {
        method: 'POST',
        body: JSON.stringify({ userId, courseId }),
      }),
    onSuccess: () => refetchFacultyCourses(),
    onError: (err: any) => alert(err.message || 'Failed to assign course'),
  });

  const unassignCourseMutation = useMutation({
    mutationFn: ({ userId, courseId }: any) =>
      apiFetch('/faculty-assignments', {
        method: 'DELETE',
        body: JSON.stringify({ userId, courseId }),
      }),
    onSuccess: () => refetchFacultyCourses(),
    onError: (err: any) => alert(err.message || 'Failed to unassign course'),
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (editingUser) {
      setConfirmModal({
        isOpen: true,
        type: 'save',
        title: 'Save Changes',
        message: `Are you sure you want to save changes to ${editingUser.firstName} ${editingUser.lastName}?`,
        data: { id: editingUser.id, ...formData },
      });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const toggleDirectPermission = (permId: string, hasIt: boolean) => {
    if (!editingUser) return;
    if (hasIt) {
      revokePermMutation.mutate({ userId: editingUser.id, permissionId: permId });
    } else {
      grantPermMutation.mutate({ userId: editingUser.id, permissionId: permId });
    }
  };

  const allowedRolesToCreate = isSuperAdmin
    ? ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']
    : ['FACULTY', 'STUDENT'];

  const allUsers: any[] = data?.data || [];
  const filtered = allUsers.filter(u => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = activeRoleTab === 'all'
      ? true
      : activeRoleTab === 'student'
        ? u.roles?.includes('STUDENT')
        : u.roles?.includes('FACULTY');
    return matchesSearch && matchesRole;
  });

  const permissions = permissionsData?.data || [];
  const userDirectPerms = new Set(userDirectPermsData?.data?.map((p: any) => p.id) || []);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span>Home</span><span className="mx-1">›</span>
            <span>System</span><span className="mx-1">›</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Users</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Users
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Manage system users, roles, and access control.
          </p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <div className="flex items-center gap-2">
            <Button onClick={() => {
              setEditingUser(null);
              setActiveTab('details');
              setFormData({ email: '', firstName: '', lastName: '', role: 'STUDENT' });
              setFormError('');
              setIsDrawerOpen(true);
            }} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4" style={{ borderBottom: '1px solid var(--border)' }}>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md text-sm outline-none transition-colors"
              style={{ backgroundColor: 'var(--muted)', border: '1px solid transparent', color: 'var(--foreground)' }}
            />
          </div>
          <UserRoleTabs activeTab={activeRoleTab} onChange={setActiveRoleTab} />
        </div>

        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'oklch(0.97 0.01 330 / 0.4)' }}>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: 60 }} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading users…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--muted-foreground)' }}>No users found.</TableCell>
              </TableRow>
            ) : filtered.map((u: any, index: number) => (
              <TableRow key={u.id} className="hover:bg-accent/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}>
                      {`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{u.firstName} {u.lastName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{u.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles?.map((r: string) => (
                      <span key={r} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium" style={{ border: '1px solid oklch(0.36 0.18 330 / 0.3)', color: 'var(--primary)', backgroundColor: 'oklch(0.36 0.18 330 / 0.05)' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium" style={{ border: '1px solid oklch(0.36 0.18 330 / 0.3)', color: 'var(--primary)', backgroundColor: 'oklch(0.36 0.18 330 / 0.05)' }}>
                    Active
                  </span>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <Button variant="ghost" size="icon" onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)} className="cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {activeMenuUserId === u.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setActiveMenuUserId(null)} />
                        <div className={cn("absolute right-0 w-32 rounded-md shadow-lg z-40 border border-border overflow-hidden", index === filtered.length - 1 && filtered.length > 1 ? "bottom-full mb-1" : "top-full mt-1")} style={{ backgroundColor: 'var(--card)' }}>
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setActiveMenuUserId(null);
                                setEditingUser(u);
                                setActiveTab('details');
                                setFormData({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.roles?.[0] || 'STUDENT' });
                                setIsDrawerOpen(true);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-accent/50 cursor-pointer"
                              style={{ color: 'var(--foreground)' }}
                            >
                              Edit
                            </button>
                            {u.id !== user?.id && (
                              <button
                                onClick={() => {
                                  setActiveMenuUserId(null);
                                  setConfirmModal({ isOpen: true, type: 'delete', title: 'Delete User', message: `Are you sure you want to delete ${u.firstName} ${u.lastName}?`, data: u.id });
                                }}
                                className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-destructive/10 text-destructive cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setFormError(''); setEditingUser(null); setActiveTab('details'); setStudentSearch(''); }}
        title={editingUser ? "Edit User" : "Create New User"}
        description={editingUser ? "Modify user details below." : "Fill in the details below to add a new system user."}
      >
        <div className="space-y-4 pt-2">
          {editingUser && (isSuperAdmin || isAdmin) && (
            <div className="flex flex-wrap gap-4 border-b border-border pb-2">
              <button
                className={cn("text-sm font-medium pb-2 -mb-[9px] transition-colors", activeTab === 'details' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
                onClick={() => setActiveTab('details')}
              >
                Profile Details
              </button>
              {isSuperAdmin && (
                <button
                  className={cn("text-sm font-medium pb-2 -mb-[9px] transition-colors", activeTab === 'permissions' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
                  onClick={() => setActiveTab('permissions')}
                >
                  Direct Permissions
                </button>
              )}
              {editingUserIsFaculty && (
                <button
                  className={cn("text-sm font-medium pb-2 -mb-[9px] transition-colors", activeTab === 'courses' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
                  onClick={() => setActiveTab('courses')}
                >
                  Course Assignments
                </button>
              )}
              {editingUserIsFaculty && (
                <button
                  className={cn("text-sm font-medium pb-2 -mb-[9px] transition-colors", activeTab === 'students' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
                  onClick={() => setActiveTab('students')}
                >
                  Students
                </button>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
              {formError && (
                <div className="text-sm p-3 rounded-md" style={{ backgroundColor: 'oklch(0.577 0.245 27.325 / 0.1)', color: 'var(--destructive)' }}>
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                <Input label="Last Name" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Role</label>
                <select
                  className="h-10 w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
                  style={{ backgroundColor: 'var(--background)', border: '1px solid var(--input)', color: 'var(--foreground)' }}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  {allowedRolesToCreate.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Button type="button" variant="outline" onClick={() => { setIsDrawerOpen(false); setEditingUser(null); }}>Cancel</Button>
                <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                  {editingUser ? (updateUserMutation.isPending ? 'Saving…' : 'Save Changes') : (createUserMutation.isPending ? 'Creating…' : 'Create User')}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'permissions' && isSuperAdmin && editingUser && (
            <div className="space-y-4 pt-2">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Direct permissions override role-based permissions and apply only to this specific user.
              </p>
              <div className="grid grid-cols-1 gap-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                {permissions.map((perm: any) => {
                  const hasIt = userDirectPerms.has(perm.id);
                  return (
                    <label key={perm.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--accent)] cursor-pointer transition-colors">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--ring)]"
                          checked={hasIt}
                          onChange={() => toggleDirectPermission(perm.id, hasIt)}
                          disabled={grantPermMutation.isPending || revokePermMutation.isPending}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium font-mono" style={{ color: 'var(--foreground)' }}>{perm.name}</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{perm.description || 'No description provided.'}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'courses' && editingUserIsFaculty && editingUser && (
            <div className="space-y-4 pt-2">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Assign courses to <strong>{editingUser.firstName} {editingUser.lastName}</strong>. Faculty can only see their assigned courses.
              </p>

              {/* Currently Assigned */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Assigned Courses</h3>
                <div className="space-y-1.5">
                  {(facultyCoursesData || []).length === 0 ? (
                    <p className="text-sm py-3 text-center rounded-lg" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>No courses assigned yet.</p>
                  ) : (
                    (facultyCoursesData || []).map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: 'var(--muted)' }}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary)' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.name}</p>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.code}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => unassignCourseMutation.mutate({ userId: editingUser.id, courseId: c.id })}
                          disabled={unassignCourseMutation.isPending}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-destructive/10 cursor-pointer"
                          style={{ color: 'var(--muted-foreground)' }}
                          title="Remove assignment"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Course */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Add Course</h3>
                <div className="space-y-1.5">
                  {(allCoursesData || [])
                    .filter((c: any) => !(facultyCoursesData || []).find((a: any) => a.id === c.id))
                    .map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.code}</p>
                        </div>
                        <button
                          onClick={() => assignCourseMutation.mutate({ userId: editingUser.id, courseId: c.id })}
                          disabled={assignCourseMutation.isPending}
                          className="flex h-7 items-center gap-1 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                          <Plus className="h-3 w-3" /> Assign
                        </button>
                      </div>
                    ))}
                  {(allCoursesData || []).filter((c: any) => !(facultyCoursesData || []).find((a: any) => a.id === c.id)).length === 0 && (
                    <p className="text-sm py-3 text-center rounded-lg" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>All courses are already assigned.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && editingUserIsFaculty && editingUser && (
            <div className="space-y-4 pt-2">
              {/* Attendance Control Bar */}
              <Card className="border-border/60 mb-6 overflow-hidden mt-4">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(135deg, hsl(267, 55%, 52%), hsl(307, 60%, 62%))' }} />
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
                      <Button variant="outline" className="lg:ml-4 justify-start font-normal">
                        <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                        {format(new Date(selectedDate), "EEEE, MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(selectedDate)}
                        onSelect={(d) => d && setSelectedDate(format(d, 'yyyy-MM-dd'))}
                        className="rounded-md border shadow p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-2 lg:ml-auto">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Present {stats.presentCount}
                    </Badge>
                    <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5">
                      <XCircle className="h-3 w-3 mr-1" /> Absent {stats.absentCount}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={handleMarkAllPresent}
                    >
                      Mark all present
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full h-8.5 pl-9 pr-4 rounded-md text-xs outline-none transition-colors border"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              {/* Scrollable grid container */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {(() => {
                  const filteredStudents = enrichedStudentsList.filter((s: any) =>
                    `${s.firstName} ${s.lastName} ${s.email} ${s.studentId} ${s.program}`.toLowerCase().includes(studentSearch.toLowerCase())
                  );

                  if (enrichedStudentsList.length === 0) {
                    return (
                      <p className="text-sm py-8 text-center rounded-lg" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        No students enrolled in this faculty's courses.
                      </p>
                    );
                  }

                  if (filteredStudents.length === 0) {
                    return (
                      <p className="text-sm py-8 text-center rounded-lg" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        No matching students found.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 mt-4">
                      {filteredStudents.map((student: any) => (
                        <StudentCard
                          key={student.id}
                          student={student}
                          attendanceMark={attendance[`${student.id}_${selectedDate}`]}
                          attendanceDate={selectedDate}
                          onMarkPresent={() => markAttendance(student.id, 'PRESENT')}
                          onMarkAbsent={() => markAttendance(student.id, 'ABSENT')}
                          onOpenHistory={() => {
                            setHistoryModalStudent(student);
                            setCurrentCalendarMonth(new Date());
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-lg overflow-hidden border border-border p-6 space-y-4 shadow-xl" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>{confirmModal.title}</h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{confirmModal.message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                variant={confirmModal.type === 'delete' ? 'destructive' : 'primary'}
                onClick={() => {
                  if (confirmModal.type === 'save') updateUserMutation.mutate(confirmModal.data);
                  else if (confirmModal.type === 'delete') deleteUserMutation.mutate(confirmModal.data);
                  setConfirmModal(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Calendar Dialog */}
      <Dialog open={!!historyModalStudent} onOpenChange={(open) => !open && setHistoryModalStudent(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{historyModalStudent?.firstName} {historyModalStudent?.lastName} · Attendance history</DialogTitle>
            <DialogDescription>{historyModalStudent?.studentId} · {historyModalStudent?.program}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto divide-y">
            {(() => {
              if (!historyModalStudent) return null;
              const studentHistory = Object.keys(attendance)
                .filter(k => k.startsWith(`${historyModalStudent.id}_`))
                .map(k => [k.split('_')[1], attendance[k]])
                .sort((a, b) => (a[0] < b[0] ? 1 : -1));

              if (studentHistory.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No attendance marked yet.
                  </p>
                );
              }

              return studentHistory.map(([date, value]) => (
                <div key={date as string} className="flex items-center justify-between py-3">
                  <div className="text-sm font-medium">
                    {format(new Date(date as string), "EEE, MMM d, yyyy")}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      value === "PRESENT"
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-destructive/30 text-destructive bg-destructive/5"
                    }
                  >
                    {value === "PRESENT" ? "Present" : "Absent"}
                  </Badge>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
