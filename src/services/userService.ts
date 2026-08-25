import api from "./api";
import type { User, UserFilters, PaginatedUserResponse } from "../types/user.types";

/** Lightweight presence data returned by GET /api/employee/presence */
export interface EmployeePresence {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  profilePicture: string | null;
  lastActiveAt: string | null;
}

// Helper to normalize MongoDB Extended JSON (e.g. { $oid: '...' } or { $date: '...' })
// Helper to normalize MongoDB Extended JSON (e.g. { $oid: '...' } or { $date: '...' })
const normalizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  // Handle $oid
  if (typeof value === 'object' && value !== null && '$oid' in value) {
    return (value as { $oid: string }).$oid;
  }

  // Handle $date
  if (typeof value === 'object' && value !== null && '$date' in value) {
    const dateVal = (value as { $date: string }).$date;
    // If it's a timestamp like ISO string, we keep it as is.
    // Component might need YYYY-MM-DD, but let's keep full string and handle in UI if needed.
    return dateVal;
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

  // Helper to normalize user data (ensure both id and _id are present as strings)
const mapUser = (user: Record<string, unknown>): User => {
  if (!user) return user as unknown as User;

  const normalized = normalizeValue(user) as Record<string, unknown>;

  // Handle role vs roleId transformation for UI compatibility
  if (normalized.employment && typeof normalized.employment === 'object') {
    const emp = normalized.employment as Record<string, unknown>;
    if (!emp.role && emp.roleId) {
      emp.role = emp.roleId;
    }
  }

  const idValue = (normalized._id || normalized.id || "") as string;

  return {
    ...normalized,
    id: idValue,
    _id: idValue,
  } as User;
};

export const userService = {
  getAll: async (params?: UserFilters): Promise<PaginatedUserResponse> => {
    const response = await api.get<{
      data?: unknown[];
      users?: unknown[];
      pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        pages?: number;
        totalPages?: number;
      };
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      pages?: number
    }>("/users", { params });

    const root = response.data;
    const data = root?.data || root;
    const pagination = root?.pagination;

    // Case 1: Search results/paginated response from real API (data is array, pagination is sibling)
    if (Array.isArray(data) && pagination) {
      return {
        users: data.map(item => mapUser(item as Record<string, unknown>)),
        total: pagination.total || data.length,
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        totalPages: pagination.pages || pagination.totalPages || 1
      };
    }

    // Case 2: Nested users object (standard pattern)
    const dataObj = data as Record<string, unknown>;
    if (dataObj?.users && Array.isArray(dataObj.users)) {
      return {
        users: dataObj.users.map(item => mapUser(item as Record<string, unknown>)),
        total: (dataObj.total as number) || dataObj.users.length,
        page: (dataObj.page as number) || 1,
        limit: (dataObj.limit as number) || 10,
        totalPages: (dataObj.totalPages as number) || (dataObj.pages as number) || 1
      };
    }

    // Case 3: Simple array response
    const users = Array.isArray(data) ? data : [];
    return {
      users: users.map(item => mapUser(item as Record<string, unknown>)),
      total: users.length,
      page: 1,
      limit: users.length || 10,
      totalPages: 1
    };
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<Record<string, unknown>>(`/users/${id}`);
    const data = (response.data?.data || response.data) as Record<string, unknown>;
    const user = (data?.user || data) as Record<string, unknown>;
    return mapUser(user);
  },

  create: async (data: (Partial<User> | Omit<User, "id">) & { password?: string }): Promise<User> => {
    const response = await api.post<Record<string, unknown>>("/users", data);
    const result = (response.data?.data || response.data) as Record<string, unknown>;
    const user = (result?.user || result) as Record<string, unknown>;
    return mapUser(user);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<Record<string, unknown>>(`/users/${id}`, data);
    const result = (response.data?.data || response.data) as Record<string, unknown>;
    const user = (result?.user || result) as Record<string, unknown>;
    return mapUser(user);
  },

  delete: async (id: string, isActive?: boolean): Promise<Record<string, unknown>> => {
    const response = await api.delete<Record<string, unknown>>(`/users/${id}`, {
      params: isActive !== undefined ? { isActive } : undefined
    });
    return (response.data?.data || response.data) as Record<string, unknown>;
  },

  /** Fetch lightweight employee presence list (for online/offline status) */
  getPresence: async (): Promise<EmployeePresence[]> => {
    const response = await api.get<{ success: boolean; data: EmployeePresence[] }>("/employee/presence");
    return response.data?.data || [];
  },
};
