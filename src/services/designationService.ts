import api from "./api";
import type { Designation, OrganizationFilters, PaginatedResponse, DesignationInput } from "../types/organization.types";

export const designationService = {
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<Designation>> => {
        const response = await api.get<Record<string, unknown>>("/designations", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as Designation[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const designations = Array.isArray(data) ? data : (dataObj?.data || []) as Designation[];
        return {
            data: designations as Designation[],
            total: (dataObj?.total as number) || designations.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<Designation> => {
        const response = await api.get<Record<string, unknown>>(`/designations/${id}`);
        const data = response.data?.data || response.data;
        return data as Designation;
    },

    create: async (data: DesignationInput): Promise<Designation> => {
        const response = await api.post<Record<string, unknown>>("/designations", data);
        const result = response.data?.data || response.data;
        return result as Designation;
    },

    update: async (id: string, data: Partial<DesignationInput>): Promise<Designation> => {
        const response = await api.put<Record<string, unknown>>(`/designations/${id}`, data);
        const result = response.data?.data || response.data;
        return result as Designation;
    },

    delete: async (id: string): Promise<Record<string, unknown>> => {
        const response = await api.patch<Record<string, unknown>>(`/designations/${id}/status`, {
            isActive: false
        });
        const result = (response.data?.data || response.data) as Record<string, unknown>;
        return result;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<Designation> => {
        const response = await api.patch<Record<string, unknown>>(`/designations/${id}/status`, {
            isActive
        });
        const result = response.data?.data || response.data;
        return result as Designation;
    }
};
