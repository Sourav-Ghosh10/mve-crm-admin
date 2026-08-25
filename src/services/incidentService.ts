import api from "./api";

export interface Incident {
  _id: string;
  id: string;
  title: string;
  description: string;
  category: "staffing" | "technical" | "maintenance" | "infrastructure";
  severity: "low" | "medium" | "high";
  status: "active" | "resolved";
  clientId: { _id: string; name: string } | string | null;
  isGlobal: boolean;
  publishedToPortal: boolean;
  publishedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string;
  alertSent: boolean;
  alertSentAt: string | null;
  createdBy: {
    _id: string;
    personalInfo: { firstName: string; lastName: string };
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  category: string;
  severity: string;
  clientId?: string | null;
  isGlobal: boolean;
  publishedToPortal: boolean;
  sendAlertNow: boolean;
  resolutionNote?: string;
}

export interface IncidentFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  severity?: string;
  clientId?: string;
  isGlobal?: string;
  search?: string;
}

export interface PaginatedIncidentResponse {
  incidents: Incident[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const incidentService = {
  getAll: async (params?: IncidentFilters): Promise<PaginatedIncidentResponse> => {
    const response = await api.get("/incidents", { params });
    const root = response.data;
    const data = root.data || [];
    const pagination = root.pagination;

    return {
      incidents: data,
      total: pagination?.total || data.length,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
      totalPages: pagination?.pages || 1,
    };
  },

  getById: async (id: string): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateIncidentRequest): Promise<Incident> => {
    const response = await api.post("/incidents", data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<CreateIncidentRequest>): Promise<Incident> => {
    const response = await api.patch(`/incidents/${id}`, data);
    return response.data.data || response.data;
  },

  resolve: async (id: string, resolutionNote?: string): Promise<Incident> => {
    const response = await api.patch(`/incidents/${id}/resolve`, { resolutionNote });
    return response.data.data || response.data;
  },

  sendAlert: async (id: string): Promise<void> => {
    await api.post(`/incidents/${id}/send-alert`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/incidents/${id}`);
  },

  // Client portal endpoint
  getPortalIncidents: async (clientId?: string): Promise<Incident[]> => {
    const response = await api.get("/incidents/portal/active", {
      params: clientId ? { clientId } : {},
    });
    return response.data.data || [];
  },
};
