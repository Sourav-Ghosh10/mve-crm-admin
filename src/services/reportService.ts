import axios from "axios";
import api from "./api";

export interface ReportParams {
    type: 'exception' | 'offday_work' | 'holiday' | 'attendance' | 'leave' | 'financial';
    format: 'pdf' | 'csv' | 'excel' | 'xlsx';
    startDate?: string;
    endDate?: string;
    department?: string;
    year?: number;
    status?: string;
    designation?: string;
    search?: string;
    limit?: number;
    exchangeRate?: number;
    currency?: 'INR' | 'USD';
}

export const reportService = {
    getExchangeRate: async (): Promise<number> => {
        try {
            const { data } = await axios.get('https://open.er-api.com/v6/latest/USD');
            return data?.rates?.INR ? Number(data.rates.INR.toFixed(2)) : 83.25;
        } catch (error) {
            console.error("Failed to fetch exchange rate in reportService", error);
            return 83.25; // Fallback
        }
    },

    generateReport: async (params: ReportParams) => {
        try {
            const response = await api.get("/reports/generate", {
                params,
                responseType: 'blob',
            });

            // Determine extension based on format
            const isExcel = params.format === 'csv' || params.format === 'excel' || params.format === 'xlsx';
            const ext = isExcel ? 'xlsx' : (params.format || 'pdf');
            const mimeType = isExcel
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/pdf';

            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Build a descriptive filename with month-year
            const now = new Date();
            const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const filename = `attendance_report_${monthYear}.${ext}`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download report:", error);
            throw error;
        }
    }
};
