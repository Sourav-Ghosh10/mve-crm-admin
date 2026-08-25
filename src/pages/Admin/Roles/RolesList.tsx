import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Edit,
    Shield,
    Archive,
    RefreshCw,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import { roleService } from "../../../services/roleService";
import type { Role, RoleFilters, RoleInput } from "../../../types/role.types";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import RoleForm from "./RoleForm";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";

const RolesList: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hasData, setHasData] = useState(true);
    const [error, setError] = useState<string | string[] | null>(null);

    const { confirm, ConfirmationDialog } = useConfirmation();

    // Permissions
    const { hasPermission: canManage } = usePermissions(PERMISSIONS.ROLE_MANAGE);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);

    const fetchRoles = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const filters: RoleFilters = {
                page: currentPage,
                limit,
                search: debouncedSearchTerm.trim() || undefined,
                isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
            };
            const response = await roleService.getAll(filters);
            setRoles(response.data);
            setTotalPages(response.totalPages);

            const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all";
            if (!hasActiveFilters && response.total === 0) {
                setHasData(false);
            } else if (response.total > 0) {
                setHasData(true);
            }
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, limit]);

    useEffect(() => {
        fetchRoles(1);
        setPage(1);
    }, [fetchRoles]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchRoles(newPage);
    };

    const handleToggleStatus = async (role: Role) => {
        const action = role.isActive ? "deactivate" : "activate";

        const confirmed = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Role`,
            message: role.isActive
                ? `Are you sure you want to deactivate "${role.name}"? It will be hidden from dropdowns but preserved in the database.`
                : `Are you sure you want to reactivate "${role.name}"? It will become available in dropdowns again.`,
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant: role.isActive ? 'danger' : 'info'
        });

        if (confirmed) {
            try {
                await roleService.toggleStatus(role._id, !role.isActive);
                fetchRoles(page);
            } catch (error) {
                console.error(`Failed to ${action} role: `, error);
                const errorMessage = getErrorMessage(error, `Failed to ${action} role`);
                alert(errorMessage);
            }
        }
    };



    const handleEdit = (role: Role) => {
        setCurrentRole(role);
        setError(null);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentRole({ isActive: true, permissions: [] });
        setError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: RoleInput) => {
        try {
            setFormLoading(true);
            setError(null);
            if (currentRole?._id) {
                await roleService.update(currentRole._id, data);
            } else {
                await roleService.create(data);
            }
            setIsModalOpen(false);
            fetchRoles(page);
        } catch (error) {
            console.error("Failed to save role:", error);
            const errorMessage = getErrorMessage(error, "Failed to save role configuration.");
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        {
            _id: "name",
            label: "Roles",
            format: (_: unknown, row: Role) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-black text-foreground text-base tracking-tight">{row.name}</div>
                        {row.permissions && (
                            <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50 w-fit mt-1">
                                {row.permissions?.length || 0} Permissions
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            _id: "description",
            label: "Description",
            format: (value: unknown) => (
                <span className="text-foreground-secondary text-xs line-clamp-1 max-w-xs">
                    {typeof value === 'string' ? value : "No description provided"}
                </span>
            ),
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: Role) => (
                <span
                    className={cn(
                        "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
                        row.isActive
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-foreground-tertiary border-border"
                    )}
                >
                    {row.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: Role) => (
                <div className="flex items-center justify-end gap-2">
                    {canManage && (
                        <>
                            <button
                                onClick={() => handleEdit(row)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                                title="Edit Role"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleToggleStatus(row)}
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                    row.isActive ? "hover:bg-warning/10 hover:text-warning" : "hover:bg-success/10 hover:text-success",
                                    "text-foreground-secondary"
                                )}
                                title={row.isActive ? "Deactivate" : "Activate"}
                            >
                                {row.isActive ? <Archive className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                            </button>

                        </>
                    )}
                </div>
            ),
        },
    ];

    const displayColumns = canManage ? columns : columns.filter(col => col._id !== 'actions');

    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Accessing Role Protocol...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Roles</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Define and manage security roles.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleAdd}
                        startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    >
                        Create Role
                    </Button>
                )}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="roles"
                        placeholder="Search roles..."
                        disabled={!hasData}
                    />
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                    <FilterDropdown
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full lg:w-[200px]"
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "active", label: "Active Only" },
                            { value: "inactive", label: "Inactive Only" },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Role Matrix...</p>
                    </div>
                )}
                <Table
                    columns={displayColumns}
                    rows={roles}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="Zero Role Signals"
                            description={searchTerm ? `The role protocol "${searchTerm}" is not present.` : "Initialize your first role to establish access protocols."}
                            className="py-24"
                        />
                    }
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                        Page <span className="text-primary">{page}</span> of {totalPages || 1}
                    </div>
                </div>

                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentRole?._id ? "Modify Role Configuration" : "Initialize Security Role"}
                maxWidth="lg"
            >
                <RoleForm
                    initialValues={currentRole || {}}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={formLoading}
                    error={error}
                />
            </Modal>
            {ConfirmationDialog}
        </div>
    );
};

export default RolesList;
