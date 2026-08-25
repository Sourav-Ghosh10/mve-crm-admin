import { useEffect, useState } from "react";
import { Bell, Check, ExternalLink, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead
} from "../../store/slices/notificationSlice";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../common/Badge";
import { cn } from "../../lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { notifications, unreadCount } = useAppSelector((state) => state.notification);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchNotifications());

        // Refresh notifications every 2 minutes
        const interval = setInterval(() => {
            dispatch(fetchNotifications());
        }, 120000);

        return () => clearInterval(interval);
    }, [dispatch]);

    const handleNotificationClick = (id: string, actionUrl: string) => {
        dispatch(markNotificationRead(id));
        if (actionUrl) {
            navigate(actionUrl);
            setOpen(false);
        }
    };

    const getTypeIcon = (type: string) => {
        const normalizedType = type.toUpperCase().replace(/-/g, "_");
        switch (normalizedType) {
            case "LEAVE_REQUEST":
            case "ABSENCE_ALERT":
            case "ATTENDANCE_ALERT":
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case "LEAVE_APPROVED":
            case "LEAVE_REJECTED":
            case "ROSTER_EDIT_APPROVED":
            case "ROSTER_EDIT_REJECTED":
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "ANNOUNCEMENT":
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none">
                    <Bell className="h-6 w-6 text-gray-600" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center p-0 text-[10px] min-w-0"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96 p-0" align="end">
                <DropdownMenuLabel className="flex justify-between items-center p-4">
                    <span className="text-lg font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => dispatch(markAllNotificationsRead())}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <Check className="h-3 w-3" /> Mark all as read
                        </button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Bell className="h-10 w-10 text-gray-200 mb-2" />
                            <p className="text-sm text-gray-500">No new notifications</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={cn(
                                    "p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors group",
                                    !notification.isRead && "bg-blue-50/30"
                                )}
                                onClick={() => handleNotificationClick(notification._id, notification.actionUrl)}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0">
                                        {getTypeIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-semibold text-gray-900 truncate pr-4">
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                notification.priority === 'high' ? "bg-red-100 text-red-600" :
                                                    notification.priority === 'medium' ? "bg-amber-100 text-amber-600" :
                                                        "bg-gray-100 text-gray-600"
                                            )}>
                                                {notification.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                        <ExternalLink className="h-3 w-3 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <button
                    className="w-full p-3 text-center text-sm font-medium text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                        navigate("/notifications");
                        setOpen(false);
                    }}
                >
                    View all notifications
                </button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
