import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  Filter,
  ChevronDown,
  Briefcase,
  Heart,
  User,
  Ban,
  Baby,
  Users,
  Sparkles,
  Umbrella,
  Plane,
} from "lucide-react";
import Card from "../../components/common/Card/Card";
import StatCard from "../../components/common/Card/StatCard";
import Button from "../../components/common/Button/Button";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { cn } from "../../lib/utils";
import leaveService from "../../services/leaveService";
import type {
  LeaveType,
  LeaveStatus,
  CreateLeaveRequestPayload,
  UserLeaveBalance,
} from "../../types/leave.types";
import { leaveTypeLabels, leaveStatusLabels } from "../../types/leave.types";

// Leave type icons mapping
const leaveTypeIcons: Record<LeaveType, React.ReactNode> = {
  annual: <Briefcase className="w-5 h-5" />,
  sick: <Heart className="w-5 h-5" />,
  personal: <User className="w-5 h-5" />,
  unpaid: <Ban className="w-5 h-5" />,
  maternity: <Baby className="w-5 h-5" />,
  paternity: <Baby className="w-5 h-5" />,
  bereavement: <Users className="w-5 h-5" />,
  compensatory: <Sparkles className="w-5 h-5" />,
};

// Leave type color classes
const leaveTypeColorClasses: Record<string, string> = {
  annual: "bg-primary/10 text-primary",
  sick: "bg-error/10 text-error",
  personal: "bg-accent/10 text-accent",
  unpaid: "bg-foreground-secondary/10 text-foreground-secondary",
  maternity: "bg-success/10 text-success",
  paternity: "bg-success/10 text-success",
  bereavement: "bg-foreground-tertiary/10 text-foreground-tertiary",
  compensatory: "bg-info/10 text-info",
};

const getLeaveTypeIcon = (type: string | LeaveType) => {
  if (!type || typeof type !== 'string') return <FileText className="w-5 h-5" />;
  const normalizedType = type.toLowerCase().replace(" leave", "");
  return leaveTypeIcons[normalizedType as LeaveType] || <FileText className="w-5 h-5" />;
};

const getLeaveTypeClass = (type: string | LeaveType) => {
  if (!type || typeof type !== 'string') return "bg-muted text-foreground-secondary";
  const normalizedType = type.toLowerCase().replace(" leave", "");
  return leaveTypeColorClasses[normalizedType] || "bg-muted text-foreground-secondary";
};

const Leave: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Leave Requests Query
  const {
    data: requests = [],
    isLoading: isLoadingRequests,
    error: requestsErrorRaw,
    refetch: fetchRequests
  } = useQuery({
    queryKey: ["leave-requests", statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await leaveService.getMyRequests(params);
      if (response.success || response.status === 'success') {
        return response.data;
      }
      throw new Error(response.message || "Failed to load leave requests");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const requestsError = requestsErrorRaw instanceof Error ? requestsErrorRaw.message : null;

  // Leave Balance Query
  const {
    data: balanceData = null,
    isLoading: isLoadingBalance,
    error: balanceErrorRaw,
    // refetch: fetchBalance
  } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: async () => {
      const response = await leaveService.getMyBalance();
      if (response.success || response.status === 'success') {
        return response.data;
      }
      throw new Error(response.message || "Failed to load leave balance");
    },
    staleTime: 5 * 60 * 1000,
  });

  const balanceError = balanceErrorRaw instanceof Error ? balanceErrorRaw.message : null;

  // Leave Stats Query
  const {
    data: leaveStatsData = null,
    isLoading: isLoadingStats,
    error: statsErrorRaw,
    refetch: fetchStats
  } = useQuery({
    queryKey: ["leave-stats"],
    queryFn: async () => {
      const response = await leaveService.getMyStats();
      if (response.status === 'success') {
        return response.data;
      }
      throw new Error(response.message || "Failed to load leave stats");
    },
    staleTime: 5 * 60 * 1000,
  });

  const statsError = statsErrorRaw instanceof Error ? statsErrorRaw.message : null;

  // Metadata (Leave Types) Query
  const {
    data: apiLeaveTypes = [],
    isLoading: isLoadingMetadata
  } = useQuery({
    queryKey: ["leave-metadata"],
    queryFn: async () => {
      const typesRes = await leaveService.getLeaveTypes();
      if (typesRes.status === 'success') {
        return typesRes.data;
      }
      return [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveMode, setLeaveMode] = useState<"full" | "half" | "hourly">("full");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<"first_half" | "second_half">("first_half");
  const [isEarlyLeave, setIsEarlyLeave] = useState(false);
  const [requestedHours, setRequestedHours] = useState<number>(0);

  // Sync leaveMode with original states
  useEffect(() => {
    if (leaveMode === "full") {
      setIsHalfDay(false);
      setIsEarlyLeave(false);
    } else if (leaveMode === "half") {
      setIsHalfDay(true);
      setIsEarlyLeave(false);
    } else if (leaveMode === "hourly") {
      setIsHalfDay(false);
      setIsEarlyLeave(true);
    }
  }, [leaveMode]);
  const [reason, setReason] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // New states for API-based day calculation
  const [apiCalculatedDays, setApiCalculatedDays] = useState<number>(0);
  const [dayBreakdown, setDayBreakdown] = useState<any[]>([]);
  const [isCalculatingDays, setIsCalculatingDays] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Effect to calculate days via API
  useEffect(() => {
    const fetchCalculatedDays = async () => {
      if (isEarlyLeave) {
        setApiCalculatedDays(requestedHours ? requestedHours / 8 : 0);
        setCalculationError(null);
        return;
      }
      if (!startDate || (!isHalfDay && !endDate)) {
        setApiCalculatedDays(0);
        setCalculationError(null);
        return;
      }

      setIsCalculatingDays(true);
      setCalculationError(null);
      try {
        const response = await leaveService.calculateDays({
          startDate,
          endDate: isHalfDay ? startDate : endDate,
          halfDay: isHalfDay,
        });

        if (response.status === 'success') {
          setApiCalculatedDays(response.data.numberOfDays);
          setDayBreakdown(response.data.breakdown || []);
        } else {
          setCalculationError(response.message || "Could not calculate days");
          setApiCalculatedDays(0);
          setDayBreakdown([]);
        }
      } catch (error: unknown) {
        console.error("Error calculating days:", error);
        const errorMsg = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Error calculating days";
        setCalculationError(errorMsg);
        setApiCalculatedDays(0);
      } finally {
        setIsCalculatingDays(false);
      }
    };

    const timeoutId = setTimeout(fetchCalculatedDays, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, isHalfDay]);

  const resetForm = () => {
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setIsHalfDay(false);
    setHalfDayType("first_half");
    setReason("");
    setAttachedFile(null);
    setSubmitError(null);
    setFieldErrors({});
    setSubmitSuccess(false);
    setApiCalculatedDays(0);
    setDayBreakdown([]);
    setCalculationError(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (fieldErrors.startDate) {
      setFieldErrors(prev => {
        const { startDate: _, ...rest } = prev;
        return rest;
      });
    }

    // If end date exists and is before start date, reset end date
    if (endDate && newStartDate > endDate) {
      setEndDate("");
    }
  };

  // Unused handlers - commenting out to avoid lint errors
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const file = e.target.files[0];
  //     // Validate file size (max 5MB)
  //     if (file.size > 5 * 1024 * 1024) {
  //       setSubmitError("File size must be less than 5MB");
  //       return;
  //     }
  //     setAttachedFile(file);
  //     setSubmitError(null);
  //   }
  // };

  // const handleRemoveFile = () => {
  //   setAttachedFile(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  const handleApplyLeave = async () => {
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!leaveType) newErrors.leaveType = "Please select a leave type";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!isHalfDay && !isEarlyLeave && !endDate) newErrors.endDate = "End date is required";
    if (!reason.trim()) newErrors.reason = "Reason is required";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      // Scroll to the first error might be good, but for now just set them
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreateLeaveRequestPayload & { isEarlyLeave?: boolean; requestedHours?: number } = {
        leaveType,
        startDate,
        endDate: (isHalfDay || isEarlyLeave) ? startDate : endDate,
        halfDay: isHalfDay,
        halfDayType: isHalfDay ? halfDayType : undefined,
        reason,
        attachments: attachedFile ? [attachedFile] : undefined,
        isEarlyLeave,
        requestedHours,
      };

      const response = await leaveService.create(payload);

      if (response.success || response.status === 'success') {
        setSubmitSuccess(true);
        // Refresh data using React Query
        queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
        queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        queryClient.invalidateQueries({ queryKey: ["leave-stats"] });

        // Close modal after a brief success display
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        const errorMsg = response.error?.message || response.message || "Failed to submit leave request";
        setSubmitError(errorMsg);
      }
    } catch (error: unknown) {
      console.error("Error submitting leave request:", error);
      const errorObj = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const serverMessage = errorObj.response?.data?.error?.message || errorObj.response?.data?.message;
      setSubmitError(serverMessage || "An error occurred while submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await leaveService.cancel(id);
      if (response.success || response.status === 'success') {
        // Refresh data using React Query
        queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
        queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        queryClient.invalidateQueries({ queryKey: ["leave-stats"] });
        setCancellingId(null);
      } else {
        const errorMsg = response.error?.message || response.message || "Failed to cancel leave request";
        setCancelError(errorMsg);
      }
    } catch (error: unknown) {
      console.error("Error cancelling leave request:", error);
      const errorObj = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const errorMsg = errorObj.response?.data?.error?.message || errorObj.response?.data?.message || "An unexpected error occurred.";
      setCancelError(errorMsg);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusConfig = (status: LeaveStatus) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          className: "bg-success/10 text-success",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-4 h-4" />,
          className: "bg-error/10 text-error",
        };
      case "cancelled":
        return {
          icon: <Ban className="w-4 h-4" />,
          className: "bg-foreground-secondary/10 text-foreground-secondary",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          className: "bg-warning/10 text-warning",
        };
    }
  };

  const formatDateRange = (start: string, end: string, isHalfDayRequest: boolean) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    const startStr = startDateObj.toLocaleDateString("en-US", formatOptions);

    if (isHalfDayRequest) {
      return `${startStr} (Half Day)`;
    }

    if (startDateObj.getTime() === endDateObj.getTime()) {
      return startDateObj.toLocaleDateString("en-US", {
        ...formatOptions,
        year: "numeric",
      });
    }

    const endStr = endDateObj.toLocaleDateString("en-US", {
      ...formatOptions,
      year: "numeric",
    });

    return `${startStr} - ${endStr}`;
  };

  // Calculate summary stats from stats data
  const getSummaryStats = () => {
    if (!leaveStatsData?.summary) {
      return { available: 0, used: 0, pending: 0, total: 0, unpaidUsed: 0 };
    }
    const summary = leaveStatsData.summary;
    const perType = leaveStatsData.perType || [];

    const unpaid = perType.find(t => t.isPaid === false || t.code === 'LWP' || t.name.toLowerCase().includes('unpaid'));

    return {
      available: summary.available ?? 0,
      used: summary.used ?? 0,
      pending: summary.pending ?? 0,
      total: summary.totalAllocated ?? 0,
      unpaidUsed: unpaid ? (unpaid.used ?? 0) : 0
    };
  };

  const stats = getSummaryStats();

  const getAggregateHours = () => {
    let availableHours = 0;
    let usedHours = 0;
    let totalHours = 0;
    if (balanceData?.balances) {
      balanceData.balances.forEach(b => {
        if (b.isPaid !== false) {
          const hoursPerDay = b.workingHoursPerDay || 8;
          availableHours += (b.currentBalance ?? 0) * hoursPerDay;
          usedHours += (b.used ?? 0) * hoursPerDay;
          totalHours += (b.totalAllocated ?? 0) * hoursPerDay;
        }
      });
    }
    return {
      available: Number(availableHours.toFixed(2)),
      used: Number(usedHours.toFixed(2)),
      total: Number(totalHours.toFixed(2))
    };
  };
  const aggregateHours = getAggregateHours();

  // Get balance for a specific leave type
  const getBalanceForType = (type: string): UserLeaveBalance | undefined => {
    if (!type) return undefined;
    const normalizedSearch = type.toLowerCase().replace(" leave", "");
    return balanceData?.balances?.find((b: UserLeaveBalance) => {
      const bTypeName = b.name || "";
      const normalizedBalanceType = bTypeName.toLowerCase().replace(" leave", "");
      return normalizedBalanceType === normalizedSearch;
    });
  };

  const requestedDays = apiCalculatedDays;
  const selectedTypeBalance = getBalanceForType(leaveType);
  const hasInsufficientBalance =
    selectedTypeBalance &&
    selectedTypeBalance.currentBalance !== null &&
    requestedDays > selectedTypeBalance.currentBalance;

  const isSubmitDisabled =
    isSubmitting ||
    !!hasInsufficientBalance ||
    isCalculatingDays ||
    !!calculationError ||
    requestedDays <= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage your leave applications and view your balance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
              queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
              queryClient.invalidateQueries({ queryKey: ["leave-stats"] });
            }}
            className="bg-surface/50 backdrop-blur-sm border-white/20 text-foreground hover:bg-white/20"
            startIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="shadow-lg shadow-primary/20"
            startIcon={<Plus className="w-4 h-4" />}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-dark p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md border border-white/20 mb-4">
              <Umbrella className="w-3 h-3 text-white" />
              Time Off Portal
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold mb-2">Plan Your Break</h2>
            <p className="text-white/90 max-w-md text-sm sm:text-base font-medium">
              Take a well-deserved rest. Check your balance and apply for time off in just a few clicks.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 min-w-[110px] shadow-lg">
              <span className="text-white/90 text-[10px] uppercase tracking-widest font-bold mb-1">Available</span>
              <div className="flex flex-col items-center">`r`n                  <span className="text-3xl font-bold text-white">{stats.available}</span>`r`n                  {aggregateHours.available > 0 && <span className="text-xs text-white/80 font-medium">({aggregateHours.available}h)</span>}`r`n                </div>
              <span className="text-[10px] text-white/80 font-bold mt-0.5 uppercase tracking-tighter">Days Remaining</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 min-w-[110px] shadow-lg">
              <span className="text-white/90 text-[10px] uppercase tracking-widest font-bold mb-1">Taken</span>
              <div className="flex flex-col items-center">`r`n                  <span className="text-3xl font-bold text-white">{stats.used}</span>`r`n                  {aggregateHours.used > 0 && <span className="text-xs text-white/80 font-medium">({aggregateHours.used}h)</span>}`r`n                </div>
              <span className="text-[10px] text-white/80 font-bold mt-0.5 uppercase tracking-tighter">Total Used</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <Plane className="absolute top-10 right-80 w-32 h-32 text-white/5 -rotate-12 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-surface h-32 rounded-xl shadow-md animate-pulse"
              />
            ))}
          </>
        ) : statsError ? (
          <div className="col-span-full">
            <div className="bg-error/5 border border-error/20 rounded-xl p-4 text-center">
              <p className="text-error text-sm">{statsError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchStats()}
                className="mt-2 text-error hover:bg-error/10"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            <StatCard
              title="Available Balance"
              value={aggregateHours.available > 0 ? `${stats.available} (${aggregateHours.available}h)` : stats.available}
              icon={<Umbrella className="w-5 h-5 sm:w-6 sm:h-6" />}
              borderColor="border-primary"
              bgColor="bg-primary/10"
            />
            <StatCard
              title="Approved Leaves"
              value={aggregateHours.used > 0 ? `${stats.used} (${aggregateHours.used}h)` : stats.used}
              icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
              borderColor="border-success"
              bgColor="bg-success/10"
            />
            <StatCard
              title="Pending Requests"
              value={stats.pending}
              icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
              borderColor="border-warning"
              bgColor="bg-warning/10"
            />
            <StatCard
              title="Total Allocated"
              value={aggregateHours.total > 0 ? `${stats.total} (${aggregateHours.total}h)` : stats.total}
              icon={<Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />}
              borderColor="border-info"
              bgColor="bg-info/10"
            />
          </>
        )}
      </div>

      {/* Leave Balance Breakdown */}
      {
        isLoadingBalance ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : balanceError ? (
          <div className="bg-error/5 border border-error/20 p-4 rounded-xl text-error text-center">
            {balanceError}
          </div>
        ) : balanceData?.balances && balanceData.balances.length > 0 && (
          <Card title="Leave Balance Breakdown">
            {(() => {
              const seenUnpaid = new Set<string>();

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {balanceData.balances
                    .filter((balance: UserLeaveBalance) => {
                      const isUnpaid =
                        balance.isPaid === false ||
                        balance.name.toLowerCase().includes("unpaid") ||
                        balance.code.toLowerCase().includes("unpaid") ||
                        balance.code === "LWP";

                      // Show paid leaves always
                      if (!isUnpaid) return true;

                      // Only show unpaid leave if it has been used
                      if ((balance.used ?? 0) > 0) {
                        const normalizedName = balance.name.toLowerCase().trim();
                        if (seenUnpaid.has(normalizedName)) return false;
                        seenUnpaid.add(normalizedName);
                        return true;
                      }
                      return false;
                    })
                    .map((balance: UserLeaveBalance) => {
                      const isFaded = balance.isPaid !== false && (balance.currentBalance ?? 0) <= 0;
                      return (
                        <div
                          key={balance.code}
                          className={cn(
                            "p-4 rounded-xl border border-border hover:border-primary/30 transition-colors",
                            getLeaveTypeClass(balance.name).replace("/10", "/5"),
                            isFaded && "opacity-60 grayscale-[0.5]"
                          )}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                getLeaveTypeClass(balance.name)
                              )}
                            >
                              {getLeaveTypeIcon(balance.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {balance.name}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              {balance.isPaid !== false && (
                                <span className="text-foreground-secondary">
                                  Available
                                </span>
                              )}
                              <span className={cn(
                                "font-semibold text-foreground",
                                balance.isPaid === false && "ml-auto"
                              )}>
                                {balance.isPaid === false ? "No Limit" : (
                                  <>
                                    {balance.currentBalance ?? "-"}
                                    {balance.currentBalance !== null && (
                                      <span className="text-xs text-foreground-tertiary ml-1 font-normal">
                                        ({Number(((balance.currentBalance) * (balance.workingHoursPerDay || 8)).toFixed(2))}h)
                                      </span>
                                    )}
                                  </>
                                )}
                              </span>
                            </div>
                            {balance.isPaid !== false && (
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    getLeaveTypeClass(balance.name).split(' ')[1].replace('text-', 'bg-')
                                  )}
                                  style={{
                                    width: `${(balance.totalAllocated ?? 0) > 0 ? ((balance.used ?? 0) / (balance.totalAllocated ?? 0)) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex justify-between text-xs text-foreground-tertiary">
                              <span>Used: {balance.used ?? 0}</span>
                              {balance.isPaid !== false && (
                                <span>Total: {balance.totalAllocated ?? "-"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })()}
          </Card>
        )
      }

      {/* Bottom Grid: Requests and Organization Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* My Requests List */}
          <Card
            title="My Requests"
            action={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    endIcon={<ChevronDown className={cn("w-4 h-4 transition-transform", isFilterOpen && "rotate-180")} />}
                    startIcon={<Filter className="w-4 h-4" />}
                  >
                    {statusFilter === "all" ? "All Status" : leaveStatusLabels[statusFilter]}
                  </Button>
                  {isFilterOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-surface border border-border rounded-xl shadow-lg py-2 min-w-[150px] z-20">
                      {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                            statusFilter === status && "bg-primary/5 text-primary font-medium"
                          )}
                        >
                          {status === "all" ? "All Status" : leaveStatusLabels[status]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            }
          >
            {isLoadingRequests ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : requestsError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-error mx-auto mb-3" />
                <p className="text-error mb-3">{requestsError}</p>
                <Button variant="outline" onClick={() => fetchRequests()}>
                  Try Again
                </Button>
              </div>
            ) : !requests || requests.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-12 h-12" />}
                title="No leave requests found"
                description={
                  statusFilter === "all"
                    ? "You haven't applied for any leave yet. Click the button above to apply."
                    : `No ${leaveStatusLabels[statusFilter].toLowerCase()} leave requests found.`
                }
              />
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {requests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);
                  return (
                    <div
                      key={request._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                            getLeaveTypeClass(request.leaveType)
                          )}
                        >
                          {getLeaveTypeIcon(request.leaveType)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                            {leaveTypeLabels[request.leaveType as LeaveType] || request.leaveType}
                            {request.attachments && request.attachments.length > 0 && (
                              <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded text-foreground-secondary flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {request.attachments.length} Doc{request.attachments.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-foreground-secondary flex items-center gap-2 flex-wrap">
                            <span>
                              {request.numberOfDays ?? 0} day{(request.numberOfDays ?? 0) !== 1 ? "s" : ""} {(() => { const reqBalance = getBalanceForType(request.leaveType); const hrs = (request.numberOfDays ?? 0) * (reqBalance?.workingHoursPerDay || 8); return hrs > 0 ? `(${hrs}h)` : ""; })()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-foreground-tertiary" />
                            <span>
                              {formatDateRange(request.startDate, request.endDate, request.halfDay)}
                            </span>
                          </div>
                          {request.reason && (
                            <p className="text-xs text-foreground-tertiary mt-1 line-clamp-1">
                              {request.reason}
                            </p>
                          )}
                          {request.status === "rejected" && request.rejectionReason && (
                            <p className="text-xs text-error mt-1">
                              Reason: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                            statusConfig.className
                          )}
                        >
                          {statusConfig.icon}
                          <span>{leaveStatusLabels[request.status]}</span>
                        </span>
                        {request.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancellingId(request._id)}
                            className="text-error hover:bg-error/10"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Organization Policies */}
          <Card title="Leave Policies">
            <div className="space-y-4">
              {isLoadingMetadata ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : apiLeaveTypes.length > 0 ? (
                apiLeaveTypes.map((type) => {
                  return (
                    <div
                      key={type._id}
                      className="flex items-start gap-3 p-3 bg-surface border border-border rounded-xl hover:border-primary/30 transition-colors"
                    >
                      <div className={cn("p-2 rounded-lg shrink-0", getLeaveTypeClass(type.name))}>
                        {getLeaveTypeIcon(type.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {type.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-xs text-foreground-secondary flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {type.defaultAmount} Days/{type.resetFrequency}
                          </span>
                          {type.maxCarryForward > 0 && (
                            <span className="text-xs text-foreground-secondary flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5" />
                              Carry: {type.maxCarryForward}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-foreground-tertiary text-center py-4">
                  No leave types defined for your role.
                </p>
              )}

              <div className="pt-2">
                <div className="p-4 bg-info/5 border border-info/20 rounded-xl">
                  <div className="flex items-center gap-2 text-info mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Note</span>
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed">
                    Leave policies are subject to change based on company guidelines and your employment status.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Leave Type Guide */}
          {/* <Card title="Leave Guide">
            <div className="space-y-3">
              {apiLeaveTypes.map((type) => (
                <div key={type._id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">{type.name}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    type.isPaid ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  )}>
                    {type.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>
              ))}
            </div>
          </Card> */}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleClose}
        title="Apply for Leave"
        maxWidth="lg"
        actions={
          submitSuccess ? null : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyLeave}
                disabled={isSubmitDisabled}
                startIcon={isSubmitting || isCalculatingDays ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isSubmitting ? "Submitting..." : (isCalculatingDays ? "Calculating..." : "Submit Request")}
              </Button>
            </>
          )
        }
      >
        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Request Submitted!</h3>
            <p className="text-foreground-secondary">
              Your leave request has been submitted successfully and is pending approval.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {submitError && (
              <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/20 rounded-xl">
                <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error">{submitError}</p>
              </div>
            )}

            {/* <div className="flex items-start gap-3 p-4 bg-info/5 border border-info/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <div className="text-sm text-foreground-secondary">
                <p className="font-medium text-foreground mb-1">Before you apply</p>
                <p>
                  Make sure you have checked your team's schedule and have sufficient leave balance
                  available.
                </p>
              </div>
            </div> */}

            <div className="space-y-4">
              {/* Leave Type Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Leave Type <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {apiLeaveTypes.length > 0 ? (
                    apiLeaveTypes.map((type) => {
                      // Note: We're mapping the dynamic type name/code to our existing LeaveType enum where possible
                      // or just using the dynamic data. For now, let's use the dynamic name.
                      const balance = balanceData?.balances?.find(b => {
                        const bTypeName = b.name || "";
                        const typeName = type.name || "";
                        return bTypeName.toLowerCase().replace(" leave", "") === typeName.toLowerCase().replace(" leave", "");
                      });

                      const isSelected = leaveType === type.name;
                      const isDisabled = type.isPaid !== false && (!balance || (balance.currentBalance ?? 0) <= 0);

                      return (
                        <button
                          key={type._id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setLeaveType(type.name as LeaveType);
                            if (fieldErrors.leaveType) {
                              setFieldErrors(prev => {
                                const { leaveType: _, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all text-left",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30",
                            isDisabled && "opacity-50 cursor-not-allowed grayscale-[0.5]"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                              getLeaveTypeClass(type.name)
                            )}
                          >
                            {getLeaveTypeIcon(type.name)}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {type.name.replace(" Leave", "")}
                          </p>
                          {balance && type.isPaid !== false && (
                            <p className="text-xs text-foreground-tertiary">
                              {balance.currentBalance ?? 0} available
                            </p>
                          )}
                          {type.isPaid === false && (
                            <p className="text-xs text-info font-medium">
                              No Limit
                            </p>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    // Fallback to static if API hasn't returned yet
                    (Object.keys(leaveTypeLabels) as LeaveType[]).slice(0, 4).map((type) => {
                      const balance = getBalanceForType(type);
                      const isUnpaid = type === 'unpaid';
                      const isDisabled = !isUnpaid && (!balance || (balance.currentBalance ?? 0) <= 0);

                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setLeaveType(type);
                            if (fieldErrors.leaveType) {
                              setFieldErrors(prev => {
                                const { leaveType: _, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all text-left",
                            leaveType === type
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30",
                            isDisabled && "opacity-50 cursor-not-allowed grayscale-[0.5]"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                              leaveTypeColorClasses[type]
                            )}
                          >
                            {leaveTypeIcons[type]}
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {leaveTypeLabels[type].replace(" Leave", "")}
                          </p>
                          {balance && type !== 'unpaid' && (
                            <p className="text-xs text-foreground-tertiary">
                              {balance.currentBalance ?? 0} available
                            </p>
                          )}
                          {type === 'unpaid' && (
                            <p className="text-xs text-info font-medium">
                              No Limit
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                {fieldErrors.leaveType && (
                  <p className="text-xs text-error mt-2 ml-1">{fieldErrors.leaveType}</p>
                )}
              </div>

              {/* Half Day Toggle */}
              <div className="flex flex-col items-start gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="space-y-1.5 sm:col-span-2 mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                    Leave Duration
                  </label>
                  <div className="flex bg-muted p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setLeaveMode("full")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${leaveMode === "full" ? "bg-surface shadow text-foreground" : "text-foreground-secondary hover:text-foreground"}`}
                    >
                      Full Day(s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveMode("half")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${leaveMode === "half" ? "bg-surface shadow text-foreground" : "text-foreground-secondary hover:text-foreground"}`}
                    >
                      Half Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveMode("hourly")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${leaveMode === "hourly" ? "bg-surface shadow text-foreground" : "text-foreground-secondary hover:text-foreground"}`}
                    >
                      Early Leave (Hourly)
                    </button>
                  </div>
                </div>
                {isHalfDay && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHalfDayType("first_half")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        halfDayType === "first_half"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground-secondary hover:bg-muted/70"
                      )}
                    >
                      First Half
                    </button>
                    <button
                      type="button"
                      onClick={() => setHalfDayType("second_half")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        halfDayType === "second_half"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground-secondary hover:bg-muted/70"
                      )}
                    >
                      Second Half
                    </button>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn((isHalfDay || isEarlyLeave) && "sm:col-span-2")}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {isHalfDay ? "Date" : "Start Date"} <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={cn(
                      "w-full px-4 py-2.5 border rounded-xl bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-transparent",
                      fieldErrors.startDate ? "border-error" : "border-border"
                    )}
                  />
                  {fieldErrors.startDate && (
                    <p className="text-xs text-error mt-1">{fieldErrors.startDate}</p>
                  )}
                </div>

                {!isHalfDay && !isEarlyLeave && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      End Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      disabled={!startDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (fieldErrors.endDate) {
                          setFieldErrors(prev => {
                            const { endDate: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-xl bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
                        fieldErrors.endDate ? "border-error" : "border-border"
                      )}
                    />
                    {fieldErrors.endDate && (
                      <p className="text-xs text-error mt-1">{fieldErrors.endDate}</p>
                    )}
                    {startDate && !endDate && !fieldErrors.endDate && (
                      <p className="text-xs text-foreground-tertiary mt-1">
                        Select a date on or after{" "}
                        {new Date(startDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Days Summary */}
              {(requestedDays > 0 || isCalculatingDays || calculationError || dayBreakdown.length > 0) && (
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-all space-y-3",
                    calculationError || hasInsufficientBalance
                      ? "bg-error/5 border-error/20"
                      : "bg-success/5 border-success/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      {isCalculatingDays ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                          <p className="text-sm font-medium text-foreground">Calculating days...</p>
                        </div>
                      ) : calculationError ? (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-error" />
                          <p className="text-sm font-medium text-error">{calculationError}</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">
                            {requestedDays} day{requestedDays !== 1 ? "s" : ""} requested
                          </p>
                          {selectedTypeBalance && (
                            <p className="text-xs text-foreground-secondary mt-0.5">
                              {selectedTypeBalance.isPaid === false
                                ? "No limit for Unpaid Leave"
                                : `${selectedTypeBalance.currentBalance ?? 0} days available for ${selectedTypeBalance.name}`}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {!isCalculatingDays && !calculationError && hasInsufficientBalance && (
                      <span className="text-xs text-error font-medium px-2 py-1 bg-error/10 rounded-full">
                        Insufficient Balance
                      </span>
                    )}
                  </div>

                  {/* Day Breakdown Message */}
                  {!isCalculatingDays && !calculationError && dayBreakdown.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <div className="space-y-1.5">
                        {dayBreakdown.some(d => !d.isCounted) ? (
                          <div className="flex flex-col gap-1.5">
                            {dayBreakdown.filter(d => !d.isCounted).map((day, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] text-foreground-secondary bg-surface/50 p-1.5 rounded-lg border border-border/20">
                                <span className="p-0.5 rounded bg-amber-500/10 text-amber-600 font-bold shrink-0">EXCL</span>
                                <div className="min-w-0">
                                  <span className="font-semibold">{day.date} ({day.dayOfWeek})</span>: {day.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-success font-medium">
                            All selected days are counted towards your leave.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Reason <span className="text-error">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (fieldErrors.reason) {
                      setFieldErrors(prev => {
                        const { reason: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  placeholder="Please explain why you need to take leave..."
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-foreground-tertiary",
                    fieldErrors.reason ? "border-error" : "border-border"
                  )}
                />
                {fieldErrors.reason && (
                  <p className="text-xs text-error mt-1">{fieldErrors.reason}</p>
                )}
              </div>

              {/* File Upload */}
              {/* <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Supporting Documents (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                {!attachedFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <Upload className="w-5 h-5 text-foreground-tertiary group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground-secondary group-hover:text-primary transition-colors">
                      Click to upload file (Max 5MB)
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {attachedFile.name}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {(attachedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 hover:bg-muted rounded-full text-foreground-tertiary hover:text-error transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!cancellingId}
        onClose={() => {
          setCancellingId(null);
          setCancelError(null);
        }}
        title="Cancel Leave Request"
        maxWidth="sm"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCancellingId(null);
                setCancelError(null);
              }}
              disabled={isCancelling}
            >
              {cancelError ? "Close" : "Keep Request"}
            </Button>
            {!cancelError && (
              <Button
                // variant="primary"
                onClick={() => cancellingId && handleCancelRequest(cancellingId)}
                disabled={isCancelling}
                startIcon={isCancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
                className="bg-error hover:bg-error/90"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            )}
          </>
        }
      >
        <div className="text-center py-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            cancelError ? "bg-error/10" : "bg-error/10"
          )}>
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          {cancelError ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-error text-center">Action Failed</h3>
              <p className="text-foreground-secondary text-center px-4">
                {cancelError}
              </p>
            </div>
          ) : (
            <p className="text-foreground-secondary">
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </p>
          )}
        </div>
      </Modal>
    </div >
  );
};

export default Leave;























