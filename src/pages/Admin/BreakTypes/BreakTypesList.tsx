import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Edit,
    Coffee,
    Trash2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import { breakTypeService } from "../../../services/breakTypeService";
import type { BreakType, OrganizationFilters, BreakTypeInput } from "../../../types/organization.types";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import BreakTypeForm from "./BreakTypeForm";
import UnifiedFilter from "../../../components/common/Filter/UnifiedFilter";
import Pagination from "../../../components/common/Pagination";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";

const BreakTypesList: React.FC = () => {
    const [breakTypes, setBreakTypes] = useState<BreakType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hasData, setHasData] = useState(true);
    const [error, setError] = useState<string | string[] | null>(null);

    const { confirm, ConfirmationDialog } = useConfirmation();

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBreakType, setCurrentBreakType] = useState<Partial<BreakType> | null>(null);

    const { hasPermission: canManage } = usePermissions(PERMISSIONS.BREAK_TYPE_MANAGE);

    const fetchBreakTypes = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const filters: OrganizationFilters = {
                page: currentPage,
                limit,
                search: debouncedSearchTerm.trim() || undefined,
                isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
            };
            const response = await breakTypeService.getAll(filters);
            setBreakTypes(response.data);
            setTotalPages(response.totalPages);

            const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all";
            if (!hasActiveFilters && response.total === 0) {
                setHasData(false);
            } else if (response.total > 0) {
                setHasData(true);
            }
        } catch (error) {
            console.error("Failed to fetch break types:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, limit]);

    useEffect(() => {
        fetchBreakTypes(1);
        setPage(1);
    }, [fetchBreakTypes]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchBreakTypes(newPage);
    };

    const handleDelete = async (breakType: BreakType) => {
        const confirmed = await confirm({
            title: `Delete Break Type`,
            message: `Are you sure you want to delete "${breakType.name}"? This action cannot be undone.`,
            confirmLabel: "Delete",
            variant: 'danger'
        });

        if (confirmed) {
            try {
                await breakTypeService.delete(breakType._id);
                fetchBreakTypes(page);
            } catch (error) {
                console.error(`Failed to delete break type: `, error);
                const errorMessage = getErrorMessage(error, `Failed to delete break type`);
                alert(errorMessage);
            }
        }
    };

    const handleEdit = (breakType: BreakType) => {
        setCurrentBreakType(breakType);
        setError(null);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentBreakType({ isActive: true, maxDuration: 15, isPaid: false });
        setError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: BreakTypeInput) => {
        try {
            setFormLoading(true);
            setError(null);
            if (currentBreakType?._id) {
                await breakTypeService.update(currentBreakType._id, data);
            } else {
                await breakTypeService.create(data);
            }
            setIsModalOpen(false);
            fetchBreakTypes(page);
        } catch (error) {
            console.error("Failed to save break type:", error);
            const errorMessage = getErrorMessage(error, "Failed to save break type.");
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        {
            _id: "name",
            label: "Break Type",
            format: (_: unknown, row: BreakType) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
                        <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-black text-foreground text-base tracking-tight">{row.name}</div>
                        <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50 w-fit mt-1">
                            {row.code}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            _id: "maxDuration",
            label: "Max Duration",
            format: (_: unknown, row: BreakType) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{row.maxDuration} Minutes</span>
                </div>
            )
        },
        {
            _id: "isPaid",
            label: "Type",
            format: (_: unknown, row: BreakType) => (
                <span
                    className={cn(
                        "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
                        row.isPaid
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-warning/10 text-warning border-warning/20"
                    )}
                >
                    {row.isPaid ? "Paid" : "Unpaid"}
                </span>
            ),
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: BreakType) => (
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
            format: (_: unknown, row: BreakType) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                        title="Edit Break Type"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-danger/10 hover:text-danger text-foreground-secondary transition-all"
                        title="Delete Break Type"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
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
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Loading Break Types...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Break Types</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Manage different types of breaks available for employees.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleAdd}
                        startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    >
                        Add Break Type
                    </Button>
                )}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="break-types"
                        placeholder="Search break types..."
                        disabled={!hasData}
                    />
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2">
                    <UnifiedFilter
                        filters={[
                            {
                                id: "status",
                                label: "Status",
                                value: statusFilter,
                                onChange: setStatusFilter,
                                options: [
                                    { value: "all", label: "All Status" },
                                    { value: "active", label: "Active Only" },
                                    { value: "inactive", label: "Inactive Only" },
                                ]
                            }
                        ]}
                    />
                </div>
            </div>

            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Updating List...</p>
                    </div>
                )}
                <Table
                    columns={displayColumns}
                    rows={breakTypes}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Break Types Found"
                            description={searchTerm ? `No break types matching "${searchTerm}" found.` : "Add your first break type to get started."}
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
                title={currentBreakType?._id ? "Edit Break Type" : "Add Break Type"}
                maxWidth="lg"
            >
                <BreakTypeForm
                    initialValues={currentBreakType || {}}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={formLoading}
                    error={error}
                />
            </Modal>
            {ConfirmationDialog}
        </div >
    );
};

export default BreakTypesList;
