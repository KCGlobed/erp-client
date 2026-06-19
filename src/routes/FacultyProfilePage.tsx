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
import Skeleton from '../components/ui/skeleton';
import { useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

// Helper to format ISO date string to YYYY-MM-DD
const formatDateForInput = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

interface ExperienceItem {
  id: number;
  designation: string;
  organizationName: string;
  functionalArea: string;
  fromDate: string;
  toDate: string;
}

export function FacultyProfilePage() {
  const { user: authUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'security' | 'notifications'>('personal');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [employmentStatus, setEmploymentStatus] = useState<'FRESHER' | 'EXPERIENCED'>('FRESHER');

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    profilePhotoUrl: '',
    profileBannerUrl: '',
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

  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now(),
          designation: '',
          organizationName: '',
          functionalArea: '',
          fromDate: '',
          toDate: '',
        },
      ],
    }));
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceItem,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // ── Fetch Profile ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-profile'],
    queryFn: () => apiFetch('/faculty-profile/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes stale time to avoid excessive background refetches on tab switch/renders
  });

  useEffect(() => {
    if (!data) return;

    let parsedExperience: ExperienceItem[] = [];
    if (Array.isArray(data.experiences)) {
      parsedExperience = data.experiences.map((exp: any) => ({
        id: exp.id,
        designation: exp.designation || '',
        organizationName: exp.organizationName || '',
        functionalArea: exp.functionalArea || '',
        fromDate: exp.fromDate ? exp.fromDate.split('T')[0] : '',
        toDate: exp.toDate ? exp.toDate.split('T')[0] : '',
      }));
    } else if (Array.isArray(data.profile?.experience)) {
      parsedExperience = data.profile.experience.map((item: any) => ({
        id: item.id || Date.now(),
        designation: item.designation || item.role || '',
        organizationName: item.organizationName || item.institution || '',
        functionalArea: item.functionalArea || item.dept || '',
        fromDate: (item.fromDate || item.from || '').split('T')[0],
        toDate: (item.toDate || item.to || '').split('T')[0],
      }));
    } else {
      try {
        if (data.profile?.experienceDescription) {
          const temp = JSON.parse(data.profile.experienceDescription);
          if (Array.isArray(temp)) {
            parsedExperience = temp.map((item: any) => ({
              id: item.id || Date.now(),
              designation: item.designation || item.role || '',
              organizationName: item.organizationName || item.institution || '',
              functionalArea: item.functionalArea || item.dept || '',
              fromDate: (item.fromDate || item.from || '').split('T')[0],
              toDate: (item.toDate || item.to || '').split('T')[0],
            }));
          }
        }
      } catch (e) {
        // Fallback if not JSON
        parsedExperience = [
          {
            id: 1,
            designation: data.profile?.experienceDescription || '',
            organizationName: '',
            functionalArea: '',
            fromDate: '',
            toDate: '',
          },
        ];
      }
    }
    console.log("API photo URL:", data.profile?.profilePhotoUrl);

    setForm({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      middleName: data.profile?.middleName ?? '',
      gender: data.profile?.gender ?? '',
      profilePhotoUrl: data.profilePhotoUrl ?? '',
      profileBannerUrl: data.profileBannerUrl ?? '',
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

    const hasRealExperiences = parsedExperience.length > 0;
    if (hasRealExperiences) {
      setEmploymentStatus('EXPERIENCED');
    } else {
      setEmploymentStatus('FRESHER');
    }

  }, [data]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { firstName, lastName } = form;

      // Update base user name (First Name, Last Name) if modified
      const userPayload: any = {};
      if (firstName !== data?.firstName) {
        userPayload.firstName = firstName;
      }
      if (lastName !== data?.lastName) {
        userPayload.lastName = lastName;
      }
      if (Object.keys(userPayload).length > 0) {
        await apiFetch(`/users/${authUser?.id}`, {
          method: 'PATCH',
          body: JSON.stringify(userPayload),
        });
      }

      // Update modified faculty profile fields
      const profilePayload: any = {};

      const isFresher = employmentStatus === 'FRESHER';

      if (isFresher !== data.profile?.isFresher) {
        profilePayload.isFresher = isFresher;
      }

      const profileFields = [
        'middleName',
        'gender',
        'profilePhotoUrl',
        'personalEmail',
        'mobileNumber',
        'alternateMobileNumber',
        'emergencyContactName',
        'emergencyContactNumber',
        'currentAddress',
        'permanentAddress',
      ];

      for (const key of profileFields) {
        const formVal = form[key as keyof typeof form];
        const originalVal = data.profile?.[key];
        const normalizedFormVal = formVal === undefined || formVal === null ? '' : formVal;
        const normalizedOriginalVal = originalVal === undefined || originalVal === null ? '' : originalVal;

        if (normalizedFormVal !== normalizedOriginalVal) {
          profilePayload[key] = formVal === '' ? null : formVal;
        }
      }

      // Check dateOfBirth
      const originalDob = formatDateForInput(data.profile?.dateOfBirth);
      if (form.dateOfBirth !== originalDob) {
        profilePayload.dateOfBirth = form.dateOfBirth === '' ? null : form.dateOfBirth;
      }

      // Check dateOfJoining
      const originalDoj = formatDateForInput(data.profile?.dateOfJoining);
      if (form.dateOfJoining !== originalDoj) {
        profilePayload.dateOfJoining = form.dateOfJoining === '' ? null : form.dateOfJoining;
      }

      // Check experience
      let originalExperience: ExperienceItem[] = [];
      if (Array.isArray(data.experiences)) {
        originalExperience = data.experiences.map((exp: any) => ({
          id: exp.id,
          designation: exp.designation || '',
          organizationName: exp.organizationName || '',
          functionalArea: exp.functionalArea || '',
          fromDate: exp.fromDate ? exp.fromDate.split('T')[0] : '',
          toDate: exp.toDate ? exp.toDate.split('T')[0] : '',
        }));
      } else if (Array.isArray(data.profile?.experience)) {
        originalExperience = data.profile.experience.map((item: any) => ({
          id: item.id || Date.now(),
          designation: item.designation || item.role || '',
          organizationName: item.organizationName || item.institution || '',
          functionalArea: item.functionalArea || item.dept || '',
          fromDate: (item.fromDate || item.from || '').split('T')[0],
          toDate: (item.toDate || item.to || '').split('T')[0],
        }));
      } else {
        try {
          if (data.profile?.experienceDescription) {
            const temp = JSON.parse(data.profile.experienceDescription);
            if (Array.isArray(temp)) {
              originalExperience = temp.map((item: any) => ({
                id: item.id || Date.now(),
                designation: item.designation || item.role || '',
                organizationName: item.organizationName || item.institution || '',
                functionalArea: item.functionalArea || item.dept || '',
                fromDate: (item.fromDate || item.from || '').split('T')[0],
                toDate: (item.toDate || item.to || '').split('T')[0],
              }));
            }
          }
        } catch (e) {
          originalExperience = [
            {
              id: 1,
              designation: data.profile?.experienceDescription || '',
              organizationName: '',
              functionalArea: '',
              fromDate: '',
              toDate: '',
            },
          ];
        }
      }

      const targetExperience = employmentStatus === 'FRESHER' ? [] : form.experience.map(({ id, ...rest }) => rest);
      const normalizedOriginalExperience = originalExperience.map(({ id, ...rest }: any) => rest);
      const currentExpStr = JSON.stringify(targetExperience);
      const originalExpStr = JSON.stringify(normalizedOriginalExperience);
      if (currentExpStr !== originalExpStr) {
        profilePayload.experiences = targetExperience;
      }

      // PATCH profile only if any fields are modified
      if (Object.keys(profilePayload).length > 0) {
        await apiFetch('/faculty-profile/me', {
          method: 'PATCH',
          body: JSON.stringify(profilePayload),
        });
      }
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

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();

      formData.append('photo', file);

      return apiFetch('/faculty-profile/me/images', {
        method: 'POST',
        body: formData,
        // headers: {
        //   'content-type': 'multipart/form-data',
        // }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-profile'],
      });
    },
  });

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();

      // VERIFY THIS KEY WITH BACKEND
      formData.append('banner', file);

      return apiFetch('/faculty-profile/me/images', {
        method: 'POST',
        body: formData,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-profile'],
      });
      setBannerUrl(null); // Reset preview to display the updated backend URL
    },
  });

  const handleProfilePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // instant preview
    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      profilePhotoUrl: previewUrl,
    }));

    uploadPhotoMutation.mutate(file);
  };

  const handleBannerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setBannerUrl(previewUrl);

    uploadBannerMutation.mutate(file);
  };

  return (
    <div className="max-w-8xl mx-auto font-sans">
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

        {isLoading ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded animate-pulse bg-neutral-100" />
                <Skeleton className="h-4 w-4 rounded animate-pulse bg-neutral-100" />
                <Skeleton className="h-4 w-20 rounded animate-pulse bg-neutral-100" />
              </div>
              <Skeleton className="h-8 w-48 rounded-lg animate-pulse bg-neutral-100" />
              <Skeleton className="h-4 w-80 rounded animate-pulse bg-neutral-100" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg animate-pulse bg-neutral-100" />
          </div>
        ) : (
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
        )}
      </div>
      {
        isLoading ? (
          <div className="max-w-6xl mx-auto px-4 py-8 font-sans space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-12 rounded animate-pulse bg-neutral-100" />
                  <Skeleton className="h-4 w-4 rounded animate-pulse bg-neutral-100" />
                  <Skeleton className="h-4 w-20 rounded animate-pulse bg-neutral-100" />
                </div>
                <Skeleton className="h-8 w-48 rounded-lg animate-pulse bg-neutral-100" />
                <Skeleton className="h-4 w-80 rounded animate-pulse bg-neutral-100" />
              </div>
              <Skeleton className="h-9 w-32 rounded-lg animate-pulse bg-neutral-100" />
            </div>

            {/* Hero Card Skeleton */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start animate-fade-in">
              <Skeleton className="w-24 h-24 rounded-2xl shrink-0 animate-pulse bg-neutral-100" />
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <Skeleton className="h-7 w-48 rounded-lg animate-pulse bg-neutral-100" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full animate-pulse bg-neutral-100" />
                    <Skeleton className="h-5 w-16 rounded-full animate-pulse bg-neutral-100" />
                  </div>
                </div>
                <Skeleton className="h-4 w-32 rounded animate-pulse bg-neutral-100" />
                <div className="flex flex-wrap gap-4 pt-2">
                  <Skeleton className="h-4 w-36 rounded animate-pulse bg-neutral-100" />
                  <Skeleton className="h-4 w-28 rounded animate-pulse bg-neutral-100" />
                  <Skeleton className="h-4 w-40 rounded animate-pulse bg-neutral-100" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs Skeleton */}
            <div className="flex gap-2 border-b border-neutral-200 pb-px overflow-x-auto">
              <Skeleton className="h-10 w-28 rounded-t-lg shrink-0 animate-pulse bg-neutral-100" />
              <Skeleton className="h-10 w-28 rounded-t-lg shrink-0 animate-pulse bg-neutral-100" />
              <Skeleton className="h-10 w-28 rounded-t-lg shrink-0 animate-pulse bg-neutral-100" />
              <Skeleton className="h-10 w-28 rounded-t-lg shrink-0 animate-pulse bg-neutral-100" />
            </div>

            {/* Card Content Skeleton */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-neutral-100 pb-4">
                  <Skeleton className="h-6 w-40 rounded animate-pulse bg-neutral-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20 rounded animate-pulse bg-neutral-100" />
                    <Skeleton className="h-10 w-full rounded-lg animate-pulse bg-neutral-100" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20 rounded animate-pulse bg-neutral-100" />
                    <Skeleton className="h-10 w-full rounded-lg animate-pulse bg-neutral-100" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20 rounded animate-pulse bg-neutral-100" />
                    <Skeleton className="h-10 w-full rounded-lg animate-pulse bg-neutral-100" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20 rounded animate-pulse bg-neutral-100" />
                    <Skeleton className="h-10 w-full rounded-lg animate-pulse bg-neutral-100" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20 rounded animate-pulse bg-neutral-100" />
                    <Skeleton className="h-10 w-full rounded-lg animate-pulse bg-neutral-100" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20 rounded animate-pulse bg-neutral-100" />
                    <Skeleton className="h-10 w-full rounded-lg animate-pulse bg-neutral-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Card className="relative rounded-2xl overflow-hidden shadow-sm border border-neutral-100 mb-6 bg-white">
              {/* Banner Background */}
              <div
                className="h-44 w-full relative bg-neutral-100"
                style={{
                  backgroundImage: (bannerUrl || data?.profileBannerUrl) ? `url(${bannerUrl || data.profileBannerUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 30%',
                }}
              >
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute flex gap-2 justify-center text-primary items-center top-4 right-4 bg-white hover:bg-gray-100 text-neutral-800 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold shadow border border-white/20 transition-all cursor-pointer z-20"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                {/* <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                /> */}
              </div>

              {/* Profile Details Container (Overlapping) */}
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mt-2 relative z-10">
                  {/* Avatar section */}
                  <div className="relative w-24 h-24 shrink-0 rounded-full bg-white overflow-hidden group border-4 border-white shadow-md">
                    <img
                      src={avatar}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 left-0 w-full h-6 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4 text-white" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoChange}
                    />
                  </div>

                  {/* Title / Role details */}
                  <div className="flex-1 text-center md:text-left min-w-0 pb-1">
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
                      {form.experience[0]?.designation || 'Faculty'} · {form.experience[0]?.functionalArea || 'Department'}
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

            <div className="relative z-10  mb-4">
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
                      {/* Employment Status */}
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <button
                          type="button"
                          disabled={!editing}
                          onClick={() => setEmploymentStatus('FRESHER')}
                          className={`p-5 rounded-xl border text-left transition-all ${!editing ? 'opacity-65 cursor-default' : 'cursor-pointer'} ${employmentStatus === 'FRESHER'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-neutral-200 bg-white'
                            }`}
                        >
                          <h3 className="font-semibold text-lg">Fresher</h3>
                          <p className="text-sm text-neutral-500">
                            Currently studying or recently graduated
                          </p>
                        </button>

                        <button
                          type="button"
                          disabled={!editing}
                          onClick={() => {
                            setEmploymentStatus('EXPERIENCED');

                            if (form.experience.length === 0) {
                              addExperience();
                            }
                          }}
                          className={`p-5 rounded-xl border text-left transition-all ${!editing ? 'opacity-65 cursor-default' : 'cursor-pointer'} ${employmentStatus === 'EXPERIENCED'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-neutral-200 bg-white'
                            }`}
                        >
                          <h3 className="font-semibold text-lg">Experienced</h3>
                          <p className="text-sm text-neutral-500">
                            Currently working or have past experience
                          </p>
                        </button>
                      </div>

                      {/* Experience Form */}
                      {employmentStatus === 'EXPERIENCED' && (
                        <div className="space-y-4">
                          {form.experience.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm animate-fade-in"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="mb-4 block">
                                    <h3 className="text-base font-semibold text-purple-700">
                                      {idx === 0
                                        ? 'Current Organization'
                                        : `Past Organization ${idx}`}
                                    </h3>
                                  </label>
                                  <input
                                    type="text"
                                    value={item.organizationName}
                                    disabled={!editing}
                                    onChange={(e) =>
                                      updateExperience(
                                        idx,
                                        'organizationName',
                                        e.target.value
                                      )
                                    }
                                    className={`w-full h-11 px-3 mt-1 border rounded-lg outline-none transition-all ${!editing
                                      ? 'bg-neutral-50 border-neutral-100 text-neutral-500 cursor-default'
                                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                      }`}
                                    placeholder="Enter organization"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Designation
                                  </label>
                                  <input
                                    type="text"
                                    value={item.designation}
                                    disabled={!editing}
                                    onChange={(e) =>
                                      updateExperience(
                                        idx,
                                        'designation',
                                        e.target.value
                                      )
                                    }
                                    className={`w-full h-11 px-3 border rounded-lg outline-none transition-all ${!editing
                                      ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
                                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                      }`}
                                    placeholder="e.g. Manager"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Functional Area
                                  </label>
                                  <input
                                    type="text"
                                    value={item.functionalArea}
                                    disabled={!editing}
                                    onChange={(e) =>
                                      updateExperience(
                                        idx,
                                        'functionalArea',
                                        e.target.value
                                      )
                                    }
                                    className={`w-full h-11 px-3 border rounded-lg outline-none transition-all ${!editing
                                      ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                      }`}
                                    placeholder="e.g. Sales"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    From
                                  </label>
                                  <input
                                    type="date"
                                    value={item.fromDate}
                                    disabled={!editing}
                                    onChange={(e) =>
                                      updateExperience(idx, 'fromDate', e.target.value)
                                    }
                                    className={`w-full h-11 px-3 border rounded-lg outline-none transition-all ${!editing
                                      ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                      }`}
                                  />
                                </div>

                                {idx > 0 && (
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      To
                                    </label>
                                    <input
                                      type="date"
                                      value={item.toDate}
                                      disabled={!editing}
                                      onChange={(e) =>
                                        updateExperience(idx, 'toDate', e.target.value)
                                      }
                                      className={`w-full h-11 px-3 border rounded-lg outline-none transition-all ${!editing
                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                        }`}
                                    />
                                  </div>
                                )}
                              </div>

                              {editing && form.experience.length > 1 && (
                                <button
                                  type="button"
                                  disabled={!editing}
                                  onClick={() => removeExperience(idx)}
                                  className="mt-4 text-primary text-sm font-medium border border-primary rounded-lg px-4 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all cursor-pointer"
                                >
                                  Remove Experience
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            disabled={!editing}
                            onClick={addExperience}
                            className="px-4 py-2 rounded-lg border border-primary text-primary hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-all"
                          >
                            + Add Another Experience
                          </button>
                        </div>
                      )}
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
          </>
        )
      }

    </div >
  );
}
