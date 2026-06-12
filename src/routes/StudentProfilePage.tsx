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
    CircleCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import Skeleton from '../components/ui/skeleton';
import { useRef } from 'react';
// import { ImagePlus } from 'lucide-react';

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

export function StudentProfilePage() {
    const { user: authUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'security' | 'notifications'>('personal');
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [draft, setDraft] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [employmentStatus, setEmploymentStatus] = useState<'FRESHER' | 'EXPERIENCED'>('FRESHER');
    // const [bannerImage, setBannerImage] = useState('');
    // const bannerInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        firstName: '',
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
        parentGuardianName: '',
        relationship: '',
        specifyRelationship: '',
        parentGuardianPhoneNumber: '',
        parentGuardianEmailId: '',
        nationality: '',
        state: '',
        city: '',
        pinCode: '',
        completeAddress: '',
        class10YearOfPassing: '',
        class10GradeType: '',
        class10Score: '',
        class10MediumOfInstruction: '',
        class12YearOfPassing: '',
        class12GradeType: '',
        class12Score: '',
        class12MediumOfInstruction: '',
        ugStatus: '',
        ugGradeType: '',
        ugScore: '',
        ugInstitutionName: '',
        ugMediumOfInstruction: '',
        hasHigherQualification: false,
        higherQualification: '',
        hqType: '',
        hqSpecify: '',
        hqInstitute: '',
    });

    // ── Fetch Profile ────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['student-profile'],
        queryFn: () => apiFetch('/student-profile/me'),
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
                fromDate: exp.fromDate
                    ? exp.fromDate.split('T')[0]
                    : '',
                toDate: exp.toDate
                    ? exp.toDate.split('T')[0]
                    : '',
            }));
        } else if (Array.isArray(data.profile?.experience)) {
            parsedExperience = data.profile.experience;
        } else {
            try {
                if (data.profile?.experienceDescription) {
                    parsedExperience = JSON.parse(data.profile.experienceDescription);
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

        let hqType = '';
        let hqSpecify = '';
        let hqInstitute = '';
        const hqRaw = data.profile?.higherQualification ?? '';
        if (hqRaw) {
            try {
                const parsed = JSON.parse(hqRaw);
                hqType = parsed.qualification || '';
                hqSpecify = parsed.specifyOthers || '';
                hqInstitute = parsed.instituteName || '';
            } catch (e) {
                // Fallback if not JSON (legacy text data)
                hqType = 'Others';
                hqSpecify = hqRaw;
            }
        }

        setForm({
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
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
            parentGuardianName: data.profile?.parentGuardianName ?? '',
            relationship: data.profile?.relationship ?? '',
            specifyRelationship: data.profile?.specifyRelationship ?? '',
            parentGuardianPhoneNumber: data.profile?.parentGuardianPhoneNumber ?? '',
            parentGuardianEmailId: data.profile?.parentGuardianEmailId ?? '',
            nationality: data.profile?.nationality ?? '',
            state: data.profile?.state ?? '',
            city: data.profile?.city ?? '',
            pinCode: data.profile?.pinCode ?? '',
            completeAddress: data.profile?.completeAddress ?? '',
            class10YearOfPassing: data.profile?.class10YearOfPassing ?? '',
            class10GradeType: data.profile?.class10GradeType ?? '',
            class10Score: data.profile?.class10Score ?? '',
            class10MediumOfInstruction: data.profile?.class10MediumOfInstruction ?? '',
            class12YearOfPassing: data.profile?.class12YearOfPassing ?? '',
            class12GradeType: data.profile?.class12GradeType ?? '',
            class12Score: data.profile?.class12Score ?? '',
            class12MediumOfInstruction: data.profile?.class12MediumOfInstruction ?? '',
            ugStatus: data.profile?.ugStatus ?? '',
            ugGradeType: data.profile?.ugGradeType ?? '',
            ugScore: data.profile?.ugScore ?? '',
            ugInstitutionName: data.profile?.ugInstitutionName ?? '',
            ugMediumOfInstruction: data.profile?.ugMediumOfInstruction ?? '',
            hasHigherQualification: data.profile?.hasHigherQualification ?? false,
            higherQualification: hqRaw,
            hqType,
            hqSpecify,
            hqInstitute,
        });

        const hasRealExperiences = parsedExperience.length > 0;

        if (hasRealExperiences) {
            setEmploymentStatus('EXPERIENCED');
        } else {
            setEmploymentStatus('FRESHER');
        }

        console.log("experiences", data.profile?.experiences);
        console.log("parsedExperience", parsedExperience);
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

            // Update modified student profile fields
            const profilePayload: any = {};

            const isFresher = employmentStatus === 'FRESHER';

            if (isFresher !== data.profile?.isFresher) {
                profilePayload.isFresher = isFresher;
            }

            const profileFields = [
                'gender',
                'profilePhotoUrl',
                'personalEmail',
                'mobileNumber',
                'alternateMobileNumber',
                'emergencyContactName',
                'emergencyContactNumber',
                'currentAddress',
                'permanentAddress',
                'parentGuardianName',
                'relationship',
                'specifyRelationship',
                'parentGuardianPhoneNumber',
                'parentGuardianEmailId',
                'nationality',
                'state',
                'city',
                'pinCode',
                'completeAddress',
                'class10YearOfPassing',
                'class10GradeType',
                'class10Score',
                'class10MediumOfInstruction',
                'class12YearOfPassing',
                'class12GradeType',
                'class12Score',
                'class12MediumOfInstruction',
                'ugStatus',
                'ugGradeType',
                'ugScore',
                'ugInstitutionName',
                'ugMediumOfInstruction',
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

            // Check hasHigherQualification
            const originalHasHigher = data.profile?.hasHigherQualification ?? false;
            if (form.hasHigherQualification !== originalHasHigher) {
                profilePayload.hasHigherQualification = form.hasHigherQualification;
            }

            // Check higherQualification JSON changes
            let computedHigherQual = '';
            if (form.hasHigherQualification) {
                const hqData = {
                    qualification: form.hqType,
                    specifyOthers: form.hqType === 'Others' ? form.hqSpecify : '',
                    instituteName: form.hqInstitute,
                };
                computedHigherQual = JSON.stringify(hqData);
            }
            const originalHigherQual = data.profile?.higherQualification ?? '';
            if (computedHigherQual !== originalHigherQual) {
                profilePayload.higherQualification = computedHigherQual === '' ? null : computedHigherQual;
            }

            // Check experience
            let originalExperience: ExperienceItem[] = [];
            if (Array.isArray(data.profile?.experiences)) {
                originalExperience = data.profile.experiences;
            } else if (Array.isArray(data.profile?.experience)) {
                originalExperience = data.profile.experience;
            } else {
                try {
                    if (data.profile?.experienceDescription) {
                        originalExperience = JSON.parse(data.profile.experienceDescription);
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
                await apiFetch('/student-profile/me', {
                    method: 'PATCH',
                    body: JSON.stringify(profilePayload),
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-profile'] });
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

    const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ');
    const avatar =
        form.profilePhotoUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.firstName}_${form.lastName}`;

    const uploadPhotoMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();

            formData.append('profilePhoto', file);

            return apiFetch('/student-profile/me', {
                method: 'PATCH',
                body: formData,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['student-profile'],
            });
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

    // const handleBannerChange = (
    //     e: React.ChangeEvent<HTMLInputElement>
    // ) => {
    //     const file = e.target.files?.[0];

    //     if (!file) return;

    //     const previewUrl = URL.createObjectURL(file);

    //     setBannerImage(previewUrl);

    // };

    return (
        <div className="max-w-6xl mx-auto px-4 font-sans">
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

            {isLoading ? (
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-6">
                        <CardContent className="px-6 py-6">
                            <div className="flex flex-col md:flex-row overflow-hidden items-center md:items-start gap-6">
                                {/* Avatar section */}
                                <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group border-2 border-white shadow-md">
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
                                <div className="flex-1 text-center md:text-left min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                                        <h1 className="text-xl font-bold text-neutral-900 truncate">{fullName || 'Student Profile'}</h1>
                                        <div className="flex gap-2 justify-center md:justify-start shrink-0">
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-100 text-purple-700 bg-purple-50">
                                                Verified
                                            </span>
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                                Student
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-neutral-500 mb-3">
                                        {form.experience[0]?.designation || 'Student'} · {form.experience[0]?.organizationName || 'Department'}
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
                                                <Calendar className="h-3.5 w-3.5" style={{ color: 'rgb(88, 5, 85)' }} /> Joined {form.dateOfJoining}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mb-4">
                        <Tabs
                            activeTab={activeTab}
                            onChange={(id: any) => setActiveTab(id)}
                            tabs={[
                                { id: 'personal', label: 'Personal', icon: <User className="h-4 w-4" /> },
                                { id: 'account', label: 'Account', icon: <Mail className="h-4 w-4" /> },
                                { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
                                { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
                                { id: 'attendance', label: 'Attendance', icon: <CircleCheck className="h-4 w-4" /> },
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Gender</label>
                                                {!editing ? (
                                                    <input
                                                        type="text"
                                                        value={form.gender || ''}
                                                        disabled={true}
                                                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                                                    />
                                                ) : (
                                                    <select
                                                        name="gender"
                                                        value={form.gender}
                                                        onChange={handleChange}
                                                        className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 appearance-none w-full cursor-pointer"
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
                                                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-555 text-sm font-medium outline-none cursor-default"
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
                                                        disabled={true}
                                                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-555 text-sm font-medium outline-none cursor-default"
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
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nationality</label>
                                                <input
                                                    type="text"
                                                    name="nationality"
                                                    value={form.nationality}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Official Email Address</label>
                                                <input
                                                    type="email"
                                                    value={data?.email ?? ''}
                                                    disabled={true}
                                                    className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default"
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Parent/Guardian Name</label>
                                                <input
                                                    type="text"
                                                    name="parentGuardianName"
                                                    value={form.parentGuardianName}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Relationship</label>
                                                {!editing ? (
                                                    <input
                                                        type="text"
                                                        value={form.relationship || ''}
                                                        disabled={true}
                                                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                                                    />
                                                ) : (
                                                    <select
                                                        name="relationship"
                                                        value={form.relationship}
                                                        onChange={handleChange}
                                                        className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 appearance-none w-full cursor-pointer"
                                                    >
                                                        <option value="">Select Relationship</option>
                                                        <option value="FATHER">Father</option>
                                                        <option value="MOTHER">Mother</option>
                                                        <option value="GUARDIAN">Guardian</option>
                                                        <option value="OTHER">Other</option>
                                                    </select>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Specify Relationship (if Other)</label>
                                                <input
                                                    type="text"
                                                    name="specifyRelationship"
                                                    value={form.specifyRelationship}
                                                    onChange={handleChange}
                                                    disabled={!editing || form.relationship !== 'OTHER'}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing || form.relationship !== 'OTHER'
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Parent/Guardian Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="parentGuardianPhoneNumber"
                                                    value={form.parentGuardianPhoneNumber}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Parent/Guardian Email ID</label>
                                                <input
                                                    type="email"
                                                    name="parentGuardianEmailId"
                                                    value={form.parentGuardianEmailId}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">City</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={form.city}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">State</label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={form.state}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pin Code</label>
                                                <input
                                                    type="text"
                                                    name="pinCode"
                                                    value={form.pinCode}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Complete Address</label>
                                                <textarea
                                                    rows={2}
                                                    name="completeAddress"
                                                    value={form.completeAddress}
                                                    onChange={handleChange}
                                                    disabled={!editing}
                                                    className={`h-10 px-3 pt-2 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
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
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
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
                                                    className={`h-10 px-3 pt-2 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>




                                {/* Academic History / Education Details */}
                                <Card className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-neutral-100">
                                        <h2 className="text-base font-bold text-neutral-800">Academic History</h2>
                                        <p className="text-xs text-neutral-450 mt-0.5">Your past academic qualifications and scores.</p>
                                    </div>
                                    <CardContent className="p-6 space-y-6">
                                        {/* Class 10 Details */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-1">Class 10th / Secondary</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Year of Passing</label>
                                                    <input
                                                        type="text"
                                                        name="class10YearOfPassing"
                                                        value={form.class10YearOfPassing}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Grade Type</label>
                                                    {!editing ? (
                                                        <input
                                                            type="text"
                                                            value={form.class10GradeType || ''}
                                                            disabled={true}
                                                            className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                                                        />
                                                    ) : (
                                                        <select
                                                            name="class10GradeType"
                                                            value={form.class10GradeType}
                                                            onChange={handleChange}
                                                            className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 appearance-none w-full cursor-pointer"
                                                        >
                                                            <option value="">Select Grade Type</option>
                                                            <option value="PERCENTAGE">Percentage</option>
                                                            <option value="CGPA">CGPA</option>
                                                            <option value="GPA">GPA</option>
                                                        </select>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Score</label>
                                                    <input
                                                        type="text"
                                                        name="class10Score"
                                                        value={form.class10Score}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Medium of Instruction</label>
                                                    <input
                                                        type="text"
                                                        name="class10MediumOfInstruction"
                                                        value={form.class10MediumOfInstruction}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Class 12 Details */}
                                        <div className="space-y-3 pt-4 border-t border-neutral-100">
                                            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-1">Class 12th / Senior Secondary</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Year of Passing</label>
                                                    <input
                                                        type="text"
                                                        name="class12YearOfPassing"
                                                        value={form.class12YearOfPassing}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Grade Type</label>
                                                    {!editing ? (
                                                        <input
                                                            type="text"
                                                            value={form.class12GradeType || ''}
                                                            disabled={true}
                                                            className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-555 text-sm font-medium outline-none cursor-default appearance-none"
                                                        />
                                                    ) : (
                                                        <select
                                                            name="class12GradeType"
                                                            value={form.class12GradeType}
                                                            onChange={handleChange}
                                                            className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 appearance-none w-full cursor-pointer"
                                                        >
                                                            <option value="">Select Grade Type</option>
                                                            <option value="PERCENTAGE">Percentage</option>
                                                            <option value="CGPA">CGPA</option>
                                                            <option value="GPA">GPA</option>
                                                        </select>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Score</label>
                                                    <input
                                                        type="text"
                                                        name="class12Score"
                                                        value={form.class12Score}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Medium of Instruction</label>
                                                    <input
                                                        type="text"
                                                        name="class12MediumOfInstruction"
                                                        value={form.class12MediumOfInstruction}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* UG Details */}
                                        <div className="space-y-3 pt-4 border-t border-neutral-100">
                                            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-100 pb-1">Undergraduate (UG) Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Institution Name</label>
                                                    <input
                                                        type="text"
                                                        name="ugInstitutionName"
                                                        value={form.ugInstitutionName}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">UG Status</label>
                                                    {!editing ? (
                                                        <input
                                                            type="text"
                                                            value={form.ugStatus || ''}
                                                            disabled={true}
                                                            className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                                                        />
                                                    ) : (
                                                        <select
                                                            name="ugStatus"
                                                            value={form.ugStatus}
                                                            onChange={handleChange}
                                                            className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 appearance-none w-full cursor-pointer"
                                                        >
                                                            <option value="">Select Status</option>
                                                            <option value="PURSUING">Pursuing</option>
                                                            <option value="COMPLETED">Completed</option>
                                                            <option value="DISCONTINUED">Discontinued</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Grade Type</label>
                                                {!editing ? (
                                                    <input
                                                        type="text"
                                                        value={form.ugGradeType || ''}
                                                        disabled={true}
                                                        className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default appearance-none"
                                                    />
                                                ) : (
                                                    <select
                                                        name="ugGradeType"
                                                        value={form.ugGradeType}
                                                        onChange={handleChange}
                                                        className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 appearance-none w-full cursor-pointer"
                                                    >
                                                        <option value="">Select Grade Type</option>
                                                        <option value="PERCENTAGE">Percentage</option>
                                                        <option value="CGPA">CGPA</option>
                                                        <option value="GPA">GPA</option>
                                                    </select>
                                                )}

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Score</label>
                                                    <input
                                                        type="text"
                                                        name="ugScore"
                                                        value={form.ugScore}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Medium of Instruction</label>
                                                    <input
                                                        type="text"
                                                        name="ugMediumOfInstruction"
                                                        value={form.ugMediumOfInstruction}
                                                        onChange={handleChange}
                                                        disabled={!editing}
                                                        className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Higher Qualification */}
                                        <div className="space-y-3 pt-4 border-t border-neutral-100">
                                            <div className="flex items-center gap-3">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="hasHigherQualification"
                                                        checked={form.hasHigherQualification}
                                                        onChange={(e) => {
                                                            if (editing) {
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    hasHigherQualification: e.target.checked,
                                                                }));
                                                            }
                                                        }}
                                                        disabled={!editing}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800" style={{ backgroundColor: form.hasHigherQualification ? 'rgb(88, 5, 85)' : '#e5e5e5' }} />
                                                </label>
                                                <span className="text-sm font-semibold text-neutral-800">Has Higher Qualification</span>
                                            </div>

                                            {form.hasHigherQualification && (
                                                <div className="space-y-4 mt-3 p-4 bg-neutral-50/50 rounded-xl border border-neutral-100/80 animate-fade-in">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Dropdown / Selection */}
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qualification</label>
                                                            {!editing ? (
                                                                <input
                                                                    type="text"
                                                                    value={form.hqType || ''}
                                                                    disabled={true}
                                                                    className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-550 text-sm font-medium outline-none cursor-default w-full"
                                                                />
                                                            ) : (
                                                                <select
                                                                    name="hqType"
                                                                    value={form.hqType}
                                                                    onChange={handleChange}
                                                                    className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 w-full cursor-pointer"
                                                                >
                                                                    <option value="">Select Qualification</option>
                                                                    <option value="M.COM">M.COM</option>
                                                                    <option value="MBA">MBA</option>
                                                                    <option value="PGDM">PGDM</option>
                                                                    <option value="PGDCA">PGDCA</option>
                                                                    <option value="Others">Others</option>
                                                                </select>
                                                            )}
                                                        </div>

                                                        {/* Specify Input (conditional) */}
                                                        {form.hqType === 'Others' && (
                                                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Please Specify</label>
                                                                <input
                                                                    type="text"
                                                                    name="hqSpecify"
                                                                    value={form.hqSpecify}
                                                                    onChange={handleChange}
                                                                    disabled={!editing}
                                                                    placeholder="e.g. M.Sc. Computer Science"
                                                                    className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                                        : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                                        }`}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Institute Name */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Institute Name</label>
                                                        <input
                                                            type="text"
                                                            name="hqInstitute"
                                                            value={form.hqInstitute}
                                                            onChange={handleChange}
                                                            disabled={!editing}
                                                            placeholder="Enter institute name"
                                                            className={`h-10 px-3 rounded-lg border text-sm font-medium transition-all outline-none ${!editing
                                                                ? 'bg-neutral-50 border-neutral-100 text-neutral-555 cursor-default'
                                                                : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
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
                                                        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                            <div>
                                                                <label className="mb-4">
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
                                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
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
                                                                        ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
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
                                                                            ? 'bg-neutral-50 border-neutral-100 text-neutral-550 cursor-default'
                                                                            : 'bg-white border-neutral-200 text-neutral-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                                                                            }`}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {
                                                            form.experience.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    disabled={!editing}
                                                                    onClick={() => removeExperience(idx)}
                                                                    className="mt-4 text-primary text-sm font-medium border border-primary rounded-lg px-4 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Remove Experience
                                                                </button>
                                                            )
                                                        }
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    disabled={!editing}
                                                    onClick={addExperience}
                                                    className="px-4 py-2 rounded-lg border border-primary text-primary hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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