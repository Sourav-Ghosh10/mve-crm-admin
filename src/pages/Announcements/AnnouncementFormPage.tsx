import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type Announcement } from "../../types/announcement.types";
import { departmentService } from "../../services/departmentService";
import { locationService } from "../../services/locationService";
import { announcementService } from "../../services/announcementService";
import type { CreateAnnouncementDto } from "../../types/announcement.types";
import { getErrorMessage } from "../../utils/errorHandling";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import BackButton from "../../components/common/BackButton";
import Button from "../../components/common/Button";
import AnnouncementForm from "../../components/Announcements/AnnouncementForm";
import type { Department, OfficeLocation } from "../../types/organization.types";

type AnnouncementFormValues = CreateAnnouncementDto & { 
    publishTime?: string;
    deadlineTime?: string;
};

const AnnouncementFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);
    const [error, setError] = useState<string | string[] | null>(null);
    const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
    const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Fetch announcement data if in edit mode
    useEffect(() => {
        const fetchAnnouncement = async () => {
            if (!id) return;

            try {
                setIsFetching(true);
                const response = await announcementService.getById(id);
                setAnnouncement(response.data);
            } catch (err) {
                setError(getErrorMessage(err, "Failed to fetch announcement"));
            } finally {
                setIsFetching(false);
            }
        };

        if (isEditMode) {
            fetchAnnouncement();
        }
    }, [id, isEditMode]);

    // Fetch departments and locations
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [deptRes, locRes] = await Promise.all([
                    departmentService.getAll({ limit: 100, isActive: true }),
                    locationService.getAll({ limit: 100, isActive: true })
                ]);
                const depts = deptRes.data.map((d: Department) => ({ value: d._id || d.id, label: d.name }));
                const locs = locRes.data.map((l: OfficeLocation) => ({ value: l._id || l.id, label: l.name }));
                setDepartmentOptions(depts);
                setLocationOptions(locs);
            } catch (error) {
                console.error("Failed to fetch form data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const localDateToUTCEndOfDay = (date: string) => {
        const [y, m, d] = date.split('-').map(Number);
        return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
    };

    const normalizeTargetArray = (arr?: string[]) => {
        if (!arr || arr.length === 0) return [];
        if (arr.includes('all')) return [];
        return arr;
    };

    const combineDateAndTimeToUTC = (dateStr: string, timeStr?: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const [h, min] = timeStr ? timeStr.split(':').map(Number) : [0, 0];
        return new Date(y, m - 1, d, h, min, 0, 0).toISOString();
    };

    const onSubmit = async (data: AnnouncementFormValues) => {
        try {
            setIsLoading(true);
            setError(null);

            const { publishTime, deadlineTime, isGlobalEvent, ...restData } = data;

            const departments = normalizeTargetArray(data.targetAudience?.departments);
            const locations = normalizeTargetArray(data.targetAudience?.locations);
            const roles = normalizeTargetArray(data.targetAudience?.roles);

            const normalizedTargetAudience =
                departments.length > 0 || locations.length > 0 || roles.length > 0
                    ? {
                        ...(departments.length > 0 && { departments }),
                        ...(locations.length > 0 && { locations }),
                        ...(roles.length > 0 && { roles }),
                    }
                    : undefined;

            const payload: CreateAnnouncementDto = {
                ...restData,
                isGlobalEvent: !!isGlobalEvent,
                deadlineTime: deadlineTime ? `${deadlineTime}:00` : undefined,

                publishDate: data.publishDate
                    ? combineDateAndTimeToUTC(data.publishDate, publishTime)
                    : undefined,

                expiryDate: data.expiryDate
                    ? localDateToUTCEndOfDay(data.expiryDate)
                    : undefined,

                ...(normalizedTargetAudience
                    ? { targetAudience: normalizedTargetAudience }
                    : {}),

                acknowledgmentRequired: !!data.acknowledgmentRequired,
            };

            if (isEditMode && id) {
                await announcementService.update(id, payload);
            } else {
                await announcementService.create(payload);
            }

            navigate(-1);
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    `Failed to ${isEditMode ? "update" : "create"} announcement`
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    if (isFetching) {
        return <LoadingSpinner fullScreen />;
    }

    if (isEditMode && !announcement && !isFetching) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-2 lg:px-0 mb-12 max-w-4xl">
                <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl p-12 text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Announcement Not Found</h2>
                    <p className="text-foreground-secondary mb-6">The announcement you're looking for doesn't exist.</p>
                    <Button onClick={handleCancel}>Back to Announcements</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-2 lg:px-0 mb-12">
            <div className="space-y-4">
                <BackButton onClick={() => navigate('/announcements')} label="Back to Announcements" className="mb-4" />
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tighter">
                        {isEditMode ? 'Edit Announcement' : 'Create New Announcement'}
                    </h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {isEditMode ? 'Update your announcement details' : 'Share important updates with your team'}
                    </p>
                </div>
            </div>

            <div className="bg-surface rounded-[.5rem] border border-border/40 shadow-xl p-8 md:p-5">
                <AnnouncementForm
                    initialValues={announcement}
                    isEditMode={isEditMode}
                    onSubmit={onSubmit}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                    departmentOptions={departmentOptions}
                    locationOptions={locationOptions}
                    isLoadingOptions={isLoadingData}
                    error={error}
                />
            </div>
        </div>
    );
};

export default AnnouncementFormPage;

