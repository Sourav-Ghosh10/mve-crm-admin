
import {
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { LeaveStatus } from "../../types/leave.types";

export const StatusBadge = ({ status }: { status: LeaveStatus }) => {
    const styles = {
        pending: "bg-warning/10 text-warning border-warning/20",
        approved: "bg-success/10 text-success border-success/20",
        rejected: "bg-error/10 text-error border-error/20",
        cancelled: "bg-gray-100 text-gray-500 border-gray-200",
    };

    const icons = {
        pending: Clock,
        approved: CheckCircle,
        rejected: XCircle,
        cancelled: XCircle,
    };

    const Icon = icons[status];

    return (
        <span className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider",
            styles[status]
        )}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};
