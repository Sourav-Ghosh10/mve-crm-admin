import api from "./api";
import type { ReimbursementType, ReimbursementTypeInput } from "../types/reimbursement.types";
import type { OrganizationFilters, PaginatedResponse } from "../types/organization.types";

export const reimbursementTypeService = {
    // Admin: Get all types with filtering and pagination
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<ReimbursementType>> => {
        const response = await api.get<Record<string, unknown>>("/reimbursement-types", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as ReimbursementType[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const reimbursementTypes = Array.isArray(data) ? data : (dataObj?.data || []) as ReimbursementType[];
        return {
            data: reimbursementTypes as ReimbursementType[],
            total: (dataObj?.total as number) || reimbursementTypes.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    // Public: Get only active types for selection
    getActive: async (): Promise<ReimbursementType[]> => {
        const response = await api.get<{ success: boolean; data: ReimbursementType[] }>("/reimbursement-types/active");
        return response.data.data;
    },

    getById: async (id: string): Promise<ReimbursementType> => {
        const response = await api.get<Record<string, unknown>>(`/reimbursement-types/${id}`);
        const data = response.data?.data || response.data;
        return data as ReimbursementType;
    },

    create: async (data: ReimbursementTypeInput): Promise<ReimbursementType> => {
        const response = await api.post<Record<string, unknown>>("/reimbursement-types", data);
        const result = response.data?.data || response.data;
        return result as ReimbursementType;
    },

    update: async (id: string, data: Partial<ReimbursementTypeInput>): Promise<ReimbursementType> => {
        const response = await api.put<Record<string, unknown>>(`/reimbursement-types/${id}`, data);
        const result = response.data?.data || response.data;
        return result as ReimbursementType;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<ReimbursementType> => {
        const response = await api.patch<Record<string, unknown>>(`/reimbursement-types/${id}/status`, { isActive });
        const result = response.data?.data || response.data;
        return result as ReimbursementType;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/reimbursement-types/${id}`);
    }
};
