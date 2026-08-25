import { useMemo } from "react";
import {
    CheckCircle,
    XCircle,
    Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import type { Column } from "../../components/common/Table/Table";
import type { LeaveRequest } from "../../types/leave.types";
import Avatar from "../../components/common/Avatar";
import TimezoneDualView from "../../components/common/TimezoneDualView";
import { StatusBadge } from "./StatusBadge";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

import { useAppSelector } from "../../store/hooks";

interface UseLeaveColumnsProps {
    onApprove: (request: LeaveRequest) => void;
    onReject: (request: LeaveRequest) => void;
    currentUserId?: string;
    isAdmin?: boolean;
    canApproveLeave?: boolean;
}

export const useLeaveColumns = ({ onApprove, onReject, currentUserId }: UseLeaveColumnsProps) => {
    const adminTimezone = useAppSelector((state) => state.ui.selectedTimezone);

    const { hasPermission: canApproveLeave } = usePermissions(PERMISSIONS.LEAVE_APPROVE);
    const { hasPermission: canRejectLeave } = usePermissions(PERMISSIONS.LEAVE_REJECT);

    const handleDownload = async (url: string, fileName: string) => {
        try {
            // If it's a data URL, we can download it directly
            if (url.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // For external URLs, fetch as blob to force download
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);
            toast.success("Download started");
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: open in new tab
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const columns: Column<LeaveRequest>[] = useMemo(() => [
        {
            _id: "userId",
            label: "Employee",
            minWidth: 250,
            format: (_, row) => {
                if (!row.employeeId) {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground-tertiary font-black text-sm shadow-lg shadow-muted/20 shrink-0">
                                ?
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground-tertiary text-sm">Unknown Employee</h3>
                                <p className="text-xs text-foreground-tertiary font-medium">N/A</p>
                            </div>
                        </div>
                    );
                }

                if (typeof row.employeeId === 'string') {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground-tertiary font-black text-sm shadow-lg shadow-muted/20 shrink-0">
                                ?
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground-tertiary text-sm">Employee ID</h3>
                                <p className="text-xs text-foreground-tertiary font-medium">{row.employeeId}</p>
                            </div>
                        </div>
                    );
                }

                const firstName = typeof row.employeeId !== 'string' ? row.employeeId?.personalInfo?.firstName || '' : '';
                const lastName = typeof row.employeeId !== 'string' ? row.employeeId?.personalInfo?.lastName || '' : '';
                const profilePicture = typeof row.employeeId !== 'string' ? row.employeeId?.personalInfo?.profilePicture : undefined;
                const fullName = typeof row.employeeId !== 'string' ? row.employeeId?.fullName || `${firstName} ${lastName}` : 'Unknown';
                const designation = typeof row.employeeId !== 'string' ? row.employeeId?.employment?.designation || 'N/A' : 'N/A';

                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={profilePicture}
                            firstName={firstName}
                            lastName={lastName}
                            size="md"
                            className="shadow-lg shadow-primary/20 shrink-0"
                        />
                        <div>
                            <h3 className="font-bold text-foreground text-sm">
                                {fullName}
                            </h3>
                            <p className="text-xs text-foreground-tertiary font-medium">{designation}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            _id: "leaveType",
            label: "Leave Type",
            format: (value) => (
                <span className="text-xs font-bold text-foreground uppercase bg-accent/10 text-accent px-2 py-1 rounded-md border border-accent/20">
                    {(value as string).replace('_', ' ')}
                </span>
            )
        },
        {
            _id: "duration",
            label: "Duration",
            minWidth: 280,
            format: (_, row) => {
                const employeeTimezone = typeof row.employeeId !== 'string'
                    ? row.employeeId?.employment?.timezone || 'Asia/Kolkata'
                    : 'Asia/Kolkata';

                return (
                    <div className="flex flex-col gap-1.5 py-1">
                        <TimezoneDualView
                            startTime={row.startDate}
                            endTime={row.endDate}
                            primaryTimezone={employeeTimezone}
                            secondaryTimezone={adminTimezone}
                            showDate={true}
                            showTime={row.leaveType?.toLowerCase().includes('hourly')}
                            variant="minimal"
                        />
                        <span className="text-[9px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-full w-fit shadow-md shadow-indigo-200 dark:shadow-none uppercase tracking-widest">
                            {row.numberOfDays} {row.numberOfDays === 1 ? 'Day' : 'Days'}
                        </span>
                    </div>
                );
            }
        },
        {
            _id: "status",
            label: "Status",
            format: (_, row) => <StatusBadge status={row.status} />
        },
        {
            _id: "reason",
            label: "Reason",
            minWidth: 200,
            format: (value, row) => (
                <div className="flex flex-col gap-2 max-w-xs">
                    <p className="text-sm text-foreground-secondary truncate" title={value as string}>
                        {value as string}
                    </p>
                    {row.attachments && row.attachments.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-fit text-[10px] font-bold gap-1 text-info hover:bg-info/10 hover:text-info px-1.5 -ml-1.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                row.attachments.forEach((file) => {
                                    const url = typeof file === 'string' ? file : file.fileUrl;
                                    const fileName = typeof file === 'string' ? "Attachment" : file.fileName;
                                    if (!url) return;
                                    handleDownload(url, fileName);
                                });
                            }}
                        >
                            <Download className="w-3 h-3" />
                            {row.attachments.length > 1 ? `Attachments (${row.attachments.length})` : 'Attachment'}
                        </Button>
                    )}
                </div>
            )
        },
        {
            _id: "comment",
            label: "Comment",
            minWidth: 200,
            format: (_, row: any) => {
                let comment = row.adminComment || row.approvalComment || row.rejectionReason || row.comment;
                
                if (!comment && row.approvalFlow && row.approvalFlow.length > 0) {
                    const lastAction = row.approvalFlow[row.approvalFlow.length - 1];
                    if (lastAction && lastAction.comments) {
                        comment = lastAction.comments;
                    }
                }

                if (!comment) return <span className="text-foreground-tertiary text-xs italic">No comment</span>;
                return (
                    <p className="text-sm text-foreground-secondary truncate max-w-xs" title={comment}>
                        {comment}
                    </p>
                );
            }
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right",
            sticky: true,
            format: (_, row) => {
                if (row.status !== 'pending') {
                    return (
                        <div className="text-right">
                            <span className="text-[10px] font-medium text-foreground-tertiary block">Updated</span>
                            <span className="text-xs font-bold text-foreground">{format(new Date(row.updatedAt), "MMM dd")}</span>
                        </div>
                    );
                }

                // Check authorization: ONLY the reporting manager can act
                const reportingManager = typeof row.employeeId !== 'string'
                    ? row.employeeId?.employment?.reportingManager
                    : undefined;
                const reportingManagerId = typeof reportingManager === 'string'
                    ? reportingManager
                    : reportingManager?._id;

                const isAuthorized = canApproveLeave || canRejectLeave || (currentUserId && reportingManagerId === currentUserId);

                if (!isAuthorized) {
                    return (
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-tighter opacity-50">View Only</span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-2">
                        {(canApproveLeave || reportingManagerId === currentUserId) && (
                            <Button
                                className="w-8 h-8 rounded-lg shadow-success/20 text-success bg-success/10 hover:bg-success hover:text-white border border-success/20 p-0"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onApprove(row);
                                }}
                                title="Approve"
                            >
                                <CheckCircle className="w-4 h-4" />
                            </Button>
                        )}
                        {(canRejectLeave || reportingManagerId === currentUserId) && (
                            <Button
                                className="w-8 h-8 rounded-lg text-error bg-error/10 hover:bg-error hover:text-white border border-error/20 p-0"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject(row);
                                }}
                                title="Reject"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ], [onApprove, onReject, currentUserId, adminTimezone, canApproveLeave, canRejectLeave]);

    return columns;
};
