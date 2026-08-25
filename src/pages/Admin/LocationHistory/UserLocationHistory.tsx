import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MapPin,
    Monitor,
    Globe,
    Clock,
    ChevronLeft,
    MapPinOff,
    Wifi,
} from "lucide-react";
import Table from "../../../components/common/Table";
import Pagination from "../../../components/common/Pagination";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { locationHistoryService } from "../../../services/locationHistoryService";
import type { LocationHistoryRecord } from "../../../services/locationHistoryService";

const UserLocationHistory: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [records, setRecords] = useState<LocationHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);

    const fetchHistory = useCallback(async (currentPage: number) => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await locationHistoryService.getByUserId(userId, {
                page: currentPage,
                limit,
            });
            setRecords(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch location history:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        fetchHistory(1);
        setPage(1);
    }, [fetchHistory]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchHistory(newPage);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getUserName = (record: LocationHistoryRecord) => {
        if (record.userId && typeof record.userId === "object") {
            return `${record.userId.personalInfo?.firstName || ""} ${record.userId.personalInfo?.lastName || ""}`.trim();
        }
        return "Unknown User";
    };

    const getUserEmail = (record: LocationHistoryRecord) => {
        if (record.userId && typeof record.userId === "object") {
            return record.userId.personalInfo?.email || "";
        }
        return "";
    };

    const parseUserAgent = (ua: string): string => {
        if (!ua) return "Unknown Device";
        // Simple browser detection
        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
        if (ua.includes("Edg")) return "Edge";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
        return "Other Browser";
    };

    const columns = [
        {
            _id: "loginAt",
            label: "Login Time",
            format: (_: unknown, row: LocationHistoryRecord) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-foreground text-sm">
                            {formatDate(row.loginAt)}
                        </div>
                        <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">
                            {new Date(row.loginAt).toLocaleDateString("en-US", { weekday: "long" })}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            _id: "location",
            label: "Location",
            format: (_: unknown, row: LocationHistoryRecord) => {
                if (row.latitude !== null && row.longitude !== null) {
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center text-success">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-foreground font-mono">
                                        {row.latitude?.toFixed(4)}, {row.longitude?.toFixed(4)}
                                    </span>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <Globe className="w-3 h-3" />
                                    View on Maps
                                </a>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground-tertiary">
                            <MapPinOff className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-foreground-tertiary">
                            Location denied / unavailable
                        </span>
                    </div>
                );
            },
        },
        {
            _id: "ipAddress",
            label: "IP Address",
            format: (_: unknown, row: LocationHistoryRecord) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Wifi className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground font-mono">
                        {row.ipAddress || "N/A"}
                    </span>
                </div>
            ),
        },
        {
            _id: "userAgent",
            label: "Device / Browser",
            format: (_: unknown, row: LocationHistoryRecord) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-foreground">
                            {parseUserAgent(row.userAgent)}
                        </div>
                        <div
                            className="text-[10px] font-medium text-foreground-tertiary truncate max-w-[200px]"
                            title={row.userAgent}
                        >
                            {row.userAgent?.substring(0, 60) || "Unknown"}
                            {(row.userAgent?.length || 0) > 60 ? "..." : ""}
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">
                        Loading Location History...
                    </p>
                </div>
            </div>
        );
    }

    // Get user name from the first record if available
    const userName = records.length > 0 ? getUserName(records[0]) : "User";
    const userEmail = records.length > 0 ? getUserEmail(records[0]) : "";

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-4 text-sm font-bold"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
                        Login Location History
                    </h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {userName}
                        {userEmail && (
                            <span className="text-foreground-tertiary">
                                ({userEmail})
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                        <span className="text-primary">{total}</span> Total Logins
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                            Loading Records...
                        </p>
                    </div>
                )}
                <Table
                    columns={columns}
                    rows={records}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Location History Found"
                            description="No login location records found for this user."
                            className="py-24"
                        />
                    }
                />
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                        Page <span className="text-primary">{page}</span> of{" "}
                        {totalPages || 1}
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

export default UserLocationHistory;
