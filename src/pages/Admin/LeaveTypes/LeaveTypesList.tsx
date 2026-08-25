import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Edit,
    FileText,
    Archive,
    RefreshCw,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import { leaveTypeService } from "../../../services/leaveTypeService";
import type { LeaveType, OrganizationFilters, LeaveTypeInput } from "../../../types/organization.types";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import LeaveTypeForm from "./LeaveTypeForm";
import UnifiedFilter from "../../../components/common/Filter/UnifiedFilter";
import Pagination from "../../../components/common/Pagination";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";

const LeaveTypesList: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
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
    const [currentLeaveType, setCurrentLeaveType] = useState<Partial<LeaveType> | null>(null);

    const { hasPermission: canManage } = usePermissions(PERMISSIONS.LEAVE_TYPE_MANAGE);

    const fetchLeaveTypes = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const filters: OrganizationFilters = {
                page: currentPage,
                limit,
                search: debouncedSearchTerm.trim() || undefined,
                isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
            };
            const response = await leaveTypeService.getAll(filters);
            setLeaveTypes(response.data);
            setTotalPages(response.totalPages);

            const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all";
            if (!hasActiveFilters && response.total === 0) {
                setHasData(false);
            } else if (response.total > 0) {
                setHasData(true);
            }
        } catch (error) {
            console.error("Failed to fetch leave types:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, limit]);

    useEffect(() => {
        fetchLeaveTypes(1);
        setPage(1);
    }, [fetchLeaveTypes]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchLeaveTypes(newPage);
    };

    const handleToggleStatus = async (leaveType: LeaveType) => {
        const action = leaveType.isActive ? "deactivate" : "activate";
        const confirmed = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Leave Type`,
            message: leaveType.isActive
                ? `Are you sure you want to deactivate "${leaveType.name}" ? It will be hidden from new leave requests but preserved in the database.`
                : `Are you sure you want to reactivate "${leaveType.name}" ? It will become available for leave requests again.`,
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant: leaveType.isActive ? 'danger' : 'info'
        });

        if (confirmed) {
            try {
                await leaveTypeService.toggleStatus(leaveType._id, !leaveType.isActive);
                fetchLeaveTypes(page);
            } catch (error) {
                console.error(`Failed to ${action} leave type: `, error);
                const errorMessage = getErrorMessage(error, `Failed to ${action} leave type`);
                alert(errorMessage);
            }
        }
    };



    const handleEdit = (leaveType: LeaveType) => {
        setCurrentLeaveType(leaveType);
        setError(null);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentLeaveType({ isActive: true, isPaid: true });
        setError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: LeaveTypeInput) => {
        try {
            setFormLoading(true);
            setError(null);
            if (currentLeaveType?._id) {
                await leaveTypeService.update(currentLeaveType._id, data);
            } else {
                await leaveTypeService.create(data);
            }
            setIsModalOpen(false);
            fetchLeaveTypes(page);
        } catch (error) {
            console.error("Failed to save leave type:", error);
            const errorMessage = getErrorMessage(error, "Failed to save leave type.");
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        {
            _id: "name",
            label: "Leave Type",
            format: (_: unknown, row: LeaveType) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
                        <FileText className="w-6 h-6" />
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
            _id: "isPaid",
            label: "Paid",
            format: (_: unknown, row: LeaveType) => (
                <span
                    className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase border",
                        row.isPaid
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                >
                    {row.isPaid ? "Paid" : "Unpaid"}
                </span>
            )
        },
        {
            _id: "allowance",
            label: "Allowance",
            format: (_: unknown, row: LeaveType) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{row.defaultAmount} Days</span>
                    <span className="text-[10px] text-foreground-tertiary uppercase font-black">{row.resetFrequency}</span>
                </div>
            )
        },
        {
            _id: "departments",
            label: "Departments",
            format: (_: unknown, row: LeaveType) => {
                if (row.applicableDepartments.includes('all')) {
                    return <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 w-fit">All</span>;
                }
                const text = row.applicableDepartments.join(', ');
                return (
                    <div className="text-[10px] font-bold text-foreground-tertiary leading-relaxed line-clamp-2 max-w-[140px]" title={text}>
                        {text}
                    </div>
                );
            }
        },
        {
            _id: "designations",
            label: "Designations",
            format: (_: unknown, row: LeaveType) => {
                if (row.applicableDesignations?.includes('all')) {
                    return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 w-fit">All</span>;
                }
                const text = row.applicableDesignations?.join(', ') || "N/A";
                return (
                    <div className="text-[10px] font-bold text-foreground-tertiary leading-relaxed line-clamp-2 max-w-[140px]" title={text}>
                        {text}
                    </div>
                );
            }
        },
        {
            _id: "carryForward",
            label: "Carry Forward",
            format: (_: unknown, row: LeaveType) => (
                <span className="text-foreground-secondary text-xs font-medium">
                    Up to {row.maxCarryForward} Days
                </span>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: LeaveType) => (
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
            format: (_: unknown, row: LeaveType) => {
                if (!row.isPaid) return null;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => handleEdit(row)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                            title="Edit Leave Type"
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
                );
            },
        },
    ];

    const displayColumns = canManage ? columns : columns.filter(col => col._id !== 'actions');

    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Loading Leave Types...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Leave Types</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Manage the types of leave available to employees.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleAdd}
                        startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    >
                        Add Leave Type
                    </Button>
                )}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="leave-types"
                        placeholder="Search leave types..."
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
                    rows={leaveTypes}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Leave Types Found"
                            description={searchTerm ? `No leave types matching "${searchTerm}" found.` : "Add your first leave type to get started."}
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
                title={currentLeaveType?._id ? "Edit Leave Type" : "Add Leave Type"}
                maxWidth="lg"
            >
                <LeaveTypeForm
                    initialValues={currentLeaveType || {}}
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

export default LeaveTypesList;
