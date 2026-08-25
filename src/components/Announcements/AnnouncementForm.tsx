import React, { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Megaphone, AlertTriangle, Tag, Calendar as CalendarIcon } from "lucide-react";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import TextArea from "../../components/common/Input/TextArea";
import FormSelect from "../../components/common/Select/FormSelect";
import MultiSelectSearch from "../../components/common/Search/MultiSelectSearch";
import FormError from "../../components/common/FormError/FormError";
// import LoadingSpinner from "../../components/common/LoadingSpinner";
import { cn } from "../../lib/utils";

import type {
    CreateAnnouncementDto,
    AnnouncementPriority,
    AnnouncementCategory,
    Announcement
} from "../../types/announcement.types";

interface AnnouncementFormProps {
    initialValues?: Partial<Announcement> | null;
    isEditMode: boolean;
    onSubmit: (data: CreateAnnouncementDto) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
    departmentOptions: { value: string; label: string }[];
    locationOptions: { value: string; label: string }[];
    isLoadingOptions: boolean;
    error: string | string[] | null;
}

const schema = yup.object({
    title: yup.string().required("Title is required").trim().max(150, "Title cannot exceed 150 characters"),
    content: yup.string().required("Content is required").trim().max(2000, "Content cannot exceed 2000 characters"),
    priority: yup.string().oneOf(['low', 'medium', 'high', 'critical']).required("Priority is required"),
    category: yup.string().oneOf(['general', 'policy', 'event', 'holiday', 'other', 'alert']).required("Category is required"),
    acknowledgmentRequired: yup.boolean().default(false),
    expiryDate: yup.string().required("End Date is required"),
    targetAudience: yup.object().shape({
        departments: yup.array().of(yup.string()).optional(),
        locations: yup.array().of(yup.string()).optional(),
        roles: yup.array().of(yup.string()).optional(),
    }).optional(),
    publishDate: yup.string().required("Start Date is required"),
    publishTime: yup.string().optional(),
    status: yup.string().oneOf(['draft', 'published', 'archived']).default('published'),
    isGlobalEvent: yup.boolean().default(false),
    deadlineTime: yup.string().nullable().optional(),
});

const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Using local date components to respect the user's system timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return "";
    }
};

const formatTimeForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return "";
    }
};

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
    initialValues,
    isEditMode,
    onSubmit,
    onCancel,
    isLoading,
    departmentOptions,
    locationOptions,
    isLoadingOptions,
    error
}) => {
    const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateAnnouncementDto & { isGlobalEvent?: boolean; deadlineTime?: string; publishTime?: string }>({
        resolver: yupResolver(schema) as unknown as Resolver<CreateAnnouncementDto & { isGlobalEvent?: boolean; deadlineTime?: string; publishTime?: string }>,
        defaultValues: {
            title: "",
            content: "",
            priority: 'medium',
            category: 'general',
            acknowledgmentRequired: false,
            publishDate: "",
            publishTime: "",
            expiryDate: "",
            status: 'published',
            isGlobalEvent: false,
            deadlineTime: "",
            targetAudience: {
                departments: ['all'],
                locations: ['all'],
                roles: ['all'],
            },
        },
    });

    useEffect(() => {
        if (initialValues) {
            const getTargetValues = (primary?: string[], secondary?: string[]) => {
                if (primary && primary.length > 0) return primary;
                if (secondary && secondary.length > 0) return secondary;
                return ['all'];
            };

            reset({
                title: initialValues.title || '',
                content: initialValues.content || '',
                priority: (initialValues.priority as AnnouncementPriority) || 'medium',
                category: (initialValues.category as AnnouncementCategory) || 'general',
                acknowledgmentRequired: initialValues.acknowledgmentRequired || initialValues.requiresAcknowledgement || false,
                publishDate: formatDateForInput(initialValues.publishDate),
                publishTime: formatTimeForInput(initialValues.publishDate),
                expiryDate: formatDateForInput((initialValues.expiryDate as string) || initialValues.expiresAt),
                status: 'published',
                isGlobalEvent: initialValues.isGlobalEvent || false,
                deadlineTime: initialValues.deadlineTime || "",
                targetAudience: {
                    departments: getTargetValues(initialValues.targetAudience?.departments, initialValues.targetDepartments),
                    locations: getTargetValues(initialValues.targetAudience?.locations, initialValues.targetLocations),
                    roles: getTargetValues(initialValues.targetAudience?.roles, initialValues.targetRoles),
                }
            });
        }
    }, [initialValues, reset]);

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
    ];

    const categoryOptions = [
        { value: 'general', label: 'General' },
        { value: 'policy', label: 'Policy' },
        { value: 'event', label: 'Event' },
        { value: 'holiday', label: 'Holiday' },
        { value: 'other', label: 'Other' },
        { value: 'alert', label: 'Alert' },
    ];

    const roleOptions = [
        { value: 'admin', label: 'Admin' },
        { value: 'hr', label: 'HR' },
        { value: 'manager', label: 'Manager' },
        { value: 'employee', label: 'Employee' },
    ];

    return (
        <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormError message={error} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                {/* Column 1: Config & Schedule (Span 3) */}
                <div className="xl:col-span-3">
                    <div className="bg-surface/40 backdrop-blur-sm p-5 rounded-3xl border border-border/40 shadow-sm space-y-4 hover:border-border/60 transition-all">
                        <div className="flex items-center gap-2.5 mb-1 px-1">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h3 className="text-[11px] font-bold text-foreground/80 uppercase tracking-[0.15em]">Configuration</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        {...field}
                                        label="Priority"
                                        required
                                        options={priorityOptions}
                                        error={!!errors.priority}
                                        helperText={errors.priority?.message}
                                        startIcon={<AlertTriangle className="w-4 h-4" />}
                                    />
                                )}
                            />

                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        {...field}
                                        label="Category"
                                        required
                                        options={categoryOptions}
                                        error={!!errors.category}
                                        helperText={errors.category?.message}
                                        startIcon={<Tag className="w-4 h-4" />}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/20">
                            <div className="grid grid-cols-2 gap-3 items-start">
                                <Controller
                                    name="publishDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="date"
                                            label="Start Date"
                                            required
                                            error={!!errors.publishDate}
                                            helperText={errors.publishDate?.message}
                                            className="bg-primary/5 focus:bg-white h-[42px] px-3.5"
                                        />
                                    )}
                                />
                                <Controller
                                    name="publishTime"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="time"
                                            label="Start Time"
                                            error={!!errors.publishTime}
                                            helperText={errors.publishTime?.message}
                                            className="bg-surface/30 border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all text-xs h-[42px] px-3.5"
                                        />
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-start">
                                <Controller
                                    name="expiryDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="date"
                                            label="End Date"
                                            required
                                            error={!!errors.expiryDate}
                                            helperText={errors.expiryDate?.message}
                                            className="bg-primary/5 focus:bg-white h-[42px] px-3.5"
                                        />
                                    )}
                                />
                                <Controller
                                    name="deadlineTime"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="time"
                                            label="End Time"
                                            placeholder="HH:mm"
                                            error={!!errors.deadlineTime}
                                            helperText={errors.deadlineTime?.message}
                                            className="bg-surface/30 border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all text-xs h-[42px] px-3.5"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-4 border-t border-border/20">
                            <Controller
                                name="isGlobalEvent"
                                control={control}
                                render={({ field }) => (
                                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface/30 border border-border/40 cursor-pointer group hover:border-primary/30 transition-all hover:bg-surface/50 shadow-sm">
                                        <div className="flex flex-col text-left">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest transition-colors",
                                                field.value ? "text-primary" : "text-foreground-tertiary/80"
                                            )}>
                                                Global Event
                                            </span>
                                            <span className="text-[8px] text-foreground-tertiary/60 font-medium">Auto-convert to UTC</span>
                                        </div>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={field.value} onChange={field.onChange} />
                                            <div className={cn(
                                                "w-8 h-4 bg-muted rounded-full transition-all border border-border/60",
                                                field.value && "bg-primary/10 border-primary/40"
                                            )} />
                                            <div className={cn(
                                                "absolute left-0.5 top-0.5 w-3 h-3 bg-foreground-tertiary/40 rounded-full transition-all duration-300",
                                                field.value && "translate-x-4 bg-primary shadow-sm shadow-primary/40"
                                            )} />
                                        </div>
                                    </label>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Column 2: Main Content (Span 6) */}
                <div className="xl:col-span-6">
                    <div className="bg-surface/40 backdrop-blur-sm p-6 rounded-3xl border border-border/40 shadow-md space-y-5 hover:border-border/60 transition-all">
                        <div className="flex items-center gap-2.5 mb-1 px-1">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Megaphone className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h3 className="text-[11px] font-bold text-foreground/80 uppercase tracking-[0.15em]">Announcement Content</h3>
                        </div>

                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Announcement Title"
                                    required
                                    placeholder="e.g. Quarterly Team Sync Up"
                                    error={!!errors.title}
                                    helperText={errors.title?.message}
                                    startAdornment={<Megaphone className="w-4 h-4" />}
                                    className="bg-primary/5 focus:bg-white"
                                    maxLength={150}
                                />
                            )}
                        />

                        <Controller
                            name="content"
                            control={control}
                            render={({ field }) => (
                                <TextArea
                                    {...field}
                                    label="Content"
                                    required
                                    rows={6}
                                    placeholder="Detail the announcement messaging..."
                                    error={!!errors.content}
                                    helperText={errors.content?.message}
                                    maxLength={2000}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Column 3: Targeting (Span 3) */}
                <div className="xl:col-span-3">
                    <div className="bg-surface/40 backdrop-blur-sm p-5 rounded-3xl border border-border/40 shadow-sm space-y-4 hover:border-border/60 transition-all">
                        <div className="flex items-center gap-2.5 mb-1 px-1">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Tag className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h3 className="text-[11px] font-bold text-foreground/80 uppercase tracking-[0.15em]">Target Audience</h3>
                        </div>

                        <Controller
                            name="targetAudience.departments"
                            control={control}
                            render={({ field }) => (
                                <MultiSelectSearch
                                    label="Departments"
                                    options={departmentOptions}
                                    selectedValues={field.value || []}
                                    onSelectionChange={(vals) => field.onChange(vals)}
                                    placeholder="All Departments"
                                    isLoading={isLoadingOptions}
                                    allowAll={true}
                                    allowSearch={true}
                                    error={!!errors.targetAudience?.departments}
                                    helperText={errors.targetAudience?.departments?.message}
                                />
                            )}
                        />

                        <Controller
                            name="targetAudience.locations"
                            control={control}
                            render={({ field }) => (
                                <MultiSelectSearch
                                    label="Locations"
                                    options={locationOptions}
                                    selectedValues={field.value || []}
                                    onSelectionChange={(vals) => field.onChange(vals)}
                                    placeholder="All Locations"
                                    isLoading={isLoadingOptions}
                                    allowAll={true}
                                    allowSearch={true}
                                    error={!!errors.targetAudience?.locations}
                                    helperText={errors.targetAudience?.locations?.message}
                                />
                            )}
                        />

                        <Controller
                            name="targetAudience.roles"
                            control={control}
                            render={({ field }) => (
                                <MultiSelectSearch
                                    label="Roles"
                                    options={roleOptions}
                                    selectedValues={field.value || []}
                                    onSelectionChange={(vals) => field.onChange(vals)}
                                    placeholder="All Roles"
                                    allowAll={true}
                                    allowSearch={true}
                                    error={!!errors.targetAudience?.roles}
                                    helperText={errors.targetAudience?.roles?.message}
                                />
                            )}
                        />

                        <div className="pt-2">
                            <Controller
                                name="acknowledgmentRequired"
                                control={control}
                                render={({ field }) => (
                                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface/30 border border-border/40 cursor-pointer group hover:border-primary/30 transition-all hover:bg-surface/50 shadow-sm">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest transition-colors",
                                            field.value ? "text-primary" : "text-foreground-tertiary/80"
                                        )}>
                                            Requires Ack
                                        </span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={field.value} onChange={field.onChange} />
                                            <div className={cn(
                                                "w-8 h-4 bg-muted rounded-full transition-all border border-border/60",
                                                field.value && "bg-primary/10 border-primary/40"
                                            )} />
                                            <div className={cn(
                                                "absolute left-0.5 top-0.5 w-3 h-3 bg-foreground-tertiary/40 rounded-full transition-all duration-300",
                                                field.value && "translate-x-4 bg-primary shadow-sm shadow-primary/40"
                                            )} />
                                        </div>
                                    </label>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 pt-4 border-t border-border/10">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    type="button"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isEditMode ? "Update Announcement" : "Publish Announcement"}
                </Button>
            </div>
        </form >
    );
};

export default AnnouncementForm;
