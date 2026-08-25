import api from "./api";
import type { BreakType, BreakTypeInput, OrganizationFilters, PaginatedResponse } from "../types/organization.types";

export const breakTypeService = {
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<BreakType>> => {
        const response = await api.get<Record<string, unknown>>("/break-types", { params });
        const root = response.data;
        const data = root?.data || root;
        
        // Handle different possible response structures
        if (Array.isArray(data)) {
            const pagination = root?.pagination as Record<string, unknown> | undefined;
            return {
                data: data as BreakType[],
                total: (pagination?.total as number) || data.length,
                page: (pagination?.page as number) || 1,
                limit: (pagination?.limit as number) || 10,
                totalPages: (pagination?.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const breakTypes = (dataObj?.data || []) as BreakType[];
        return {
            data: breakTypes,
            total: (dataObj?.total as number) || breakTypes.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<BreakType> => {
        const response = await api.get<Record<string, unknown>>(`/break-types/${id}`);
        const data = response.data?.data || response.data;
        return data as BreakType;
    },

    create: async (data: BreakTypeInput): Promise<BreakType> => {
        const response = await api.post<Record<string, unknown>>("/break-types", data);
        const result = response.data?.data || response.data;
        return result as BreakType;
    },

    update: async (id: string, data: Partial<BreakTypeInput>): Promise<BreakType> => {
        const response = await api.put<Record<string, unknown>>(`/break-types/${id}`, data);
        const result = response.data?.data || response.data;
        return result as BreakType;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/break-types/${id}`);
    }
};
