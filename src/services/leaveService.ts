import api from './api';
import type { LeaveRequest, LeaveStatus, LeaveType, EmployeeLeaveBalanceResponse } from '../types/leave.types';
export type { LeaveRequest, LeaveStatus, LeaveType, EmployeeLeaveBalanceResponse };

export interface LeaveRequestQueryParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus | 'all';
  userId?: string;
  leaveType?: LeaveType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedLeaveResponse {
  data: LeaveRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const leaveService = {
  // Get all leave requests (Admin/Manager view) with pagination and filtering
  getRequests: async (params?: LeaveRequestQueryParams): Promise<PaginatedLeaveResponse> => {
    // Clean up params - remove 'all' status and empty values
    const cleanParams: Record<string, string | number | undefined> = {};

    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.status && params.status !== 'all') cleanParams.status = params.status;
      if (params.userId) cleanParams.userId = params.userId;
      if (params.leaveType) cleanParams.leaveType = params.leaveType;
      if (params.search) cleanParams.search = params.search;
      if (params.startDate) cleanParams.startDate = params.startDate;
      if (params.endDate) cleanParams.endDate = params.endDate;
    }

    const response = await api.get('/leave-requests', { params: cleanParams });
    return {
      data: response.data.data,
      pagination: response.data.pagination || {
        total: response.data.data?.length || 0,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    };
  },

  // Get current user's leave requests
  getMyRequests: async (): Promise<LeaveRequest[]> => {
    const response = await api.get('/leave-requests/my-requests');
    return response.data.data;
  },

  // Get leave balance for a user (or current user)
  getBalance: async (userId?: string) => {
    const url = userId ? `/employee/${userId}/leave-balance` : '/employee/leave-balance';
    const response = await api.get(url);
    return response.data.data;
  },

  // Admin: Get specific employee's balance
  getEmployeeBalance: async (userId: string): Promise<EmployeeLeaveBalanceResponse> => {
    const response = await api.get(`/leave-requests/employee/${userId}/balance`);
    return response.data.data;
  },

  // Admin: Update specific employee's balance
  updateEmployeeBalance: async (userId: string, leaveBalance: Record<string, number>) => {
    const response = await api.patch(`/leave-requests/employee/${userId}/balance`, { leaveBalance });
    return response.data.data;
  },

  // Update leave status (Approve/Reject)
  updateStatus: async (id: string, status: 'approved' | 'rejected', comment?: string, isDeductFromBalance?: boolean) => {
    const payload: any = { status };
    if (comment) {
      payload.rejectionReason = comment;
      payload.adminComment = comment;
      payload.approvalComment = comment;
      payload.comment = comment; // Just in case it's named 'comment' on backend
    }
    if (isDeductFromBalance !== undefined) {
      payload.isDeductFromBalance = isDeductFromBalance;
    }
    const response = await api.patch(`/leave-requests/${id}/status`, payload);
    return response.data.data;
  },

  // Create a new leave request (if needed for admin to create on behalf, or self)
  createRequest: async (data: FormData) => {
    const response = await api.post('/leave-requests', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  // Get leave request statistics
  getStats: async () => {
    const response = await api.get('/leave-requests/stats');
    return response.data.data;
  },

  // Add opening balance (Admin)
  addOpeningBalance: async (data: { employeeId: string; leaveType: string; amount: number; description?: string }) => {
    const response = await api.post('/leave-requests/opening-balance', data);
    return response.data.data;
  }
};

