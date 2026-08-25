import api from "./api";

export interface LocationHistoryRecord {
    _id: string;
    userId: {
        _id: string;
        employeeId: string;
        personalInfo: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    latitude: number | null;
    longitude: number | null;
    ipAddress: string;
    userAgent: string;
    loginAt: string;
    createdAt: string;
}

export interface LocationHistoryResponse {
    data: LocationHistoryRecord[];
    total: number;
    page: number;
    totalPages: number;
}

export const locationHistoryService = {
    getByUserId: async (
        userId: string,
        params?: { date?: string; page?: number; limit?: number }
    ): Promise<LocationHistoryResponse> => {
        const response = await api.get<{
            success: boolean;
            data: LocationHistoryRecord[];
            total: number;
            page: number;
            totalPages: number;
        }>(`/users/${userId}/location-history`, { params });

        return {
            data: response.data?.data || [],
            total: response.data?.total || 0,
            page: response.data?.page || 1,
            totalPages: response.data?.totalPages || 1,
        };
    },
};
