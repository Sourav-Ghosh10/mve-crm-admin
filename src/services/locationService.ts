import api from "./api";
import type { OfficeLocation, OrganizationFilters, PaginatedResponse, OfficeLocationInput } from "../types/organization.types";

export const locationService = {
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<OfficeLocation>> => {
        const response = await api.get<Record<string, unknown>>("/office-locations", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as OfficeLocation[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const locations = Array.isArray(data) ? data : (dataObj?.data || []) as OfficeLocation[];
        return {
            data: locations as OfficeLocation[],
            total: (dataObj?.total as number) || locations.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<OfficeLocation> => {
        const response = await api.get<Record<string, unknown>>(`/office-locations/${id}`);
        const data = response.data?.data || response.data;
        return data as OfficeLocation;
    },

    create: async (data: OfficeLocationInput): Promise<OfficeLocation> => {
        const response = await api.post<Record<string, unknown>>("/office-locations", data);
        const result = response.data?.data || response.data;
        return result as OfficeLocation;
    },

    update: async (id: string, data: Partial<OfficeLocation>): Promise<OfficeLocation> => {
        const response = await api.put<Record<string, unknown>>(`/office-locations/${id}`, data);
        const result = response.data?.data || response.data;
        return result as OfficeLocation;
    },

    delete: async (id: string): Promise<Record<string, unknown>> => {
        const response = await api.patch<Record<string, unknown>>(`/office-locations/${id}/status`, {
            isActive: false
        });
        const result = (response.data?.data || response.data) as Record<string, unknown>;
        return result;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<OfficeLocation> => {
        const response = await api.patch<Record<string, unknown>>(`/office-locations/${id}/status`, {
            isActive
        });
        const result = response.data?.data || response.data;
        return result as OfficeLocation;
    }
};
