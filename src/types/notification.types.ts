export interface Notification {
    _id: string;
    recipientId: string;
    type: string;
    title: string;
    message: string;
    relatedEntity: {
        entityType: "absence" | "leave" | "announcement" | "system";
        entityId: string;
    };
    actionUrl: string;
    priority: "low" | "medium" | "high";
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    message: string | null; // For toast notifications
    type: "info" | "success" | "warning" | "error";
}
