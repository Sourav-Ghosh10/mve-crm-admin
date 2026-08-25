export type ReimbursementStatus = 'pending' | 'approved' | 'rejected';

export interface ReimbursementAttachment {
    fileName: string;
    fileUrl: string;
}

export interface Reimbursement {
    _id: string;
    employeeId: string | {
        _id: string;
        firstName: string;
        lastName: string;
        employeeId: string;
        personalInfo?: {
            firstName: string;
            lastName: string;
            profilePicture?: string;
        };
    };
    reimbursementType: string;
    title: string;
    description: string;
    amount: number;
    expenseDate: string;
    status: ReimbursementStatus;
    attachments: ReimbursementAttachment[];
    rejectionReason?: string;
    approvedAt?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReimbursementUpdateStatus {
    status: ReimbursementStatus;
    rejectionReason?: string;
}

export interface PaginatedReimbursementResponse {
    success: boolean;
    data: Reimbursement[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface ReimbursementType {
    _id: string;
    name: string;
    description?: string;
    maxAmount?: number;
    requiresReceipt: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ReimbursementTypeInput {
    name: string;
    description?: string;
    maxAmount?: number;
    requiresReceipt: boolean;
    isActive: boolean;
}
