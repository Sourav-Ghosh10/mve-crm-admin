import api from './api';
import type {
    Announcement,
    AnnouncementFilters,
    AnnouncementListResponse,
    CreateAnnouncementDto
} from '../types/announcement.types';

// Helper to normalize MongoDB Extended JSON (e.g. { $oid: '...' } or { $date: '...' })
const normalizeValue = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;

    // Handle $oid
    if (typeof value === 'object' && value !== null && '$oid' in value) {
        return (value as { $oid: string }).$oid;
    }

    // Handle $date
    if (typeof value === 'object' && value !== null && '$date' in value) {
        return (value as { $date: string }).$date;
    }

    // Recurse into arrays
    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }

    // Recurse into objects
    if (typeof value === 'object') {
        const normalized: Record<string, unknown> = {};
        const valObj = value as Record<string, unknown>;
        for (const key in valObj) {
            if (Object.prototype.hasOwnProperty.call(valObj, key)) {
                normalized[key] = normalizeValue(valObj[key]);
            }
        }
        return normalized;
    }

    return value;
};

// Helper to normalize announcement data
const mapAnnouncement = (ann: Record<string, unknown>): Announcement => {
    if (!ann) return ann as unknown as Announcement;

    const normalized = normalizeValue(ann) as Record<string, unknown>;
    const idValue = (normalized._id || normalized.id || "") as string;

    return {
        ...normalized,
        id: idValue,
        // Map API specific fields to Frontend Types
        requiresAcknowledgement: normalized.acknowledgmentRequired ?? normalized.requiresAcknowledgement ?? false,
        authorName: (normalized.publishedBy as { name?: string })?.name ?? normalized.authorName ?? "Unknown",
        authorProfilePicture: (normalized.publishedBy as { profilePicture?: string })?.profilePicture ?? normalized.authorProfilePicture,
        publishedBy: normalized.publishedBy as { name: string; profilePicture?: string },
        readByCount: normalized.viewCount as number ?? 0,
        acknowledgedByCount: normalized.acknowledgmentCount as number ?? 0,
        createdAt: (normalized.createdAt || new Date().toISOString()) as string,
        updatedAt: (normalized.updatedAt || new Date().toISOString()) as string,
        isRead: normalized.isRead ?? false,
        isAcknowledged: normalized.isAcknowledged ?? false,
        expiresAt: (normalized.expiryDate ?? normalized.expiresAt) as string | undefined,
        publishDate: normalized.publishDate as string | undefined,
    } as Announcement;
};

export const announcementService = {
    getAll: async (filters: AnnouncementFilters = {}): Promise<AnnouncementListResponse> => {
        const response = await api.get('/announcements', { params: filters });
        const root = response.data;

        // Extract data and pagination from various possible structures
        let data: Record<string, unknown>[] = [];
        let pagination = { total: 0, page: 1, limit: 10, pages: 1 };

        if (root) {
            // Case 1: root.data.announcements (The format provided by user)
            if (root.data && root.data.announcements && Array.isArray(root.data.announcements)) {
                data = root.data.announcements;
                if (root.data.pagination) {
                    pagination = {
                        total: root.data.pagination.totalRecords,
                        page: root.data.pagination.currentPage,
                        limit: root.data.pagination.limit,
                        pages: root.data.pagination.totalPages
                    };
                }
            }
            // Case 2: root is standard wrapper { success, data, pagination }
            else if (root.data && Array.isArray(root.data)) {
                data = root.data;
                pagination = root.pagination || pagination;
            }
            // Case 3: root is double nested { success, data: { data: [], pagination } }
            else if (root.data && root.data.data && Array.isArray(root.data.data)) {
                data = root.data.data;
                pagination = root.data.pagination || pagination;
            }
            // Case 4: root is the array itself
            else if (Array.isArray(root)) {
                data = root;
                pagination.total = root.length;
            }
        }

        return {
            success: root?.success ?? true,
            data: data.map(item => mapAnnouncement(item as Record<string, unknown>)),
            pagination: {
                total: pagination.total || data.length,
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                pages: pagination.pages || (pagination as { totalPages?: number }).totalPages || 1
            }
        };
    },

    getById: async (id: string): Promise<{ success: boolean; data: Announcement }> => {
        const response = await api.get(`/announcements/${id}`);
        const result = response.data?.data || response.data;
        const ann = result?.announcement || result;
        return {
            success: response.data?.success ?? true,
            data: mapAnnouncement(ann as Record<string, unknown>)
        };
    },

    create: async (data: CreateAnnouncementDto): Promise<{ success: boolean; data: Announcement }> => {
        const response = await api.post('/announcements', data);
        const result = response.data?.data || response.data;
        const ann = result?.announcement || result;
        return {
            success: response.data?.success ?? true,
            data: mapAnnouncement(ann as Record<string, unknown>)
        };
    },

    update: async (id: string, data: Partial<CreateAnnouncementDto>): Promise<{ success: boolean; data: Announcement }> => {
        const response = await api.put(`/announcements/${id}`, data);
        const result = response.data?.data || response.data;
        const ann = result?.announcement || result;
        return {
            success: response.data?.success ?? true,
            data: mapAnnouncement(ann as Record<string, unknown>)
        };
    },

    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/announcements/${id}`);
        return response.data;
    },

    markAsRead: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.put(`/announcements/${id}/mark-read`);
        return response.data;
    }
};


export default announcementService;
