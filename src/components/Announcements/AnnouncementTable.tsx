import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Trash2,
    Bell,
    Edit2,
    Clock,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import Button from "../../components/common/Button";
import Table, { type Column } from "../../components/common/Table";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import type {
    Announcement,
    AnnouncementPriority
} from "../../types/announcement.types";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

interface AnnouncementTableProps {
    announcements: Announcement[];
    isLoading: boolean;
    searchTerm: string;
    priorityFilter?: string;
    categoryFilter?: string;
    onEdit: (announcement: Announcement) => void;
    onDelete: (announcement: Announcement) => void;
}

const getPriorityBadge = (priority: AnnouncementPriority) => {
    const styles: Record<AnnouncementPriority, string> = {
        critical: "bg-error/10 text-error border-error/20",
        high: "bg-warning/10 text-warning border-warning/20",
        medium: "bg-primary/10 text-primary border-primary/20",
        low: "bg-success/10 text-success border-success/20"
    };

    return (
        <span className={cn(
            "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
            styles[priority] || styles.medium
        )}>
            {priority}
        </span>
    );
};

const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return "";
    try {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
};

const AnnouncementTable: React.FC<AnnouncementTableProps> = ({
    announcements,
    isLoading,
    searchTerm,
    priorityFilter = "all",
    categoryFilter = "all",
    onEdit,
    onDelete
}) => {
    const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [isHovering, setIsHovering] = useState<string | null>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = (e: React.MouseEvent, announcement: Announcement) => {
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

        const rect = e.currentTarget.getBoundingClientRect();
        const pos = {
            x: rect.left + rect.width / 2,
            y: rect.top
        };

        setIsHovering(announcement.id);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

        hoverTimerRef.current = setTimeout(() => {
            setTooltipPos(pos);
            setActiveAnnouncement(announcement);
            // Small delay to trigger entry animation
            setTimeout(() => setIsTooltipVisible(true), 10);
        }, 1500);
    };

    const handleMouseLeave = () => {
        setIsHovering(null);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

        // Add a 300ms grace period before closing
        // This allows moving from pill to tooltip and prevents closure during scroll jitter
        exitTimerRef.current = setTimeout(() => {
            setIsTooltipVisible(false);
            // Wait for transition
            setTimeout(() => {
                setActiveAnnouncement(null);
            }, 300);
        }, 300);
    };

    // Permissions
    const { hasPermission: canEdit } = usePermissions(PERMISSIONS.ANNOUNCEMENT_EDIT);
    const { hasPermission: canDelete } = usePermissions(PERMISSIONS.ANNOUNCEMENT_DELETE);

    const columns: Column<Announcement>[] = [
        {
            _id: "sl_no",
            label: "SL NO.",
            format: (_: unknown, __: Announcement, index: number) => (
                <span className="font-bold text-foreground text-sm">
                    {(index + 1).toString().padStart(2, '0')}
                </span>
            )
        },
        {
            _id: "author",
            label: "Author",
            format: (_: unknown, row: Announcement) => (
                <div className="flex items-center gap-3">
                    {row.authorProfilePicture ? (
                        <img
                            src={row.authorProfilePicture}
                            alt={row.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-primary/10 shadow-sm shrink-0"
                            onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-avatar')?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    {!row.authorProfilePicture && (
                        <div className={cn(
                            "w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-black text-primary border border-primary/10 shadow-sm shrink-0 fallback-avatar"
                        )}>
                            {row.authorName?.charAt(0) || "U"}
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground">{row.authorName || "Unknown"}</span>
                    </div>
                </div>
            )
        },
        {
            _id: "details",
            label: "Subject",
            minWidth: 250,
            format: (_: unknown, row: Announcement) => (
                <div className="flex flex-col gap-1 max-w-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm line-clamp-1">
                            {row.title}
                        </span>
                        {row.deadlineTime && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20 uppercase tracking-tighter shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTimeStr(row.deadlineTime)}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-foreground-tertiary line-clamp-1 font-medium truncate">
                        {row.content}
                    </span>
                </div>
            )
        },
        {
            _id: "info",
            label: "Category & Priority",
            format: (_: unknown, row: Announcement) => (
                <div className="flex flex-col gap-1.5 items-start">
                    {getPriorityBadge(row.priority)}
                    <span className="text-xs font-semibold text-foreground-secondary capitalize pl-0.5">
                        {row.category}
                    </span>
                </div>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: Announcement) => {
                const now = new Date();
                const startDate = row.publishDate ? new Date(row.publishDate) : null;
                const endDate = (row.expiresAt || row.expiryDate) ? new Date((row.expiresAt || row.expiryDate) as string) : null;

                let statusLabel = "Published";
                let variant = "success";
                let Icon = CheckCircle2;

                if (startDate && startDate > now) {
                    statusLabel = "Upcoming";
                    variant = "warning";
                    Icon = Clock;
                } else if (endDate && endDate < now) {
                    status = "expired";
                    statusLabel = "Expired";
                    variant = "error";
                    Icon = AlertTriangle; // Need to import this or use another icon
                } else {
                    statusLabel = "Live";
                    variant = "success";
                    Icon = CheckCircle2;
                }

                return (
                    <div className="flex flex-col">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border w-fit flex items-center gap-1.5",
                            variant === "warning" && "bg-warning/10 text-warning border-warning/20",
                            variant === "success" && "bg-success/10 text-success border-success/20",
                            variant === "error" && "bg-error/10 text-error border-error/20"
                        )}>
                            <Icon className="w-3 h-3" />
                            {statusLabel}
                        </span>
                    </div>
                );
            }
        },
        {
            _id: "engagement",
            label: "Engagement",
            align: "center" as const,
            format: (_: unknown, row: Announcement) => (
                <div className="flex flex-col gap-2 items-start pl-4">
                    <div
                        className={cn(
                            "flex items-center gap-2 cursor-help px-2 py-1 rounded-lg transition-all duration-300 relative overflow-hidden group/pill",
                            isHovering === row.id ? "bg-primary/20 scale-105" : "bg-primary/5 hover:bg-primary/10"
                        )}
                        onMouseEnter={(e) => handleMouseEnter(e, row)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Progress Bar for the 1.5s delay */}
                        {isHovering === row.id && !isTooltipVisible && (
                            <div className="absolute bottom-0 left-0 h-[2px] bg-primary animate-[progress_1.5s_linear_forwards]" />
                        )}

                        <span className="text-xs font-bold text-primary relative z-10">{row.viewCount ?? row.readByCount ?? 0}</span>
                        <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wide relative z-10">Views</span>
                    </div>

                    {row.requiresAcknowledgement && (
                        <div className="flex items-center gap-2 px-2 py-1">
                            <span className="text-xs font-bold text-primary">{row.acknowledgmentCount ?? row.acknowledgedByCount ?? 0}</span>
                            <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wide">Accepted</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: Announcement) => (
                <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row);
                            }}
                            className="w-8 h-8 rounded-lg text-[#10b981] hover:bg-[#10b981]/10"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row);
                            }}
                            className="w-8 h-8 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-black/[0.03] overflow-hidden relative min-h-[400px]">
            {isLoading && (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Updating List...</p>
                </div>
            )}
            <div className="overflow-x-auto">
                <Table
                    columns={columns}
                    rows={announcements}
                    keyField="id"
                    className="border-none min-w-[800px]"
                    emptyState={
                        <EmptyState
                            title="No Announcements"
                            description={
                                searchTerm || priorityFilter !== "all" || categoryFilter !== "all"
                                    ? `No results for your current filters and search.`
                                    : "Create your first announcement to get started."
                            }
                            icon={<Bell className="w-12 h-12 text-primary/20" />}
                            className="py-20"
                        />
                    }
                />
            </div>

            {/* Viewer Tooltip Portal */}
            {activeAnnouncement && activeAnnouncement.viewers && activeAnnouncement.viewers.length > 0 ? createPortal(
                <div
                    className={cn(
                        "fixed mb-2 bg-surface/98 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-[9999] transition-all duration-300 ease-out min-w-[240px] max-h-80 flex flex-col pointer-events-auto overflow-hidden",
                        isTooltipVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                    )}
                    onMouseEnter={() => {
                        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
                        setIsTooltipVisible(true);
                    }}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        transform: `translate(-50%, -100%) translateY(-8px) ${isTooltipVisible ? 'scale(1)' : 'scale(0.95)'}`,
                        transformOrigin: 'bottom center'
                    }}
                >
                    {/* Fixed Header */}
                    <div className="px-4 py-3 border-b border-border/30 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest">
                            Viewer Details
                        </span>
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {activeAnnouncement.viewers.length} Viewers
                        </span>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 custom-scrollbar overscroll-contain">
                        <div className="p-4 flex flex-col gap-4">
                            {activeAnnouncement.viewers.map((viewer, idx) => (
                                <div key={idx} className="flex items-center gap-3 group/item">
                                    <div className="relative shrink-0">
                                        {viewer.profilePicture ? (
                                            <img
                                                src={viewer.profilePicture}
                                                alt={viewer.name}
                                                className="w-9 h-full rounded-full object-cover border border-border/50 shadow-sm transition-transform group-hover/item:scale-105"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[11px] font-black text-primary border border-primary/10 shadow-sm transition-transform group-hover/item:scale-105">
                                                {viewer.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success border-2 border-surface rounded-full shadow-sm" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-foreground truncate leading-tight group-hover/item:text-primary transition-colors">
                                            {viewer.name}
                                        </span>
                                        <span className="text-[10px] font-medium text-foreground-tertiary flex items-center gap-1.5 mt-1">
                                            <Clock className="w-3 h-3 text-primary/60" />
                                            {format(new Date(viewer.viewedAt), "MMM dd, hh:mm a")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            ) : null}
        </div>
    );
};

export default AnnouncementTable;
