export const Currency = {
    USD: 'USD',
    GBP: 'GBP',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export interface PrimaryContact {
    name: string;
    email: string;
    phone: string;
}

export interface PortalAccess {
    enabled: boolean;
    primaryContactUserId?: string | null;
    createdAt?: string | null;
    lastAccessedAt?: string | null;
}

export interface Client {
    id: string;
    name: string;
    primary_contact: PrimaryContact;
    city: string;
    timezone: string;
    referral_source?: string;
    discovery_source?: string;
    onboarding_date: string; // ISO date string
    billing_rate: number;
    currency: Currency;
    internal_expense_inr: number;
    is_active: boolean;
    communication_preference: 'email' | 'whatsapp' | 'both';
    assigned_employees: string[]; // Array of employee IDs (User IDs)
    portalAccess?: PortalAccess; // NEW: Portal login configuration
}

export interface CreateClientRequest extends Omit<Client, 'id' | 'assigned_employees'> {
    assigned_employees?: string[];
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
    id: string;
}

export interface ClientFilters {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}

export interface PaginatedClientResponse {
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CurrencySummary {
    currency: Currency;
    totalBillingRate: number;
    totalInternalExpenseINR: number;
    clientCount: number;
}

export interface ProfitSummary {
    byCurrency: Record<string, CurrencySummary>;
    totalInternalExpenseINR: number;
    totalClients: number;
}
