import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Skeleton from '../components/ui/skeleton';

export function Notification() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    // Form states for Notification
    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        type: 'INFO', // INFO, WARNING, ALERT, SUCCESS
        isGlobal: false,
        targetRoles: [] as string[],
        cohortIds: [] as string[],
        courseIds: [] as string[],
    });

    const resetNotificationForm = () => {
        setNotificationForm({
            title: '',
            message: '',
            type: 'INFO',
            isGlobal: false,
            targetRoles: [],
            cohortIds: [],
            courseIds: [],
        });
    };

    const isAdmin = user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN') || user?.roles.includes('FACULTY');

    // Get notifications list
    const { data: notifications = [], isLoading } = useQuery<any[]>({
        queryKey: ['notifications'],
        queryFn: () => apiFetch('/notifications'),
    });

    // Get cohorts list for targeting options
    const { data: cohorts = [] } = useQuery<any[]>({
        queryKey: ['cohorts'],
        queryFn: () => apiFetch('/cohorts'),
    });

    // Get courses list for targeting options
    const { data: courses = [] } = useQuery<any[]>({
        queryKey: ['courses'],
        queryFn: () => apiFetch('/courses'),
    });

    // Mutations
    const createNotification = useMutation({
        mutationFn: (data: any) => apiFetch('/notifications', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            closeNotificationDrawer();
            resetNotificationForm();
        },
    });

    const updateNotification = useMutation({
        mutationFn: (data: any) =>
            apiFetch(`/notifications/${editingNotification.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            closeNotificationDrawer();
        },
    });

    const deleteNotification = useMutation({
        mutationFn: (id: string) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setConfirmDelete(null);
            if (selectedNotification?.id === confirmDelete) {
                setSelectedNotification(null);
            }
        },
    });

    // Notification handlers
    const openCreateNotification = () => {
        setEditingNotification(null);
        resetNotificationForm();
        setIsNotificationDrawerOpen(true);
    };

    const openEditNotification = (notification: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNotification(notification);
        setNotificationForm({
            title: notification.title || '',
            message: notification.message || '',
            type: notification.type || 'INFO',
            isGlobal: notification.isGlobal ?? false,
            targetRoles: notification.targetRoles || [],
            cohortIds: notification.cohortIds || [],
            courseIds: notification.courseIds || [],
        });
        setIsNotificationDrawerOpen(true);
    };

    const closeNotificationDrawer = () => {
        setIsNotificationDrawerOpen(false);
        setEditingNotification(null);
    };

    const handleNotificationSubmit = () => {
        const payload = {
            title: notificationForm.title,
            message: notificationForm.message,
            type: notificationForm.type,
            isGlobal: notificationForm.isGlobal,
            targetRoles: notificationForm.isGlobal ? [] : notificationForm.targetRoles,
            cohortIds: notificationForm.isGlobal ? [] : notificationForm.cohortIds,
            courseIds: notificationForm.isGlobal ? [] : notificationForm.courseIds,
        };

        if (editingNotification) {
            updateNotification.mutate(payload);
        } else {
            createNotification.mutate(payload);
        }
    };

    const notificationsList = Array.isArray(notifications)
        ? notifications
        : (notifications as any)?.data || (notifications as any)?.notifications || [];

    const filteredNotifications = notificationsList.filter(
        (notification: any) =>
            notification.title?.toLowerCase().includes(search.toLowerCase()) ||
            notification.message?.toLowerCase().includes(search.toLowerCase())
    );

    const getCohortName = (id: string) => cohorts.find((c) => c.id === id)?.name || id;
    const getCourseName = (id: string) => courses.find((c) => c.id === id)?.name || id;

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'WARNING':
                return {
                    bg: 'bg-amber-50 border-amber-200 text-amber-700',
                    iconBg: 'bg-amber-100 text-amber-700',
                    icon: <AlertTriangle className="w-4 h-4" />
                };
            case 'ALERT':
                return {
                    bg: 'bg-rose-50 border-rose-200 text-rose-700',
                    iconBg: 'bg-rose-100 text-rose-700',
                    icon: <AlertCircle className="w-4 h-4" />
                };
            case 'SUCCESS':
                return {
                    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                    iconBg: 'bg-emerald-100 text-emerald-700',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'INFO':
            default:
                return {
                    bg: 'bg-blue-50 border-blue-200 text-blue-700',
                    iconBg: 'bg-blue-100 text-blue-700',
                    icon: <Info className="w-4 h-4" />
                };
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                <div className="space-y-2">
                    <nav className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Home</span><span className="mx-1">›</span>
                        <span>Academics</span><span className="mx-1">›</span>
                        <span className="text-gray-900 font-medium">Notifications</span>
                    </nav>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
                        Notifications
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search notifications..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <Button onClick={openCreateNotification} className="gap-2 shrink-0">
                            <Plus className="w-4 h-4" />
                            Create Notification
                        </Button>
                    )}
                </div>
            </div>

            {
                isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
                        {
                            Array.from({ length: 6 }).map((_, i) => (
                                <Card
                                    key={i}
                                    className="border border-gray-100 flex flex-col justify-between h-[200px]"
                                >
                                    <CardHeader className="pb-2 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-5 w-16 rounded" />
                                            <Skeleton className="h-5 w-14 rounded-full" />
                                        </div>
                                        <Skeleton className="h-6 w-3/4 rounded mt-2" />
                                    </CardHeader>
                                    <CardContent className="pb-4 flex-1">
                                        <Skeleton className="h-4 w-full rounded mb-2" />
                                        <Skeleton className="h-4 w-5/6 rounded" />
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div >
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-20 text-sm text-gray-500">No notifications found matching "{search}"</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotifications.map((notification: any) => {
                            const typeStyles = getTypeStyles(notification.type);
                            return (
                                <Card
                                    key={notification.id}
                                    className="cursor-pointer hover:shadow-md transition-all duration-200 group border border-gray-100 flex flex-col justify-between"
                                    onClick={() => setSelectedNotification(notification)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded ${typeStyles.iconBg}`}>
                                                    {typeStyles.icon}
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${typeStyles.bg}`}>
                                                    {notification.type}
                                                </span>
                                            </div>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${notification.isGlobal
                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                                    }`}
                                            >
                                                {notification.isGlobal ? 'Global' : 'Targeted'}
                                            </span>
                                        </div>
                                        <CardTitle className="mt-3 text-lg font-bold text-gray-900 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                                            {notification.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 flex-1">
                                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                                            {notification.message}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center bg-gray-50/50 rounded-b-xl border-t border-gray-100/50 py-3">
                                        <span className="text-[10px] text-gray-400">
                                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
                                        </span>
                                        {isAdmin && (
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-gray-500"
                                                    onClick={(e) => openEditNotification(notification, e)}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                                                    onClick={() => setConfirmDelete(notification.id)}
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
                )
            }

            {/* Create/Update Drawer */}
            <Drawer
                isOpen={isNotificationDrawerOpen}
                onClose={closeNotificationDrawer}
                title={editingNotification ? 'Update Notification' : 'Create Notification'}
                description="Compose a new notification and select target audience.">

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-150 mb-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-gray-700">Global Announcement</span>
                            <span className="text-[10px] text-gray-500">
                                Broadcast this notification to all users globally
                            </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={notificationForm.isGlobal}
                                onChange={(e) => setNotificationForm({ ...notificationForm, isGlobal: e.target.checked })}
                            />
                            <div
                                className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"
                                style={{ backgroundColor: notificationForm.isGlobal ? 'var(--primary)' : '#e5e5e5' }}
                            />
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Notification Title</label>
                        <Input
                            placeholder="Enter title..."
                            value={notificationForm.title}
                            onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Message Body</label>
                        <textarea
                            placeholder="Enter message content..."
                            rows={4}
                            value={notificationForm.message}
                            onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">
                            Notification Type
                        </label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            value={notificationForm.type}
                            onChange={(e) =>
                                setNotificationForm({
                                    ...notificationForm,
                                    type: e.target.value,
                                })
                            }
                        >
                            <option value="INFO">INFO (Blue Info Badge)</option>
                            <option value="SUCCESS">SUCCESS (Green Check Badge)</option>
                            <option value="WARNING">WARNING (Yellow Alert Badge)</option>
                            <option value="ALERT">ALERT (Red Danger Badge)</option>
                        </select>
                    </div>

                    {/* Target audience selection, visible only if not global */}
                    {!notificationForm.isGlobal && (
                        <div className="space-y-4 bg-gray-50/50 p-3 rounded-lg border border-gray-150">
                            <span className="text-[10px] font-bold text-gray-400 block mb-1">AUDIENCE TARGET FILTERS</span>
                            
                            {/* Roles targeting */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Target Roles</label>
                                <div className="flex flex-wrap gap-3 p-2 bg-white border border-gray-200 rounded">
                                    {['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'].map((role) => (
                                        <label key={role} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationForm.targetRoles.includes(role)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setNotificationForm(prev => ({
                                                        ...prev,
                                                        targetRoles: checked 
                                                            ? [...prev.targetRoles, role] 
                                                            : prev.targetRoles.filter(r => r !== role)
                                                    }));
                                                }}
                                                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                            />
                                            <span>{role.replace('_', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Cohorts targeting */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Target Cohorts</label>
                                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded bg-white p-2 space-y-1">
                                    {cohorts.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={notificationForm.cohortIds.includes(c.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setNotificationForm(prev => ({
                                                        ...prev,
                                                        cohortIds: checked 
                                                            ? [...prev.cohortIds, c.id] 
                                                            : prev.cohortIds.filter(id => id !== c.id)
                                                    }));
                                                }}
                                                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                            />
                                            <span>{c.name}</span>
                                        </label>
                                    ))}
                                    {cohorts.length === 0 && <div className="text-xs text-gray-400 p-1">No cohorts found</div>}
                                </div>
                            </div>

                            {/* Courses targeting */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Target Courses</label>
                                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded bg-white p-2 space-y-1">
                                    {courses.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={notificationForm.courseIds.includes(c.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setNotificationForm(prev => ({
                                                        ...prev,
                                                        courseIds: checked 
                                                            ? [...prev.courseIds, c.id] 
                                                            : prev.courseIds.filter(id => id !== c.id)
                                                    }));
                                                }}
                                                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                            />
                                            <span>{c.name}</span>
                                        </label>
                                    ))}
                                    {courses.length === 0 && <div className="text-xs text-gray-400 p-1">No courses found</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={closeNotificationDrawer}>Cancel</Button>
                        <Button onClick={handleNotificationSubmit} disabled={createNotification.isPending || updateNotification.isPending}>
                            {createNotification.isPending || updateNotification.isPending ? 'Saving...' : 'Save Notification'}
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* View Notification Details Modal */}
            <Modal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                title={selectedNotification?.title || 'Notification'}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${selectedNotification ? getTypeStyles(selectedNotification.type).bg : ''}`}>
                            {selectedNotification?.type}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedNotification?.isGlobal ? 'bg-purple-50 text-purple-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {selectedNotification?.isGlobal ? 'Global Notification' : 'Targeted Notification'}
                        </span>
                    </div>

                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100 max-h-64 overflow-y-auto">
                        {selectedNotification?.message}
                    </div>

                    {!selectedNotification?.isGlobal && selectedNotification && (
                        <div className="text-xs space-y-2 border-t border-gray-150 pt-3">
                            {selectedNotification.targetRoles && selectedNotification.targetRoles.length > 0 && (
                                <div>
                                    <span className="font-semibold text-gray-500 block mb-1">Target Roles</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedNotification.targetRoles.map((role: string) => (
                                            <span key={role} className="bg-gray-100 text-gray-750 px-2 py-0.5 rounded">
                                                {role.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedNotification.cohortIds && selectedNotification.cohortIds.length > 0 && (
                                <div>
                                    <span className="font-semibold text-gray-500 block mb-1">Target Cohorts</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedNotification.cohortIds.map((id: string) => (
                                            <span key={id} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                                {getCohortName(id)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedNotification.courseIds && selectedNotification.courseIds.length > 0 && (
                                <div>
                                    <span className="font-semibold text-gray-500 block mb-1">Target Courses</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedNotification.courseIds.map((id: string) => (
                                            <span key={id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                                {getCourseName(id)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
                        <span>Created: {selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : 'N/A'}</span>
                        <Button variant="outline" onClick={() => setSelectedNotification(null)}>Close</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Delete Notification"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Are you sure you want to delete this notification? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => confirmDelete && deleteNotification.mutate(confirmDelete)}
                            disabled={deleteNotification.isPending}
                        >
                            {deleteNotification.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
