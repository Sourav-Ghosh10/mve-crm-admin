import React, { useState, useEffect, useCallback } from "react";
import {
    CheckCircle2,
    XCircle,
    Clock,
    ArrowUpRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import Table from "../../components/common/Table";
import { reimbursementService } from "../../services/reimbursementService";
import { reimbursementTypeService } from "../../services/reimbursementTypeService";
import type { Reimbursement, ReimbursementType } from "../../types/reimbursement.types";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../hooks/useDebounce";
import UnifiedFilter from "../../components/common/Filter/UnifiedFilter";
import Pagination from "../../components/common/Pagination";
import { SearchInput } from "../../components/common/Search/SearchInput";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import Avatar from "../../components/common/Avatar";
import TimezoneToggle from "../../components/common/TimezoneToggle";

const ReimbursementsList: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get filters from URL or defaults
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "pending");
    const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") || "all");
    const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [activeTypes, setActiveTypes] = useState<ReimbursementType[]>([]);

    // Pagination constants
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Sync state to URL
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (statusFilter !== "pending") params.status = statusFilter;
        if (typeFilter !== "all") params.type = typeFilter;
        if (page > 1) params.page = page.toString();
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearchTerm, statusFilter, typeFilter, page, setSearchParams]);

    const fetchReimbursements = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const response = await reimbursementService.getAll({
                page: currentPage,
                limit,
                search: debouncedSearchTerm.trim() || undefined,
                status: statusFilter === "all" ? undefined : statusFilter,
                reimbursementType: typeFilter === "all" ? undefined : typeFilter,
            });
            setReimbursements(response.data);
            setTotalPages(response.pagination.pages);
        } catch (error) {
            console.error("Failed to fetch reimbursements:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, typeFilter, limit]);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const types = await reimbursementTypeService.getActive();
                setActiveTypes(types);
            } catch (error) {
                console.error("Failed to fetch reimbursement types:", error);
            }
        };
        fetchTypes();
        fetchReimbursements(page);
    }, [fetchReimbursements, page]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchReimbursements(newPage);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved':
                return "bg-success/10 text-success border-success/20";
            case 'rejected':
                return "bg-error/10 text-error border-error/20";
            case 'pending':
                return "bg-warning/10 text-warning border-warning/20";
            default:
                return "bg-muted text-foreground-tertiary border-border";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="w-3 h-3" />;
            case 'rejected':
                return <XCircle className="w-3 h-3" />;
            case 'pending':
                return <Clock className="w-3 h-3" />;
            default:
                return null;
        }
    };

    const columns = [
        {
            _id: "employee",
            label: "Employee",
            format: (_: unknown, row: Reimbursement) => {
                const emp = typeof row.employeeId === 'object' ? row.employeeId : null;
                const firstName = emp?.personalInfo?.firstName || emp?.firstName || "Unknown";
                const lastName = emp?.personalInfo?.lastName || emp?.lastName || "";
                const profilePicture = emp?.personalInfo?.profilePicture;

                return (
                    <div className="flex items-center gap-4 py-1">
                        <Avatar
                            src={profilePicture}
                            firstName={firstName}
                            lastName={lastName}
                            size="md"
                            className="shadow-lg shadow-primary/10"
                        />
                        <div>
                            <div className="font-black text-foreground text-sm tracking-tight">{firstName} {lastName}</div>
                            {/* <div className="text-[10px] font-bold text-foreground-tertiary uppercase truncate max-w-[150px]">
                                ID: {emp?._id?.slice(-6) || "N/A"}
                            </div> */}
                        </div>
                    </div>
                );
            },
        },
        {
            _id: "type",
            label: "Details",
            format: (_: unknown, row: Reimbursement) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{row.title}</span>
                    <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest px-2 py-0.5 rounded-md bg-muted border border-border/50 w-fit mt-1">
                        {row.reimbursementType}
                    </span>
                </div>
            )
        },
        {
            _id: "amount",
            label: "Amount",
            format: (_: unknown, row: Reimbursement) => (
                <div className="flex flex-col">
                    <span className="font-black text-foreground text-base">₹{row.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-foreground-tertiary font-bold uppercase tracking-tighter">
                        {format(new Date(row.expenseDate), "MMM dd, yyyy")}
                    </span>
                </div>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: Reimbursement) => (
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border w-fit",
                    getStatusStyle(row.status)
                )}>
                    {getStatusIcon(row.status)}
                    {row.status}
                </div>
            )
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: Reimbursement) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => navigate(`/reimbursements/${row._id}`)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all border border-transparent hover:border-primary/20 group"
                    >
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            ),
        },
    ];

    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Loading Reimbursements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-2 sm:px-0 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Reimbursement Requests</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Manage and approve employee expense claims.
                    </p>
                </div>
                <TimezoneToggle variant="horizontal" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="reimbursements"
                        placeholder="Search by title or employee..."
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
                                    { value: "pending", label: "Pending" },
                                    { value: "approved", label: "Approved" },
                                    { value: "rejected", label: "Rejected" },
                                ]
                            },
                            {
                                id: "type",
                                label: "Expense Type",
                                value: typeFilter,
                                onChange: setTypeFilter,
                                options: [
                                    { value: "all", label: "All Types" },
                                    ...activeTypes.map(t => ({ value: t.name, label: t.name }))
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
                    columns={columns}
                    rows={reimbursements}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Requests Found"
                            description={searchTerm ? `No requests matching "${searchTerm}" found.` : "No reimbursement requests available at this time."}
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
        </div>
    );
};

export default ReimbursementsList;
