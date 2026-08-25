import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Edit,
    Archive,
    RefreshCw,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import { designationService } from "../../../services/designationService";
import { departmentService } from "../../../services/departmentService";
import type { Designation, OrganizationFilters, DesignationInput } from "../../../types/organization.types";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import DesignationForm from "./DesignationForm";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";

const DesignationsList: React.FC = () => {
    const [designations, setDesignations] = useState<Designation[]>([]);


    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const [hasData, setHasData] = useState(true); // Track if any data exists
    const [error, setError] = useState<string | string[] | null>(null);

    const { confirm, ConfirmationDialog } = useConfirmation();

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDesignation, setCurrentDesignation] = useState<Partial<Designation> | null>(null);

    const { hasPermission: canManage } = usePermissions(PERMISSIONS.DESIGNATION_MANAGE);

    const fetchData = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const filters: OrganizationFilters = {
                page: currentPage,
                limit,
                search: debouncedSearchTerm.trim() || undefined,
                isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
                department: undefined,
            };

            const [designationRes] = await Promise.all([
                designationService.getAll(filters),
                departmentService.getAll({ limit: 100 })
            ]);

            setDesignations(designationRes.data);
            setTotalPages(designationRes.totalPages);


            // Only disable search if there's no data AND no active filters/search
            const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all";
            if (!hasActiveFilters && designationRes.total === 0) {
                setHasData(false);
            } else if (designationRes.total > 0) {
                setHasData(true);
            }
        } catch (error) {
            console.error("Failed to fetch designations:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, limit]);

    useEffect(() => {
        fetchData(1);
        setPage(1);
    }, [fetchData]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData(newPage);
    };



    const handleToggleStatus = async (designation: Designation) => {
        const action = designation.isActive ? "deactivate" : "activate";
        const displayName = designation.title || designation.name || "Untitled";

        const confirmed = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Designation`,
            message: `Are you sure you want to ${action} "${displayName}"? ${designation.isActive ? "This will archive the designation." : ""}`,
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant: designation.isActive ? 'danger' : 'info'
        });

        if (confirmed) {
            try {
                await designationService.toggleStatus(designation._id, !designation.isActive);
                fetchData(page);
            } catch (error) {
                console.error(`Failed to ${action} designation: `, error);

                const errorMessage = getErrorMessage(error, `Failed to ${action} designation`);
                alert(errorMessage);
            }
        }
    };

    const handleEdit = async (designation: Designation) => {
        // await fetchActiveDepartments(); // No longer needed
        setCurrentDesignation({
            ...designation,
            title: designation.title || designation.name // Ensure title is populated for the form
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleAdd = async () => {
        // await fetchActiveDepartments(); // No longer needed
        setCurrentDesignation({ isActive: true });
        setError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: DesignationInput) => {
        try {
            setFormLoading(true);
            setError(null);
            const payload = { ...data };
            if (!payload.department) delete payload.department;

            if (currentDesignation?._id) {
                await designationService.update(currentDesignation._id, payload);
            } else {
                await designationService.create(payload);
            }
            setIsModalOpen(false);
            fetchData(page);
        } catch (error) {
            console.error("Failed to save designation:", error);

            const errorMessage = getErrorMessage(error, "Failed to save archetype configuration.");
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        {
            _id: "title",
            label: "Designation Title",
            format: (_: unknown, row: Designation) => (
                <div className="flex flex-col">
                    <span className="font-black text-foreground uppercase tracking-tight">
                        {row.title || row.name || ""}
                    </span>
                </div>
            ),
        },

        {
            _id: "description",
            label: "Description",
            format: (_: unknown, row: Designation) => (
                <div className="max-w-[250px] text-xs font-medium text-foreground-secondary line-clamp-2 leading-relaxed">
                    {row.description || "No description provided."}
                </div>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: Designation) => (
                <span className={cn(
                    "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
                    row.isActive
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-foreground-tertiary border-border"
                )}>
                    {row.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: Designation) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                        title="Edit Designation"
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
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Initializing Archetypes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Designations</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Define professional roles and responsibilities.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleAdd}
                        startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    >
                        Add Designation
                    </Button>
                )}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="designations"
                        placeholder="Search designations..."
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
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Registry...</p>
                    </div>
                )}
                <Table
                    columns={displayColumns}
                    rows={designations}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Designations Found"
                            description={searchTerm ? `No designations matching "${searchTerm}" found.` : "Add your first designation to populate the list."}
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

            {isModalOpen && (
                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={currentDesignation?._id ? "Edit Designation" : "Add Designation"}
                    maxWidth="md"
                >
                    <DesignationForm
                        initialValues={currentDesignation || {}}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={formLoading}
                        error={error}
                    />
                </Modal>
            )}
            {ConfirmationDialog}
        </div>
    );
};

export default DesignationsList;
