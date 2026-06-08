import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertCircle,
  Calendar as CalendarIcon,
  Lock,
  Bell,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

// Helper to format ISO date string to YYYY-MM-DD
const formatDateForInput = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

interface ExperienceItem {
  id: number;
  role: string;
  institution: string;
  dept: string;
  from: string;
  to: string;
}

export function FacultyProfilePage() {
  const { user: authUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'security' | 'notifications'>('personal');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    profilePhotoUrl: '',
    personalEmail: '',
    mobileNumber: '',
    alternateMobileNumber: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    currentAddress: '',
    permanentAddress: '',
    dateOfBirth: '',
    dateOfJoining: '',
    experience: [] as ExperienceItem[],
  });

  // ── Fetch Profile ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-profile'],
    queryFn: () => apiFetch('/faculty-profile/me'),
  });

  useEffect(() => {
    if (!data) return;

    let parsedExperience: ExperienceItem[] = [];
    try {
      if (data.profile?.experienceDescription) {
        parsedExperience = JSON.parse(data.profile.experienceDescription);
      }
    } catch (e) {
      // Fallback if not JSON
      parsedExperience = [
        {
          id: 1,
          role: data.profile?.experienceDescription || '',
          institution: '',
          dept: '',
          from: '',
          to: '',
        },
      ];
    }

    setForm({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      middleName: data.profile?.middleName ?? '',
      gender: data.profile?.gender ?? '',
      profilePhotoUrl: data.profile?.profilePhotoUrl ?? '',
      personalEmail: data.profile?.personalEmail ?? '',
      mobileNumber: data.profile?.mobileNumber ?? '',
      alternateMobileNumber: data.profile?.alternateMobileNumber ?? '',
      emergencyContactName: data.profile?.emergencyContactName ?? '',
      emergencyContactNumber: data.profile?.emergencyContactNumber ?? '',
      currentAddress: data.profile?.currentAddress ?? '',
      permanentAddress: data.profile?.permanentAddress ?? '',
      dateOfBirth: formatDateForInput(data.profile?.dateOfBirth),
      dateOfJoining: formatDateForInput(data.profile?.dateOfJoining),
      experience: parsedExperience,
    });
  }, [data]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { firstName, lastName } = form;

      // Update base user name (First Name, Last Name)
      if (firstName !== data?.firstName || lastName !== data?.lastName) {
        await apiFetch(`/users/${authUser?.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ firstName, lastName }),
        });
      }

      // Update middleName, dateOfBirth, and dateOfJoining in faculty profile
      const profilePayload = {
        middleName: form.middleName || null,
        gender: form.gender || null,
        profilePhotoUrl: form.profilePhotoUrl || null,
        personalEmail: form.personalEmail || null,
        mobileNumber: form.mobileNumber || null,
        alternateMobileNumber: form.alternateMobileNumber || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactNumber: form.emergencyContactNumber || null,
        currentAddress: form.currentAddress || null,
        permanentAddress: form.permanentAddress || null,
        dateOfBirth: form.dateOfBirth || null,
        dateOfJoining: form.dateOfJoining || null,

        // Convert experience array back to JSON string
        experienceDescription:
          form.experience.length > 0
            ? JSON.stringify(form.experience)
            : null,
      };

      return apiFetch('/faculty-profile/me', {
        method: 'PATCH',
        body: JSON.stringify(profilePayload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-profile'] });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleStartEdit = () => {
    setDraft(JSON.parse(JSON.stringify(form)));
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (draft) {
      setForm(draft);
    }
    setEditing(false);
  };

  const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ');
  const avatar =
    form.profilePhotoUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.firstName}_${form.lastName}`;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-2xl h-44 bg-neutral-100" />
        <div className="animate-pulse rounded-2xl h-96 bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* ── Top Nav / Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium mb-1">
            <span>Home</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-600 font-semibold">My Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 font-serif" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>My Profile</h1>
          <p className="text-sm text-neutral-500">
            Personal information, account, and notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 animate-fade-in">
              <Check className="h-3.5 w-3.5" /> Changes saved
            </span>
          )}
          {saveMutation.isError && (
            <span className="text-xs font-semibold text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
              <AlertCircle className="h-3.5 w-3.5" /> Error saving changes
            </span>
          )}

          {editing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="h-9 px-4 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="h-9 px-5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: 'rgb(88, 5, 85)' }}
              >
                <Save className="h-3.5 w-3.5" /> {saveMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="h-9 px-5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'rgb(88, 5, 85)' }}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Hero Info Card ── */}
      <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar section */}
            <div className="relative w-24 h-24 shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Title / Role details */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                <h1 className="text-xl font-bold text-neutral-900 truncate">{fullName || 'Faculty Profile'}</h1>
                <div className="flex gap-2 justify-center md:justify-start shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-100 text-purple-700 bg-purple-50">
                    Verified
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    Faculty
                  </span>
                </div>
              </div>

              <p className="text-sm text-neutral-500 mb-3">
                {form.experience[0]?.role || 'Faculty'} · {form.experience[0]?.dept || 'Department'}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" style={{ color: 'rgb(88, 5, 85)' }} /> {data?.email}
                </span>
                {form.mobileNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" style={{ color: 'rgb(88, 5, 85)' }} /> {form.mobileNumber}
                  </span>
                )}
                {form.currentAddress && (
                  <span className="flex items-center gap-1.5 max-w-xs truncate">
                    <MapPin className="h-3.5 w-3.5" style={{ color: 'rgb(88, 5, 85)' }} /> {form.currentAddress}
                  </span>
                )}
                {form.dateOfJoining && (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" style={{ color: 'rgb(88, 5, 85)' }} /> Joined {form.dateOfJoining}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Navigation Tabs ── */}
      <div className="mb-6">
        <Tabs
          activeTab={activeTab}
          onChange={(id: any) => setActiveTab(id)}
          tabs={[
            { id: 'personal', label: 'Personal', icon: <User className="h-4 w-4" /> },
            { id: 'account', label: 'Account', icon: <Mail className="h-4 w-4" /> },
            { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
          ]}
        />
      </div>

      {/* ── Tab Content ── */}
      <div>
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-fade-in">
            {/* Basic Information */}
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Basic Information</h2>
                <p className="text-xs text-neutral-450 mt-0.5">How others see you across EduERP.</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={form.middleName}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Gender</label>
                    {!editing ? (
                      <input
                        type="text"
                        value={form.gender}
                        disabled={true}
                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                      />
                    ) : (
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        disabled={!editing}
                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    )}

                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date of Birth</label>
                    {!editing ? (
                      <input
                        type="text"
                        value={form.dateOfBirth || ''}
                        disabled={true}
                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                      />
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-left flex items-center justify-between cursor-pointer w-full"
                          >
                            <span>
                              {form.dateOfBirth
                                ? format(new Date(form.dateOfBirth), 'PPP')
                                : 'Select Date of Birth'}
                            </span>
                            <CalendarIcon className="h-4 w-4 text-neutral-400" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border border-neutral-200 rounded-lg shadow-lg z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={form.dateOfBirth ? new Date(form.dateOfBirth) : undefined}
                            onSelect={(d) => {
                              if (d) {
                                setForm((prev) => ({
                                  ...prev,
                                  dateOfBirth: format(d, 'yyyy-MM-dd'),
                                }));
                              }
                            }}
                            className="p-3 bg-white"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date of Joining</label>
                    {!editing ? (
                      <input
                        type="text"
                        value={form.dateOfJoining || ''}
                        placeholder=""
                        disabled={true}
                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                      />
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-left flex items-center justify-between cursor-pointer w-full"
                          >
                            <span>
                              {form.dateOfJoining
                                ? format(new Date(form.dateOfJoining), 'PPP')
                                : 'Select Date of Joining'}
                            </span>
                            <CalendarIcon className="h-4 w-4 text-neutral-400" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border border-neutral-200 rounded-lg shadow-lg z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={form.dateOfJoining ? new Date(form.dateOfJoining) : undefined}
                            onSelect={(d) => {
                              if (d) {
                                setForm((prev) => ({
                                  ...prev,
                                  dateOfJoining: format(d, 'yyyy-MM-dd'),
                                }));
                              }
                            }}
                            className="p-3 bg-white"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Contact Details</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Official Email Address</label>
                    <input
                      type="email"
                      value={data?.email ?? ''}
                      // value={form.personalEmail}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Personal Email Address</label>
                    <input
                      type="email"
                      name="personalEmail"
                      value={form.personalEmail}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={form.mobileNumber}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Alternate Mobile Number</label>
                    <input
                      type="tel"
                      name="alternateMobileNumber"
                      value={form.alternateMobileNumber}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Emergency Contact Details</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={form.emergencyContactName}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Emergency Contact Number</label>
                    <input
                      type="tel"
                      name="emergencyContactNumber"
                      value={form.emergencyContactNumber}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                        ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                        }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Address Details</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Current Address</label>
                  <textarea
                    rows={2}
                    name="currentAddress"
                    value={form.currentAddress}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`h-10 px-3 pt-2 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                      ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                      }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Permanent Address</label>
                  <textarea
                    rows={2}
                    name="permanentAddress"
                    value={form.permanentAddress}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`h-10 pt-2 pl-4 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                      ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                      }`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-800">Work Experience</h2>
                  <p className="text-xs text-neutral-450 mt-0.5">Details about your past professional and academic career.</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {form.experience.length === 0 ? (
                    <div className="text-center py-6 text-sm text-neutral-400 italic">
                      No experience records found.
                    </div>
                  ) : (
                    form.experience.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 flex flex-col gap-3 relative"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-455 uppercase">Role / Designation</label>
                            <input
                              type="text"
                              value={item.role}
                              disabled={true}
                              placeholder="e.g. Associate Professor"
                              className="h-9 px-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-455 uppercase">Institution / Organization</label>
                            <input
                              type="text"
                              value={item.institution}
                              disabled={true}
                              placeholder="e.g. IIT Bengaluru"
                              className="h-9 px-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-455 uppercase">Department</label>
                            <input
                              type="text"
                              value={item.dept}
                              disabled={true}
                              placeholder="e.g. Computer Science"
                              className="h-9 px-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-neutral-455 uppercase">From (Year)</label>
                              <input
                                type="text"
                                value={item.from}
                                disabled={true}
                                placeholder="e.g. 2019"
                                className="h-9 px-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-neutral-455 uppercase">To (Year)</label>
                              <input
                                type="text"
                                value={item.to}
                                disabled={true}
                                placeholder="e.g. Present"
                                className="h-9 px-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in">
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Account Information</h2>
                <p className="text-xs text-neutral-450 mt-0.5">Your official account and credentials.</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Username / Account ID</label>
                    <input
                      type="text"
                      value={data?.id ?? 'FAC-10023'}
                      disabled
                      className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Account Status</label>
                    <div className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" /> Active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fade-in">
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Password</h2>
                <p className="text-xs text-neutral-450 mt-0.5">Use a strong password you don't reuse elsewhere.</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Repeat new password"
                      className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    className="h-9 px-5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: 'rgb(88, 5, 85)' }}
                  >
                    Update password
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="animate-fade-in">
            <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Notification preferences</h2>
                <p className="text-xs text-neutral-450 mt-0.5">Choose what updates you want to receive.</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-850">Email updates</h4>
                      <p className="text-xs text-neutral-450">Receive important account and academic updates by email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800" style={{ backgroundColor: '#e5e5e5' }} />
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-850">Push alerts</h4>
                      <p className="text-xs text-neutral-450">Real-time alerts in your browser when something needs attention.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800" style={{ backgroundColor: '#e5e5e5' }} />
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-855">Weekly digest</h4>
                      <p className="text-xs text-neutral-450">A summary of activity, attendance and pending tasks every Monday.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800" style={{ backgroundColor: '#e5e5e5' }} />
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-855">SMS alerts</h4>
                      <p className="text-xs text-neutral-450">Critical alerts sent to your registered mobile number.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800" style={{ backgroundColor: '#e5e5e5' }} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    className="h-9 px-5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: 'rgb(88, 5, 85)' }}
                  >
                    Save preferences
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Sticky Bottom Save / Action Bar when editing */}
      {editing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-neutral-200/85 rounded-2xl px-5 py-3 shadow-xl">
          <button
            onClick={handleCancelEdit}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="h-9 px-5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: 'rgb(88, 5, 85)' }}
          >
            <Save className="h-3.5 w-3.5" /> {saveMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  );
}
