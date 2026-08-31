export interface OfficeLocation {
    _id: string;
    id: string;
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactInfo: {
        phone?: string;
        email?: string;
    };
    isHeadquarters: boolean;
    isActive: boolean;
    deletedAt?: string | null;
    timezone: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Department {
    _id: string;
    id: string;
    name: string;
    description?: string;
    employeeCount?: number;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface Designation {
    _id: string;
    title?: string;
    name?: string;
    department?: {
        _id: string;
        name: string;
    } | string;
    description?: string;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    employeeCount?: number;
}

export interface DesignationInput {
    title: string;
    department?: string;
    description?: string;
    isActive: boolean;
}

export interface DepartmentInput {
    name: string;
    description?: string;
    isActive: boolean;
}

export interface OfficeLocationInput {
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactInfo: {
        phone?: string;
        email?: string;
    };
    isHeadquarters: boolean;
    isActive: boolean;
    timezone: string;
}

export interface Holiday {
    _id: string;
    name: string;
    date: string; // ISO date string
    description?: string;
    isRecurring: boolean; // Whether it repeats annually
    isActive: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface HolidayInput {
    name: string;
    date: string;
    description?: string;
    isRecurring: boolean;
    isActive: boolean;
}


export interface OrganizationFilters {
    search?: string;
    isActive?: boolean;
    department?: string; // For designation filtering
    startDate?: string;
    endDate?: string;
    month?: string;
    year?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface LeaveType {
    _id: string;
    id?: string;
    name: string;
    code: string;
    description?: string;
    isPaid: boolean;
    defaultAmount: number;
    applicableDepartments: string[]; // List of department names or ['all']
    applicableDesignations: string[]; // List of designation names or ['all']
    maxCarryForward: number;
    resetFrequency: 'monthly' | 'yearly';
    isActive: boolean;
    accrualType?: 'fixed' | 'hourly';
    annualEntitlement?: number;
    workingHoursPerDay?: number;
    hourlyAccrualRate?: number;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeaveTypeInput {
    name: string;
    code: string;
    description?: string;
    isPaid: boolean;
    defaultAmount: number;
    applicableDepartments: string[];
    applicableDesignations: string[];
    maxCarryForward: number;
    resetFrequency: 'monthly' | 'yearly';
    isActive: boolean;
    accrualType?: 'fixed' | 'hourly';
    annualEntitlement?: number;
    workingHoursPerDay?: number;
    hourlyAccrualRate?: number;
}

export interface BreakType {
    _id: string;
    name: string;
    code: string;
    description?: string;
    maxDuration: number;
    isPaid: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface BreakTypeInput {
    name: string;
    code: string;
    description?: string;
    maxDuration: number;
    isPaid: boolean;
    isActive: boolean;
}



