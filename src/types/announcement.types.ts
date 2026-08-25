export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'critical';
export type AnnouncementCategory = 'general' | 'policy' | 'event' | 'holiday' | 'other';

export interface Viewer {
    userId: {
        personalInfo: {
            firstName: string;
            lastName: string;
            profilePicture?: string;
        };
        fullName: string;
        id: string;
    };
    name: string;
    profilePicture?: string;
    viewedAt: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    category: AnnouncementCategory;
    isRead: boolean;
    isAcknowledged: boolean;
    requiresAcknowledgement: boolean;
    acknowledgmentRequired?: boolean; // Form field alias for requiresAcknowledgement
    authorId: string;
    authorName?: string;
    authorProfilePicture?: string;
    publishedBy?: {
        name: string;
        profilePicture?: string;
    };
    targetDepartments?: string[];
    targetLocations?: string[];
    targetRoles?: string[];
    targetAudience?: {
        roles?: string[];
        departments?: string[];
        locations?: string[];
        specificUsers?: string[];
    };
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    readByCount?: number;
    acknowledgedByCount?: number;
    viewCount?: number;
    acknowledgmentCount?: number;
    viewers?: Viewer[];
    expiryDate?: string;
    publishDate?: string;
    deadlineTime?: string;
    isGlobalEvent?: boolean;
}

export interface CreateAnnouncementDto {
    title: string;
    content: string;
    priority: AnnouncementPriority;
    category: AnnouncementCategory;
    acknowledgmentRequired: boolean;
    expiryDate?: string;
    expiresAt?: string;
    publishDate?: string;
    isRecurring?: boolean;
    recurringSchedule?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        daysOfWeek?: number[];
        dayOfMonth?: number;
    };
    targetAudience?: {
        roles?: string[];
        departments?: string[];
        locations?: string[];
        specificUsers?: string[];
    };
    attachments?: {
        fileUrl: string;
        fileName: string;
        fileType: string;
    }[];
    status?: 'draft' | 'published' | 'archived';
    deadlineTime?: string;
    isGlobalEvent?: boolean;
}

export interface AnnouncementFilters {
    page?: number;
    limit?: number;
    priority?: AnnouncementPriority;
    category?: AnnouncementCategory;
    isRead?: boolean;
    isAcknowledged?: boolean;
    search?: string;
}

export interface AnnouncementListResponse {
    success: boolean;
    data: Announcement[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}
