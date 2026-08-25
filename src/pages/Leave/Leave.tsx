import React, { useEffect, useState, useCallback } from "react";
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
} from "lucide-react";
import { cn } from "../../lib/utils";
import Button from "../../components/common/Button";
import { SearchInput } from "../../components/common/Search/SearchInput";
import TextArea from "../../components/common/Input/TextArea";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import Table from "../../components/common/Table/Table";
import { leaveService, type PaginatedLeaveResponse } from "../../services/leaveService";
import type { LeaveRequest, LeaveStatus } from "../../types/leave.types";
import { useLeaveColumns } from "./useLeaveColumns";
import { toast } from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";
import UnifiedFilter from "../../components/common/Filter/UnifiedFilter";
import Pagination from "../../components/common/Pagination";
import FilterDropdown from "../../components/common/Filter/FilterDropdown";
import StatCard from "../../components/common/Stats/StatCard";
import { useAppSelector } from "../../store/hooks";
import TimezoneToggle from "../../components/common/TimezoneToggle";

import { useSearchParams } from "react-router-dom";

const Leave: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Get filters from URL or defaults
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>((searchParams.get("status") as LeaveStatus | 'all') || 'pending');
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Initial page from URL
    const initialPage = Number(searchParams.get("page")) || 1;

    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    // Stats state
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        approvedToday: 0,
        rejectedTotal: 0,
        totalRequests: 0
    });

    // Pagination state
    const [pagination, setPagination] = useState({
        total: 0,
        page: initialPage,
        limit: 10,
        totalPages: 1
    });

    // Sync state to URL
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== "pending") params.status = statusFilter;
        if (pagination.page > 1) params.page = pagination.page.toString();
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, statusFilter, pagination.page, setSearchParams]);

    // Action Modal State
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionComment, setActionComment] = useState("");
    const [processingAction, setProcessingAction] = useState(false);
    const [isDeductFromBalance, setIsDeductFromBalance] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const data = await leaveService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch leave stats:", error);
        }
    }, []);

    const fetchRequests = useCallback(async (page = 1, isInitial = false) => {
        try {
            if (isInitial) {
                setInitialLoading(true);
            } else {
                setTableLoading(true);
            }
            const response: PaginatedLeaveResponse = await leaveService.getRequests({
                page,
                limit: pagination.limit,
                status: statusFilter,
                search: debouncedSearch.trim() || undefined,
            });
            setRequests(response.data);
            setPagination(response.pagination);

            // If we are on 'all' filter, we can update the total stat
            if (statusFilter === 'all' && !debouncedSearch.trim()) {
                setStats(prev => ({ ...prev, total: response.pagination.total }));
            }
            if (statusFilter === 'pending' && !debouncedSearch.trim()) {
                setStats(prev => ({ ...prev, pending: response.pagination.total }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load leave requests");
        } finally {
            setInitialLoading(false);
            setTableLoading(false);
        }
    }, [statusFilter, debouncedSearch, pagination.limit]);

    // Initial fetch - Only on mount
    useEffect(() => {
        fetchRequests(initialPage, true);
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch when filter or debounced search changes (reset to page 1)
    useEffect(() => {
        if (!initialLoading) {
            fetchRequests(1);
        }
    }, [statusFilter, debouncedSearch, initialLoading, fetchRequests]);

    const handleLimitChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
        // fetchRequests will be triggered by the effect if limit was in dependencies, 
        // but we need to ensure it's handled. Since limit is in pagination, we'll add it.
    };

    const handlePageChange = (newPage: number) => {
        fetchRequests(newPage);
    };

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return;

        if (actionType === 'reject' && !actionComment.trim()) {
            toast.error("Please provide a rejection reason.");
            return;
        }

        try {
            setProcessingAction(true);
            const status = actionType === 'approve' ? 'approved' : 'rejected';
            await leaveService.updateStatus(selectedRequest._id, status, actionComment, actionType === 'approve' ? isDeductFromBalance : undefined);

            toast.success(`Leave request ${status}`);
            setSelectedRequest(null);
            setActionType(null);
            setActionComment("");
            setIsDeductFromBalance(true);
            fetchRequests(pagination.page); // Refresh list at current page
            fetchStats(); // Also refresh stats
        } catch (error) {
            console.error(error);
            toast.error("Failed to update request status");
        } finally {
            setProcessingAction(false);
        }
    };

    const authUser = useAppSelector((state) => state.auth.user);

    const columns = useLeaveColumns({
        onApprove: (request) => {
            setSelectedRequest(request);
            setActionType('approve');
        },
        onReject: (request) => {
            setSelectedRequest(request);
            setActionType('reject');
        },
        currentUserId: authUser?._id,
        isAdmin: authUser?.isAdmin,
        canApproveLeave: authUser?.permissions?.canApproveLeave
    });

    if (initialLoading) return <GlobalLoader message="Loading Leave Approvals..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-2 sm:px-0">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Leave Approvals</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium text-sm sm:text-base">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Review and manage employee leave applications.
                    </p>
                </div>
                <TimezoneToggle variant="horizontal" />
                {/* <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="rounded-2xl border-border px-5 flex-1 md:flex-none h-11"
                        startIcon={<Download className="w-4 h-4" />}
                    >
                        Export PDF
                    </Button>
                </div> */}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals || 0}
                    icon={<Clock className="w-6 h-6" />}
                    color="warning"
                />
                <StatCard
                    title="Approved Today"
                    value={stats.approvedToday || 0}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="success"
                />
                <StatCard
                    title="Rejected Total"
                    value={stats.rejectedTotal || 0}
                    icon={<XCircle className="w-6 h-6" />}
                    color="error"
                />
                <StatCard
                    title="Total Requests"
                    value={stats.totalRequests || 0}
                    icon={<FileText className="w-6 h-6" />}
                    color="primary"
                />
            </div>

            {/* Filters & Search Row */}
            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm mb-6">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="leave-requests"
                        placeholder="Search by employee name..."
                    />
                </div>

                <div className="shrink-0 flex items-center justify-end gap-3">
                    <UnifiedFilter
                        filters={[
                            {
                                id: "status",
                                label: "Status",
                                value: statusFilter,
                                onChange: (val) => setStatusFilter(val as LeaveStatus | 'all'),
                                options: [
                                    { value: "all", label: "All Status" },
                                    { value: "pending", label: "Pending" },
                                    { value: "approved", label: "Approved" },
                                    { value: "rejected", label: "Rejected" },
                                ]
                            }
                        ]}
                    />
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden relative min-h-[400px]">
                {tableLoading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Requests...</p>
                    </div>
                )}

                <Table
                    columns={columns}
                    rows={requests}
                    className="border-none"
                    tableClassName="min-w-[800px]"
                    emptyState={
                        <div className="text-center py-24 px-6">
                            <div className="w-20 h-20 bg-muted/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-border/50 text-foreground-tertiary">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">No Leave Requests</h3>
                            <p className="text-foreground-tertiary mt-2 max-w-xs mx-auto text-sm">
                                {debouncedSearch
                                    ? `We couldn't find any requests matching "${debouncedSearch}".`
                                    : "There are no leave requests to display at the moment."}
                            </p>
                        </div>
                    }
                />
            </div>

            {/* Pagination & Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 pb-12">
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary flex items-center gap-2">
                        <span>Page</span>
                        <span className="text-primary text-sm">{pagination.page}</span>
                        <span>of</span>
                        <span className="text-foreground text-sm">{pagination.totalPages || 1}</span>
                        <span className="ml-2 pl-2 border-l border-border/50 opacity-50">Total: {pagination.total}</span>
                    </div>

                    <div className="hidden md:block">
                        <FilterDropdown
                            value={pagination.limit.toString()}
                            options={[10, 20, 50, 100].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
                            onChange={(v) => handleLimitChange(Number(v))}
                            className="h-10 rounded-xl border-border/50 text-xs font-bold text-foreground-tertiary hover:border-primary/40 transition-all bg-surface/50"
                        />
                    </div>
                </div>

                {pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* Action Modal */}
            {selectedRequest && actionType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface w-full max-w-md rounded-xl sm:rounded-xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 border border-border relative overflow-hidden">
                        {/* Modal Background Decoration */}
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-2",
                            actionType === 'approve' ? "bg-success" : "bg-error"
                        )} />

                        <div className="text-center mb-8">
                            <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transition-transform hover:scale-105 duration-300",
                                actionType === 'approve' ? "bg-success/10 text-success shadow-success/20 border border-success/20" : "bg-error/10 text-error shadow-error/20 border border-error/20"
                            )}>
                                {actionType === 'approve' ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                            </div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">
                                {actionType === 'approve' ? "Confirm Approval" : "Confirm Rejection"}
                            </h2>
                            <p className="text-foreground-tertiary mt-3 text-sm leading-relaxed px-4">
                                You are about to <span className={cn("font-black uppercase tracking-widest", actionType === 'approve' ? "text-success" : "text-error")}>{actionType}</span> the leave request for <span className="text-foreground font-bold underline decoration-primary/30 decoration-2">
                                    {typeof selectedRequest.employeeId === 'object'
                                        ? `${selectedRequest.employeeId.personalInfo?.firstName || ''} ${selectedRequest.employeeId.personalInfo?.lastName || ''}`.trim() || 'Unknown Employee'
                                        : 'Employee ' + selectedRequest.employeeId}
                                </span>.
                            </p>
                        </div>

                        <div className="mb-8 group">
                            <TextArea
                                label={actionType === 'approve' ? "Approval Comment (Optional)" : "Rejection Reason"}
                                placeholder={actionType === 'approve' ? "Add any notes for the employee..." : "Provide feedback for the employee..."}
                                value={actionComment}
                                onChange={(e) => setActionComment(e.target.value)}
                                maxLength={500}
                                rows={4}
                            />
                        </div>
  
                          {actionType === 'approve' && selectedRequest?.leaveType?.toLowerCase().includes('hourly') && (
                              <div className="mb-8 flex items-center gap-3">
                                  <input 
                                      type="checkbox" 
                                      id="deductBalance" 
                                      checked={isDeductFromBalance}
                                      onChange={(e) => setIsDeductFromBalance(e.target.checked)}
                                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                  />
                                  <label htmlFor="deductBalance" className="text-sm font-medium text-foreground cursor-pointer">
                                      Deduct from Employee leave balance based on roster
                                  </label>
                              </div>
                          )}
  
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="secondaryOutline"
                                className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs border-border/50"
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setActionType(null);
                                    setActionComment("");
                                }}
                                disabled={processingAction}
                            >
                                Cancel
                            </Button>
                            <Button
                                className={cn(
                                    "flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl",
                                    actionType === 'approve' ? "shadow-success/20" : "bg-error hover:bg-error/90 text-white shadow-error/20"
                                )}
                                onClick={handleAction}
                                isLoading={processingAction}
                                disabled={processingAction || (actionType === 'reject' && !actionComment.trim())}
                            >
                                {actionType === 'approve' ? "Complete Approval" : "Reject Application"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leave;


