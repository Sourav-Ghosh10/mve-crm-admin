import api from "./api";
import type {
    Reimbursement,
    PaginatedReimbursementResponse,
    ReimbursementUpdateStatus
} from "../types/reimbursement.types";

export const reimbursementService = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        reimbursementType?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<PaginatedReimbursementResponse> => {
        const response = await api.get("/reimbursements", { params });
        return response.data;
    },

    getById: async (id: string): Promise<{ success: boolean; data: Reimbursement }> => {
        const response = await api.get(`/reimbursements/${id}`);
        return response.data;
    },

    updateStatus: async (id: string, data: ReimbursementUpdateStatus): Promise<{ success: boolean; data: Reimbursement }> => {
        const response = await api.patch(`/reimbursements/${id}/status`, data);
        return response.data;
    }
};
