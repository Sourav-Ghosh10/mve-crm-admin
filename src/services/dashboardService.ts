import api from './api';

export interface DashboardStats {
  efficiency: number;
  availability: number;
  resourceLoad: number;
  security: string;
  clientCount?: number;
}

export interface AdminDashboardStats {
  totalEmployees: number;
  attendanceToday: number;
  pendingLeaves: number;
  resourceAllocation: {
    presentToday: number;
    absentToday: number;
    onLeave: number;
    lateArrivals: number;
  };
  recentActivity: Array<{
    user: string;
    action: string;
    time: string;
  }>;
}

export interface Team {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'success' | 'info';
  timestamp: Date;
  status: string;
  affectedServices: string[];
}

export const dashboardService = {
  // Get dashboard statistics for a specific user
  getStats: async (userId?: string): Promise<DashboardStats> => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const response = await api.get(`/dashboard/stats`, { params: { userId } });
    return response.data.data;
  },

  // Get admin dashboard statistics
  getAdminDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await api.get('/dashboard/admin-stats');
    return response.data.data;
  },

  // Get team members assigned to a user
  getAssignedTeam: async (userId?: string, limit: number = 4): Promise<Team[]> => {
    if (!userId) {
      // Fallback: return empty array or fetch all users
      const response = await api.get('/users', { params: { limit } });
      return response.data.data;
    }
    const response = await api.get(`/dashboard/team`, { 
      params: { userId, limit } 
    });
    return response.data.data;
  },

  // Get incidents for a specific user
  getIncidents: async (userId?: string): Promise<Incident[]> => {
    if (!userId) {
      // Fallback: return empty array
      return [];
    }
    const response = await api.get(`/dashboard/incidents`, { 
      params: { userId } 
    });
    return response.data.data;
  }
};
