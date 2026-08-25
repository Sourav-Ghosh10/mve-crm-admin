import api from "./api";
import type { Department, OrganizationFilters, PaginatedResponse, DepartmentInput } from "../types/organization.types";

export const departmentService = {
    getAll: async (params?: OrganizationFilters): Promise<PaginatedResponse<Department>> => {
        const response = await api.get<Record<string, unknown>>("/departments", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as Department[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const departments = Array.isArray(data) ? data : (dataObj?.data || []) as Department[];
        return {
            data: departments as Department[],
            total: (dataObj?.total as number) || departments.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<Department> => {
        const response = await api.get<Record<string, unknown>>(`/departments/${id}`);
        const data = response.data?.data || response.data;
        return data as Department;
    },

    create: async (data: DepartmentInput): Promise<Department> => {
        const response = await api.post<Record<string, unknown>>("/departments", data);
        const result = response.data?.data || response.data;
        return result as Department;
    },

    update: async (id: string, data: Partial<Department>): Promise<Department> => {
        const response = await api.put<Record<string, unknown>>(`/departments/${id}`, data);
        const result = response.data?.data || response.data;
        return result as Department;
    },

    delete: async (id: string): Promise<Record<string, unknown>> => {
        const response = await api.patch<Record<string, unknown>>(`/departments/${id}/status`, {
            isActive: false
        });
        const result = (response.data?.data || response.data) as Record<string, unknown>;
        return result;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<Department> => {
        const response = await api.patch<Record<string, unknown>>(`/departments/${id}/status`, {
            isActive
        });
        const result = response.data?.data || response.data;
        return result as Department;
    }
};
