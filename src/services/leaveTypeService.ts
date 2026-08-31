import api from "./api";
import type { LeaveType, LeaveTypeInput, OrganizationFilters, PaginatedResponse } from "../types/organization.types";

export const leaveTypeService = {
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<LeaveType>> => {
        const response = await api.get<Record<string, unknown>>("/leave-types/list", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as LeaveType[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const leaveTypes = Array.isArray(data) ? data : (dataObj?.data || []) as LeaveType[];
        return {
            data: leaveTypes as LeaveType[],
            total: (dataObj?.total as number) || leaveTypes.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<LeaveType> => {
        const response = await api.get<Record<string, unknown>>(`/leave-types/${id}`);
        const data = response.data?.data || response.data;
        return data as LeaveType;
    },

    create: async (data: LeaveTypeInput): Promise<LeaveType> => {
        const response = await api.post<Record<string, unknown>>("/leave-types", data);
        const result = response.data?.data || response.data;
        return result as LeaveType;
    },

    update: async (id: string, data: Partial<LeaveTypeInput>): Promise<LeaveType> => {
        const response = await api.put<Record<string, unknown>>(`/leave-types/${id}`, data);
        const result = response.data?.data || response.data;
        return result as LeaveType;
    },

    delete: async (id: string): Promise<void> => {
        // Soft delete: deactivate the leave type instead of permanently deleting
        await api.put(`/leave-types/${id}`, { isActive: false });
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<LeaveType> => {
        const response = await api.put<Record<string, unknown>>(`/leave-types/${id}`, { isActive });
        const result = response.data?.data || response.data;
        return result as LeaveType;
    }
};
