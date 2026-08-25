// import type { User } from "./user.types";

export type ScheduleType = "weekly" | "bi-weekly" | "monthly" | "daily";

export interface Client {
    _id: string;
    name: string;
    clientCode?: string;
    industry?: string;
    status: "active" | "inactive";
}

// Based on API Response
export interface EmployeeInfo {
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
    department: string;
    designation: string;
}

export interface RecurrencePattern {
    daysOfWeek: string[];
}

export interface ShiftData {
    _id: string;
    employeeId: string;
    clientId?: string;
    date?: string;
    shiftDate?: string;
    shiftType?: "day" | "night" | "evening" | "off" | "flexible" | "Leave" | "Holiday";
    startTime?: string | string[];
    endTime?: string | string[];
    location?: string;
    department?: string;
    isRecurring?: boolean;
    recurrencePattern?: RecurrencePattern;
    notes?: string;
    status?: string;
    breakDuration?: number;
    confirmationTime?: string;
    leaveType?: string;
    leaveReason?: string;
    leaveId?: string;
    holidayName?: string;
    isHalfDayLeave?: boolean;
    halfDayType?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface EmployeeRoster {
    id: string;
    _id: string;
    employeeId: string;
    Info: EmployeeInfo;
    employment?: {
        timezone?: string;
        department?: string;
        designation?: string;
        role?: string;
    };
    shiftData: Record<string, ShiftData>;
}

export interface ScheduleFilters {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    clientId?: string;
    isPublished?: boolean; // Keep for backward compat if needed, or remove if not in new API
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    departmentId?: string;
    employeeName?: string;
    clientName?: string;
    role?: string;
    employeeIds?: string[];
}

export interface Schedule {
    _id: string;
    scheduleType: ScheduleType;
    startDate: string;
    endDate: string;
    isPublished: boolean;
    publishedAt?: string;
    publishedBy?: {
        _id?: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    shiftsCount: {
        total: number;
        confirmed: number;
        pending: number;
        declined: number;
    };
    shifts?: ShiftData[];
}

export interface PaginatedScheduleResponse {
    success?: boolean;
    data: EmployeeRoster[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}
// Keeping these for legacy/creation if needed, but Roster is the main view now
export interface CreateScheduleInput {
    scheduleType: ScheduleType;
    startDate: string;
    endDate: string;
    shifts: Partial<ShiftData>[]; // Update when create flow is revisited
}
