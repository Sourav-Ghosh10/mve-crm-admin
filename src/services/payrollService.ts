import api from './api';
import type { User } from '../types/user.types';

export interface AllowanceDeductionMaster {
  _id: string;
  name: string;
  code: string;
  type: 'ALLOWANCE' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE' | 'SLAB';
  percentageOf?: 'CTC' | 'BASIC' | 'GROSS';
  value: number;
  slabs?: Array<{
    minAmount: number;
    maxAmount: number | null;
    fixedAmount: number;
  }>;
  isBalancing?: boolean;
  isTaxable: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryConfigItem {
  masterId: string | AllowanceDeductionMaster;
  overrideValue: number | null;
  isActive: boolean;
}

export interface SalaryConfig {
  _id: string;
  employeeId: string | User;
  monthlyCTC: number;
  effectiveFrom: string;
  isActive: boolean;
  items: SalaryConfigItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PayslipItem {
  masterId: string;
  name: string;
  code: string;
  type: 'ALLOWANCE' | 'DEDUCTION';
  amount: number;
  isManualOverride: boolean;
}

export interface Payslip {
  _id: string;
  employeeId: string | User;
  salaryConfigId: string | SalaryConfig;
  month: number;
  year: number;
  monthlyCTC: number;
  items: PayslipItem[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  totalDays: number;
  daysWorked: number;
  lopDays: number;
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
  isManual: boolean;
  generatedBy?: string | User;
  finalizedBy?: string | User;
  finalizedAt?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollMastersResponse {
  success: boolean;
  data: AllowanceDeductionMaster[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SalaryConfigsResponse {
  success: boolean;
  data: SalaryConfig[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PayslipsResponse {
  success: boolean;
  data: Payslip[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const payrollService = {
  // Allowance Deduction Masters
  getMasters: async (params: { page?: number; limit?: number; type?: string; isActive?: boolean; search?: string }) => {
    const response = await api.get<PayrollMastersResponse>('/payroll/masters', { params });
    return response.data;
  },

  getMasterById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: AllowanceDeductionMaster }>(`/payroll/masters/${id}`);
    return response.data;
  },

  createMaster: async (data: Partial<AllowanceDeductionMaster>) => {
    const response = await api.post<{ success: boolean; data: AllowanceDeductionMaster }>('/payroll/masters', data);
    return response.data;
  },

  updateMaster: async (id: string, data: Partial<AllowanceDeductionMaster>) => {
    const response = await api.put<{ success: boolean; data: AllowanceDeductionMaster }>(`/payroll/masters/${id}`, data);
    return response.data;
  },

  toggleMasterStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch<{ success: boolean; data: AllowanceDeductionMaster }>(`/payroll/masters/${id}/status`, { isActive });
    return response.data;
  },

  deleteMaster: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/payroll/masters/${id}`);
    return response.data;
  },

  // Salary Configurations
  getSalaryConfigs: async (params: { page?: number; limit?: number; employeeId?: string; isActive?: boolean }) => {
    const response = await api.get<SalaryConfigsResponse>('/payroll/salary-configs', { params });
    return response.data;
  },

  getSalaryConfigById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: SalaryConfig }>(`/payroll/salary-configs/${id}`);
    return response.data;
  },

  getLatestSalaryConfig: async (employeeId: string) => {
    const response = await api.get<{ success: boolean; data: SalaryConfig }>(`/payroll/salary-configs/latest/${employeeId}`);
    return response.data;
  },

  createSalaryConfig: async (data: any) => {
    const response = await api.post<{ success: boolean; data: SalaryConfig }>('/payroll/salary-configs', data);
    return response.data;
  },

  updateSalaryConfig: async (id: string, data: any) => {
    const response = await api.put<{ success: boolean; data: SalaryConfig }>(`/payroll/salary-configs/${id}`, data);
    return response.data;
  },

  deleteSalaryConfig: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/payroll/salary-configs/${id}`);
    return response.data;
  },

  // Payslips
  getPayslips: async (params: { page?: number; limit?: number; employeeId?: string; month?: number; year?: number; status?: string }) => {
    const response = await api.get<PayslipsResponse>('/payroll/payslips', { params });
    return response.data;
  },

  getPayslipById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Payslip }>(`/payroll/payslips/${id}`);
    return response.data;
  },

  generatePayslip: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Payslip }>('/payroll/payslips/generate', data);
    return response.data;
  },

  updatePayslipStatus: async (id: string, status: string) => {
    const response = await api.patch<{ success: boolean; data: Payslip }>(`/payroll/payslips/${id}/status`, { status });
    return response.data;
  },

  deletePayslip: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/payroll/payslips/${id}`);
    return response.data;
  },

  downloadPayslipPDF: async (id: string): Promise<Blob> => {
    const response = await api.get(`/payroll/payslips/${id}/download`, {
      responseType: 'blob',
    });
    return response.data as unknown as Blob;
  },

  sendPayslipEmail: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/payroll/payslips/${id}/send-email`);
    return response.data;
  },

  publishPayslips: async (month: number, year: number) => {
    const response = await api.post<{ success: boolean; message: string }>('/payroll/payslips/publish', { month, year });
    return response.data;
  },

  exportPayslipsExcel: async (params: { month?: number; year?: number; status?: string }): Promise<Blob> => {
    const response = await api.get(`/payroll/payslips/export/excel`, {
      params,
      responseType: 'blob',
    });
    return response.data as unknown as Blob;
  },
};

export default payrollService;
