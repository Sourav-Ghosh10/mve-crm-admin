import api from "./api";
import type { Holiday, HolidayInput, OrganizationFilters, PaginatedResponse } from "../types/organization.types";

export const holidayService = {
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<Holiday>> => {
        const response = await api.get<Record<string, unknown>>("/holidays", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as Holiday[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const holidays = Array.isArray(data) ? data : (dataObj?.data || []) as Holiday[];
        return {
            data: holidays as Holiday[],
            total: (dataObj?.total as number) || holidays.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<Holiday> => {
        const response = await api.get<Record<string, unknown>>(`/holidays/${id}`);
        const data = response.data?.data || response.data;
        return data as Holiday;
    },

    create: async (data: HolidayInput): Promise<Holiday> => {
        const response = await api.post<Record<string, unknown>>("/holidays", data);
        const result = response.data?.data || response.data;
        return result as Holiday;
    },

    update: async (id: string, data: Partial<HolidayInput>): Promise<Holiday> => {
        const response = await api.put<Record<string, unknown>>(`/holidays/${id}`, data);
        const result = response.data?.data || response.data;
        return result as Holiday;
    },

    delete: async (id: string): Promise<Record<string, unknown>> => {
        const response = await api.patch<Record<string, unknown>>(`/holidays/${id}/status`, {
            isActive: false
        });
        const result = (response.data?.data || response.data) as Record<string, unknown>;
        return result;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<Holiday> => {
        const response = await api.patch<Record<string, unknown>>(`/holidays/${id}/status`, {
            isActive
        });
        const result = response.data?.data || response.data;
        return result as Holiday;
    }
};
