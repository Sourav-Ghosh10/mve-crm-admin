import api from "./api";
import type { Role, RoleFilters, RoleInput } from "../types/role.types";
import type { PaginatedResponse } from "../types/organization.types";

export const roleService = {
    getAll: async (params?: RoleFilters): Promise<PaginatedResponse<Role>> => {
        const response = await api.get<Record<string, unknown>>("/roles", { params });
        const root = response.data;
        const data = root?.data || root;
        const pagination = root?.pagination as Record<string, unknown> | undefined;

        if (Array.isArray(data) && pagination) {
            return {
                data: data as Role[],
                total: (pagination.total as number) || data.length,
                page: (pagination.page as number) || 1,
                limit: (pagination.limit as number) || 10,
                totalPages: (pagination.pages as number) || (pagination.totalPages as number) || 1
            };
        }

        const dataObj = data as Record<string, unknown>;
        const roles = Array.isArray(data) ? data : (dataObj?.data || []) as Role[];
        return {
            data: roles as Role[],
            total: (dataObj?.total as number) || roles.length,
            page: (dataObj?.page as number) || 1,
            limit: (dataObj?.limit as number) || 10,
            totalPages: (dataObj?.totalPages as number) || 1
        };
    },

    getById: async (id: string): Promise<Role> => {
        const response = await api.get<Record<string, unknown>>(`/roles/${id}`);
        const data = response.data?.data || response.data;
        return data as Role;
    },

    create: async (data: RoleInput): Promise<Role> => {
        const response = await api.post<Record<string, unknown>>("/roles", data);
        const result = response.data?.data || response.data;
        return result as Role;
    },

    update: async (id: string, data: Partial<RoleInput>): Promise<Role> => {
        const response = await api.put<Record<string, unknown>>(`/roles/${id}`, data);
        const result = response.data?.data || response.data;
        return result as Role;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<Role> => {
        const response = await api.patch<Record<string, unknown>>(`/roles/${id}/status`, {
            isActive
        });
        const result = response.data?.data || response.data;
        return result as Role;
    }
};
