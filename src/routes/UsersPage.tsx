import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, BookOpen, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { StudentCard } from '../components/ui/StudentCard';

export function UsersPage() {
  const [page] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'courses' | 'students'>('details');
  
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
  const filtered = allUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative w-full md:w-64">
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
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Students enrolled in courses assigned to <strong>{editingUser.firstName} {editingUser.lastName}</strong>.
              </p>

              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-md text-sm outline-none transition-colors border"
                  style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {(() => {
                  const studentsList: any[] = facultyStudentsData?.data || [];
                  const filteredStudents = studentsList.filter((s: any) =>
                    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(studentSearch.toLowerCase())
                  );

                  if (studentsList.length === 0) {
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

                  return filteredStudents.map((student: any) => (
                    <StudentCard key={student.id} student={student} compact />
                  ));
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
    </>
  );
}
