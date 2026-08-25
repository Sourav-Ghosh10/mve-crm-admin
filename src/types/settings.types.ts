export interface SystemSetting {
    _id?: string;
    key: string;
    value: any;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeaveNotificationConfig {
    emails: string[];
}
