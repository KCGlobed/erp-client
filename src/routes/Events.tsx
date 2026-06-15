import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Clock, Calendar, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Skeleton from '../components/ui/skeleton';

export function Events() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // const [selectedEvent, setSelectedEvent] = useState<any>(null);
    // const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [isEventsDrawerOpen, setIsEventsDrawerOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // Form states for Event
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        type: 'ORIENTATION',
    });

    const isAdmin = user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN');

    // Get tasks
    const { data: events = [], isLoading } = useQuery<any[]>({
        queryKey: ['events'],
        queryFn: () => apiFetch('/calendar/events'),
    });

    // Mutations
    const createEvents = useMutation({
        mutationFn: (data: any) => apiFetch('/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            closeEventDrawer();
        },
    });

    const updateEvents = useMutation({
        mutationFn: (data: any) =>
            apiFetch(`/calendar/events/${editingEvent.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            closeEventDrawer();
        },
    });

    const deleteEvents = useMutation({
        mutationFn: (id: string) => apiFetch(`/calendar/events/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
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

    // Event handlers
    const openCreateEvent = () => {
        setEditingEvent(null);
        setEventForm({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            type: '',
        });
        setIsEventsDrawerOpen(true);
    };

    const openEditEvent = (event: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingEvent(event);
        setEventForm({
            title: event.title,
            description: event.description || '',
            startDate: event.startDate,
            endDate: event.endDate,
            type: event.type || '',
        });
        setIsEventsDrawerOpen(true);
    };

    const closeEventDrawer = () => {
        setIsEventsDrawerOpen(false);
        setEditingEvent(null);
    };

    const handleEventSubmit = () => {
        if (editingEvent) {
            updateEvents.mutate(eventForm);
        } else {
            createEvents.mutate(eventForm);
        }
    };

    const filteredEvents = events.filter(
        (event) =>
            event.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                <div className="space-y-2">
                    <nav className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Home</span><span className="mx-1">›</span>
                        <span>Academics</span><span className="mx-1">›</span>
                        <span className="text-gray-900 font-medium">Events</span>
                    </nav>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
                        Academic Events
                    </h1>
                    {/* <p className="text-sm text-gray-500">
                        Manage events profiles, curriculum versions, trimesters, and subject outlines.
                    </p> */}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search events..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <Button onClick={openCreateEvent} className="gap-2 shrink-0">
                            <Plus className="w-4 h-4" />
                            Create Event
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
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-sm text-gray-500">No events found matching "{search}"</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event: any) => {
                        // const latestVersion = event.curriculums?.[0]?.version || 'None';
                        return (
                            <Card
                                key={event.id}
                                className="cursor-pointer hover:shadow-md transition-all duration-200 group relative border border-gray-100 flex flex-col justify-between"
                            // onClick={() => openDetailDrawer(event)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-end">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.isActive === true
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}
                                        >
                                            {event.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 text-lg text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                                        {event.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {event.description || 'No description provided.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(event.startDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(event.endDate).toLocaleDateString()}
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
                                                onClick={(e) => openEditEvent(event, e)}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                                                onClick={() => setConfirmDelete(event.id)}
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
                isOpen={isEventsDrawerOpen}
                onClose={closeEventDrawer}
                title={editingEvent ? 'Update Event Profile' : 'Create Event Profile'}
                description="Set event details, start date and end date."
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Event Name</label>
                        <Input
                            placeholder="e.g. Master of Business Administration"
                            value={eventForm.title}
                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Input
                            placeholder="Brief event summary"
                            value={eventForm.description}
                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <Input
                            type='date'
                            placeholder="e.g. 2024-01-01"
                            value={eventForm.startDate}
                            onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <Input
                            type='date'
                            placeholder='e.g. 2024-01-10'
                            value={eventForm.endDate}
                            onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Event Type
                        </label>

                        <select
                            value={eventForm.type}
                            onChange={(e) =>
                                setEventForm({
                                    ...eventForm,
                                    type: e.target.value,
                                })
                            }
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="ORIENTATION">Orientation</option>
                            <option value="WORKSHOP">Workshop</option>
                            <option value="SEMINAR">Seminar</option>
                            <option value="GUEST_LECTURE">Guest Lecture</option>
                            <option value="CONVOCATION">Convocation</option>
                            <option value="FACULTY_MEETING">Faculty Meeting</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={closeEventDrawer}>Cancel</Button>
                        <Button onClick={handleEventSubmit} disabled={createEvents.isPending || updateEvents.isPending}>
                            {createEvents.isPending || updateEvents.isPending ? 'Saving...' : 'Save Event'}
                        </Button>
                    </div>
                </div>
            </Drawer>


            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Delete Event Profile"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Are you sure you want to delete this event profile? This will delete the event completely. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => confirmDelete && deleteEvents.mutate(confirmDelete)}
                            disabled={deleteEvents.isPending}
                        >
                            {deleteEvents.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
