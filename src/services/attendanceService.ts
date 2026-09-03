import api from "./api";
import type { Attendance, AttendanceFilters } from "../types/attendance.types";
import type { AxiosResponse } from "axios";
import { normalizeAttendanceRecord } from "../utils/attendanceLocationUtils";

export interface PaginatedAttendanceResponse {
  attendances: Attendance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper to normalize MongoDB Extended JSON (e.g. { $oid: '...' } or { $date: '...' })
const normalizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'object' && value !== null && '$oid' in value) {
    return (value as { $oid: string }).$oid;
  }

  if (typeof value === 'object' && value !== null && '$date' in value) {
    return (value as { $date: string }).$date;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

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

// Helper to normalize attendance data (ensure both id and _id are present as strings)
const mapAttendance = (item: Record<string, unknown>): Attendance => {
  if (!item) return item as unknown as Attendance;
  const normalized = normalizeValue(item) as Record<string, unknown>;
  const idValue = (normalized._id || normalized.id || "") as string;
  const mapped = {
    ...normalized,
    id: idValue,
    _id: idValue,
  } as unknown as Attendance;

  return normalizeAttendanceRecord(mapped);
};

export const attendanceService = {
  getAll: async (params?: AttendanceFilters): Promise<PaginatedAttendanceResponse> => {
    const finalParams = {
      ...params,
      employeeId: params?.employeeId || params?.userId
    };
    const response: AxiosResponse = await api.get("/attendance", { params: finalParams });
    const root = response.data;

    // Try multiple shapes to be resilient against API variations
    const data = root?.data || root;

    // Case: { data: { attendance: [...], pagination: {...} } }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      const rawItems = ((obj.attendance || obj.attendances) as Record<string, unknown>[]) || [];
      const items = rawItems.map(mapAttendance);
      const pagination = (obj.pagination as Record<string, number>) || {};

      return {
        attendances: items,
        total: pagination.total || (obj.total as number) || items.length,
        page: pagination.page || (obj.page as number) || 1,
        limit: pagination.limit || (obj.limit as number) || items.length || 10,
        totalPages: pagination.pages || pagination.totalPages || (obj.totalPages as number) || 1
      };
    }

    // Case: { data: [...], pagination: { total, page, limit, pages } }
    if (Array.isArray(data)) {
      const items = (data as Record<string, unknown>[]).map(mapAttendance);
      const pagination = (root?.pagination || {}) as Record<string, number>;

      return {
        attendances: items,
        total: pagination.total || items.length,
        page: pagination.page || 1,
        limit: pagination.limit || items.length || 10,
        totalPages: pagination.pages || pagination.totalPages || 1
      };
    }

    // Fallback: if root is an array
    const arr = Array.isArray(root) ? (root as Record<string, unknown>[]).map(mapAttendance) : [];
    return {
      attendances: arr,
      total: arr.length,
      page: 1,
      limit: arr.length || 10,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<Attendance> => {
    const response: AxiosResponse = await api.get(`/attendance/${id}`);
    const root = response.data;
    const data = root?.data || root;
    return mapAttendance(data as Record<string, unknown>);
  },

  getByDateAndUser: async (date: string, userId: string): Promise<Attendance> => {
    try {
      const response: AxiosResponse = await api.get(`/attendance/${date}/${userId}`);
      const root = response.data;
      const data = root?.data || root;
      return mapAttendance(data as Record<string, unknown>);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        throw error;
      }

      // Fallback for backends that don't expose /attendance/:date/:userId
      // and only support filtering through /attendance.
      const fallback = await attendanceService.getAll({
        userId,
        startDate: date,
        endDate: date,
        page: 1,
        limit: 50,
      });

      const dateKey = date.slice(0, 10);
      const record = (fallback.attendances || []).find((item) => {
        const itemDate = String(item.date || "").slice(0, 10);
        const emp = item.employeeId;
        const itemUserId = typeof emp === "string" ? emp : (emp?._id || "");
        return itemDate === dateKey && itemUserId === userId;
      });

      if (!record) {
        throw error;
      }

      return record;
    }
  },

  getSummary: async (params?: AttendanceFilters): Promise<PaginatedAttendanceResponse> => {
    const response = await api.get("/attendance/summary", { params });
    const root = response.data;
    const data = root?.data || root;

    let items: Attendance[] = [];
    let pagination: any = {};

    if (Array.isArray(data)) {
      items = data.map(mapAttendance);
      pagination = root?.pagination || {};
    } else {
      const rawItems = data.attendance || data.attendances || [];
      items = Array.isArray(rawItems) ? rawItems.map(mapAttendance) : [];
      pagination = data.pagination || {};
    }

    return {
      attendances: items,
      total: pagination.total || items.length || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalPages: pagination.pages || pagination.totalPages || 1
    };
  },

  getStats: async (params?: { date?: string; department?: string; designation?: string }) => {
    const response = await api.get("/attendance/summary/stats", { params });
    return response.data.data;
  },
  getLastActiveLocations: async (): Promise<any[]> => {
    const response = await api.get("/location/last-active");
    return response.data?.data || [];
  },
};

