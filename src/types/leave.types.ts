export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = string;

export interface LeaveAttachment {
    fileName: string;
    fileUrl: string;
    s3Key?: string;
    _id?: string;
    id?: string;
}

export interface LeaveRequest {
    _id: string;
    employeeId: string | {
        id: string;
        _id: string;
        employeeId: string;
        fullName: string;
        personalInfo: {
            firstName: string;
            lastName: string;
            profilePicture?: string;
        };
        employment: {
            designation: string;
            timezone?: string;
            reportingManager?: string | {
                _id: string;
                personalInfo: {
                    firstName: string;
                    lastName: string;
                };
            };
            workingHours?: {
                startTime: string;
                endTime: string;
                weeklyOff: string[];
            };
        };
    };
    leaveType: LeaveType;
    startDate: string; // ISO Date string
    endDate: string;   // ISO Date string
    numberOfDays: number;
    halfDay: boolean;
    reason: string;
    status: LeaveStatus;
    attachments: (string | LeaveAttachment)[];
    createdAt: string;
    updatedAt: string;
    approvedBy?: string;
    rejectionReason?: string;
    autoApproved: boolean;
}

export type LeaveBalance = Record<string, number>;

export interface LeaveBalanceDetails {
    leaveTypeId?: string;
    name: string;
    code: string;
    currentBalance: number | null;
    totalAllocated: number | null;
    isPaid: boolean;
    workingHoursPerDay?: number;
}

export interface EmployeeLeaveBalanceResponse {
    userId: string;
    name: string;
    department: string;
    balances: LeaveBalanceDetails[];
}

