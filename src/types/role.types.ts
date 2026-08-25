export interface Role {
    _id: string;
    id: string;
    name: string;
    description?: string;
    permissions?: string[];
    isActive: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleInput {
    name: string;
    description?: string;
    permissions?: string[];
    isActive: boolean;
}

export interface RoleFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
