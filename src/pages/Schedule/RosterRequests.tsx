import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Check, X, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import Button from '../../components/common/Button';
import GlobalLoader from '../../components/common/LoadingSpinner/GlobalLoader';
import StatCard from '../../components/common/Stats/StatCard';
import { SearchInput } from '../../components/common/Search/SearchInput';
import UnifiedFilter from '../../components/common/Filter/UnifiedFilter';
import FilterDropdown from '../../components/common/Filter/FilterDropdown';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { scheduleService } from '../../services/scheduleService';
import type { RosterEditRequest } from '../../services/scheduleService';
import { formatAdminDate } from '../../utils/dateUtils';
import { cn } from '../../lib/utils';
import Avatar from '../../components/common/Avatar';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirmation } from '../../hooks/useConfirmation';

const RosterRequests: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Get filters from URL or defaults
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>((searchParams.get("status") as any) || 'pending');
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || '');
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Initial page from URL
    const initialPage = Number(searchParams.get("page")) || 1;

    // State management
    const [requests, setRequests] = useState<RosterEditRequest[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    
    // Stats state
    const [stats, setStats] = useState({
        pendingRequests: 0,
        approvedToday: 0,
        rejectedTotal: 0,
        totalRequests: 0
    });
    
    // Pagination state
    const [pagination, setPagination] = useState({
        total: 0,
        page: initialPage,
        limit: 7,
        pages: 1
    });

    // Sync state to URL
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== "pending") params.status = statusFilter;
        if (pagination.page > 1) params.page = pagination.page.toString();
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, statusFilter, pagination.page, setSearchParams]);

    // Fetch functions
    const fetchStats = useCallback(async () => {
        try {
            const response = await scheduleService.getEditRequestsStats?.();
            if (response?.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch roster stats:", error);
        }
    }, []);

    const fetchRequests = useCallback(async (page = 1, isInitial = false) => {
        try {
            if (isInitial) {
                setInitialLoading(true);
            } else {
                setTableLoading(true);
            }
            
            const response = await scheduleService.getEditRequests({
                page,
                limit: pagination.limit,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: debouncedSearch.trim() || undefined,
            });
            
            setRequests(response.data);
            setPagination({
                total: response.pagination.total,
                page: response.pagination.page,
                limit: response.pagination.limit,
                pages: response.pagination.pages
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load roster edit requests");
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

    const handlePageChange = (newPage: number) => {
        fetchRequests(newPage);
    };

    const { confirm, ConfirmationDialog } = useConfirmation();

    // Review Request Mutation
    const reviewMutation = useMutation({
        mutationFn: (vars: { id: string; action: 'approve' | 'reject' }) =>
            scheduleService.reviewEditRequest(vars.id, vars.action),
        onSuccess: () => {
            toast.success("Request reviewed successfully");
            fetchRequests(pagination.page); // Refresh list at current page
            fetchStats(); // Also refresh stats
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || 'Failed to review request');
        }
    });

    const handleReview = async (id: string, action: 'approve' | 'reject') => {
        const confirmed = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Roster Request`,
            message: `Are you sure you want to ${action} this roster edit request?`,
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant: action === 'reject' ? 'danger' : 'success'
        });

        if (confirmed) {
            reviewMutation.mutate({ id, action });
        }
    };

    const formatShiftData = (shiftType: string, startTime: string[], endTime: string[]) => {
        if (!shiftType || shiftType === 'off') return <span className="text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">Off Day</span>;

        return (
            <div className="flex flex-col gap-1">
                <span className="capitalize font-medium text-foreground">{shiftType}</span>
                {startTime?.length > 0 && endTime?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                        <Clock className="w-3 h-3" />
                        <span>{startTime[0]} - {endTime[0]}</span>
                    </div>
                )}
            </div>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-warning/20 text-warning border-warning/30';
            case 'approved': return 'bg-success/20 text-success border-success/30';
            case 'rejected': return 'bg-error/20 text-error border-error/30';
            default: return 'bg-muted text-foreground-secondary border-border';
        }
    };

    const handleLimitChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
        fetchRequests(1);
    };

    const columns = [
        {
            _id: "employee",
            label: "Employee",
            format: (_: unknown, row: RosterEditRequest) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={row.employeeId?.personalInfo?.profilePicture}
                        firstName={row.employeeId?.personalInfo?.firstName}
                        lastName={row.employeeId?.personalInfo?.lastName}
                        size="sm"
                    />
                    <div>
                        <p className="font-semibold text-sm text-foreground">
                            {row.employeeId?.personalInfo?.firstName} {row.employeeId?.personalInfo?.lastName}
                        </p>
                        <p className="text-xs text-foreground-tertiary">
                            {row.employeeId?.personalInfo?.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            _id: "date",
            label: "Date Requested",
            format: (_: unknown, row: RosterEditRequest) => (
                <div>
                    <div className="font-medium text-sm text-foreground">
                        {formatAdminDate(new Date(row.date))}
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-0.5">
                        Submitted: {new Date(row.requestedAt).toLocaleDateString()}
                    </div>
                </div>
            ),
        },
        {
            _id: "original",
            label: "Original Roster",
            format: (_: unknown, row: RosterEditRequest) => formatShiftData(row.originalRoster?.shiftType || "", row.originalRoster?.startTime || [], row.originalRoster?.endTime || []),
        },
        {
            _id: "requested",
            label: "Requested Change",
            format: (_: unknown, row: RosterEditRequest) => (
                <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
                    {formatShiftData(row.updatedRoster?.shiftType, row.updatedRoster?.startTime, row.updatedRoster?.endTime)}
                </div>
            ),
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: RosterEditRequest) => (
                <span className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-full border capitalize inline-flex items-center gap-1.5",
                    getStatusColor(row.requestStatus)
                )}>
                    {row.requestStatus === 'pending' && <Clock className="w-3 h-3" />}
                    {row.requestStatus === 'approved' && <Check className="w-3 h-3" />}
                    {row.requestStatus === 'rejected' && <X className="w-3 h-3" />}
                    {row.requestStatus}
                </span>
            ),
        },
        // Only show Actions column if we might have pending actions
        ...((statusFilter === 'pending' || statusFilter === 'all') ? [{
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: RosterEditRequest) => (
                <div className="flex justify-end gap-2 pr-2">
                    {row.requestStatus === 'pending' ? (
                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-9 h-9 rounded-xl hover:bg-error/10 hover:text-error text-foreground-secondary transition-all group"
                                onClick={() => handleReview(row._id, 'reject')}
                                disabled={reviewMutation.isPending}
                                title="Reject"
                            >
                                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-9 h-9 rounded-xl hover:bg-success/10 hover:text-success text-foreground-secondary transition-all group"
                                onClick={() => handleReview(row._id, 'approve')}
                                disabled={reviewMutation.isPending}
                                title="Approve"
                            >
                                <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </Button>
                        </div>
                    ) : (
                        <span className="text-foreground-tertiary px-4">—</span>
                    )}
                </div>
            ),
        }] : []),
    ];

    if (initialLoading) return <GlobalLoader message="Loading Roster Edit Requests..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-2 sm:px-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Roster Edit Requests</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium text-sm sm:text-base">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Review and manage employee requests for past roster changes.
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard 
                    title="Pending Requests" 
                    value={stats.pendingRequests || 0} 
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
                    title="Total Rejected" 
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
                        searchKey="roster-requests"
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
                                onChange: (val) => setStatusFilter(val as 'pending' | 'approved' | 'rejected' | 'all'),
                                options: [
                                    { value: "pending", label: "Pending" },
                                    { value: "approved", label: "Approved" },
                                    { value: "rejected", label: "Rejected" },
                                    { value: "all", label: "All Status" },
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
                        tableClassName="min-w-[640px]"
                        emptyState={
                            <EmptyState
                                title="No Roster Requests"
                                description={searchTerm ? `We couldn't find any requests matching "${searchTerm}".` : "There are no roster edit requests to display at the moment."}
                                className="py-24"
                            />
                        }
                    />
            </div>

            {/* Pagination & Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4 pb-8">
                <div className="flex items-center gap-3">
                    <p className="text-xs sm:text-sm font-bold text-foreground-tertiary uppercase tracking-widest bg-muted/50 px-3 sm:px-4 py-2 rounded-2xl border border-border/30">
                        Page <span className="text-primary">{pagination.page}</span> of {pagination.pages || 1} (Total: {pagination.total})
                    </p>
                    <div className="relative group">
                        <FilterDropdown
                            value={pagination.limit.toString()}
                            options={[10, 25, 50, 100].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
                            onChange={(v) => handleLimitChange(Number(v))}
                            className="
                                h-9 px-3 rounded-xl border-border/50
                                text-xs font-bold text-foreground-tertiary
                                hover:text-foreground-tertiary
                                focus:text-foreground-tertiary
                                data-[state=open]:text-foreground-tertiary
                            "
                            align="start"
                        />
                    </div>
                </div>

                {pagination.pages > 1 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.pages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
            {ConfirmationDialog}
        </div>
    );
};

export default RosterRequests;
