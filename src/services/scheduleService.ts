import api from "./api";
import type {
    ScheduleFilters,
    PaginatedScheduleResponse
} from "../types/schedule.types";

export interface RosterEditRequest {
    _id: string;
    employeeId: {
        _id: string;
        personalInfo: {
            firstName: string;
            lastName: string;
            email: string;
            profilePicture?: string;
        };
    };
    date: string;
    requestedAt: string;
    originalRoster?: {
        shiftType: string;
        startTime: string[];
        endTime: string[];
    };
    updatedRoster: {
        shiftType: string;
        startTime: string[];
        endTime: string[];
    };
    requestStatus: 'pending' | 'approved' | 'rejected';
}

export interface RosterEditRequestsResponse {
    data: RosterEditRequest[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface RosterEditRequestsStats {
    pendingRequests: number;
    approvedToday: number;
    rejectedTotal: number;
    totalRequests: number;
}

export const scheduleService = {
    getAll: async (filters: ScheduleFilters = {}): Promise<PaginatedScheduleResponse> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.employeeName) params.append("employeeName", filters.employeeName);
        if (filters.search) params.append("search", filters.search);
        if (filters.employeeIds) {
            filters.employeeIds.forEach(id => params.append("employeeIds", id));
        }
        if (filters.clientName) params.append("clientName", filters.clientName);
        if (filters.department) params.append("department", filters.department);
        if (filters.isPublished !== undefined) params.append("isPublished", String(filters.isPublished));
        if (filters.page) params.append("page", String(filters.page));
        if (filters.limit) params.append("limit", String(filters.limit));

        const response = await api.get(`/schedules/all?${params.toString()}`);
        return response.data;
    },

    list: async (filters: ScheduleFilters = {}): Promise<{ data: Record<string, unknown>[], pagination: Record<string, unknown> }> => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", String(filters.page));
        if (filters.limit) params.append("limit", String(filters.limit));
        if (filters.isPublished !== undefined) params.append("isPublished", String(filters.isPublished));

        const response = await api.get(`/schedules?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Record<string, unknown>> => {
        const response = await api.get(`/schedules/${id}`);
        return response.data.data;
    },

    getRoster: async (id: string, filters: ScheduleFilters = {}): Promise<PaginatedScheduleResponse> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.search) params.append("search", filters.search);
        if (filters.page) params.append("page", String(filters.page));
        if (filters.limit) params.append("limit", String(filters.limit));

        const response = await api.get(`/schedules/${id}/roster?${params.toString()}`);
        return response.data;
    },

    create: async (data: Record<string, unknown>): Promise<{ success: boolean; data: unknown }> => {
        const response = await api.post("/schedules", data);
        return response.data;
    },

    update: async (id: string, data: Record<string, unknown>): Promise<{ success: boolean; data: unknown }> => {
        const response = await api.put(`/schedules/${id}`, data);
        return response.data;
    },
    bulkUpdate: async (data: Record<string, unknown>[]): Promise<{ success: boolean; data: unknown }> => {
        const response = await api.put("/schedules/bulk-update", data);
        return response.data;
    },
    getByDateSummary: async (filters: ScheduleFilters = {}): Promise<Record<string, unknown>> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.limit) params.append("dailyUserLimit", String(filters.limit));
        if (filters.page) params.append("page", String(filters.page));
        if (filters.department) params.append("department", filters.department);

        const response = await api.get(`/schedules/users-by-date?${params.toString()}`);
        return response.data;
    },

    getEditRequests: async (filters: { status?: string; search?: string; page?: number; limit?: number } = {}): Promise<RosterEditRequestsResponse> => {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.search) params.append("search", filters.search);
        if (filters.page) params.append("page", String(filters.page));
        if (filters.limit) params.append("limit", String(filters.limit));

        const response = await api.get(`/schedules/edit-requests?${params.toString()}`);
        return response.data;
    },

    getEditRequestsStats: async (): Promise<{ data: RosterEditRequestsStats }> => {
        const response = await api.get(`/schedules/edit-requests/stats`);
        return response.data;
    },

    reviewEditRequest: async (id: string, action: 'approve' | 'reject'): Promise<{ success: boolean; data: RosterEditRequest }> => {
        const response = await api.put(`/schedules/edit-requests/${id}/review`, { action });
        return response.data;
    },
    resetRoster: async (userId?: string): Promise<{ success: boolean; message: string; data: any }> => {
        const response = await api.post("/schedules/reset-roster", { userId });
        return response.data;
    }
};


