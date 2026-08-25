import api from './api';

export interface SupportTicketMessage {
  _id: string;
  senderId: string;
  senderType: 'employee' | 'client' | 'admin';
  text: string;
  attachments?: {
    name: string;
    url: string;
    fileType: string;
  }[];
  createdAt: string;
}

export interface SupportUser {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
  };
  _id?: string;
  [key: string]: unknown;
}

export interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: SupportUser;
  assignedTo?: SupportUser | null;
  userType: 'employee' | 'client' | 'admin';
  source: string;
  attachments?: {
    name: string;
    url: string;
    fileType: string;
  }[];
  messages: SupportTicketMessage[];
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportSettings {
  supportEmail: string;
  supportPhone: string;
  supportMessage: string;
  allowUrgentEmail: boolean;
  clientSupportEnabled: boolean;
}

const supportService = {
  getSettings: async (): Promise<SupportSettings> => {
    const response = await api.get('/support/settings');
    return response.data.data;
  },

  updateSettings: async (settings: Partial<SupportSettings>): Promise<SupportSettings> => {
    const response = await api.patch('/support/settings', settings);
    return response.data.data;
  },

  createTicket: async (payload: {
    subject: string;
    message: string;
    priority: string;
    source: string;
    userType: string;
    isUrgent?: boolean;
    attachments?: (File | { name: string; url: string; fileType: string })[];
  }): Promise<SupportTicket> => {
    let requestData: Record<string, unknown> | FormData = payload as unknown as Record<string, unknown>;
    let headers = {};

    if (payload.attachments?.some(a => a instanceof File)) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (key === 'attachments' && Array.isArray(value)) {
                value.forEach(file => {
                    if (file instanceof File) {
                        formData.append('attachments[]', file);
                    }
                });
            } else {
                formData.append(key, String(value));
            }
        });
        requestData = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await api.post('/support/create', requestData, { headers });
    return response.data.data;
  },

  getMyTickets: async (): Promise<SupportTicket[]> => {
    const response = await api.get('/support/my-tickets');
    return response.data.data;
  },

  getAllTickets: async (params: Record<string, unknown> = {}): Promise<{ tickets: SupportTicket[], pagination: unknown }> => {
    const response = await api.get('/support/all', { params });
    return response.data.data;
  },

  replyToTicket: async (ticketId: string, text: string, senderType: string = 'admin', attachments?: File[]): Promise<SupportTicket> => {
    let requestData: Record<string, unknown> | FormData = { text, senderType };
    let headers = {};

    if (attachments && attachments.length > 0) {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('senderType', senderType);
        attachments.forEach(file => formData.append('attachments[]', file));
        requestData = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await api.post(`/support/${ticketId}/reply`, requestData, { headers });
    return response.data.data;
  },

  updateStatus: async (ticketId: string, status: string): Promise<SupportTicket> => {
    const response = await api.patch(`/support/${ticketId}/status`, { status });
    return response.data.data;
  },

  assignTicket: async (ticketId: string, adminId: string): Promise<SupportTicket> => {
    const response = await api.patch(`/support/${ticketId}/assign`, { adminId });
    return response.data.data;
  }
};

export default supportService;
