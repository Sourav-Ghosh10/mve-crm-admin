import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Clock,
  Calendar,
  X,
  Building2,
  Briefcase,
  Settings,
  ChevronDown,
  ChevronRight,
  Tag,
  History as HistoryIcon,
  Megaphone,
  CalendarOff,
  Receipt,
  UserCheck,
  Layers,
  LayoutDashboard,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Banknote,
  Coffee
  // BarChart3,
  // LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import Button from "../common/Button";
import { useAnyPermission } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 64; // 4rem = 64px

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  onSupportClick?: () => void;
}

interface MenuItem {
  text: string;
  icon: LucideIcon;
  path: string;
  isSection?: boolean;
  /** Permission(s) required to show this item. If any one matches, the item is shown. */
  requiredPermissions?: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    text: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    text: "Announcements",
    icon: Megaphone,
    path: "/announcements",
    requiredPermissions: [PERMISSIONS.ANNOUNCEMENT_VIEW],
  },
  {
    text: "Users",
    icon: Users,
    path: "/users",
    requiredPermissions: [PERMISSIONS.EMPLOYEE_VIEW],
  },
  {
    text: "Clients",
    icon: Users,
    path: "/clients",
    isSection: true,
    requiredPermissions: [PERMISSIONS.CLIENT_VIEW, PERMISSIONS.INCIDENT_VIEW],
    children: [
      {
        text: "Client Registry",
        icon: Users,
        path: "/clients",
        requiredPermissions: [PERMISSIONS.CLIENT_VIEW],
      },
      {
        text: "Incident Log",
        icon: AlertTriangle,
        path: "/clients/incidents",
        requiredPermissions: [PERMISSIONS.INCIDENT_VIEW],
      },
    ],
  },
  {
    text: "Organization",
    icon: Settings,
    path: "/admin",
    isSection: true,
    requiredPermissions: [
      PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_MANAGE,
      PERMISSIONS.DEPARTMENT_VIEW, PERMISSIONS.DEPARTMENT_MANAGE,
      PERMISSIONS.DESIGNATION_VIEW, PERMISSIONS.DESIGNATION_MANAGE,
      PERMISSIONS.HOLIDAY_VIEW, PERMISSIONS.HOLIDAY_MANAGE,
      PERMISSIONS.LEAVE_TYPE_MANAGE, PERMISSIONS.LEAVE_BALANCE_MANAGE,
      PERMISSIONS.BREAK_TYPE_MANAGE,
      PERMISSIONS.REIMBURSEMENT_TYPE_MANAGE,
      PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_MANAGE,
    ],
    children: [
      { text: "Office Locations", icon: Building2, path: "/admin/locations", requiredPermissions: [PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_MANAGE] },
      { text: "Departments", icon: Layers, path: "/admin/departments", requiredPermissions: [PERMISSIONS.DEPARTMENT_VIEW, PERMISSIONS.DEPARTMENT_MANAGE] },
      { text: "Designations", icon: Briefcase, path: "/admin/designations", requiredPermissions: [PERMISSIONS.DESIGNATION_VIEW, PERMISSIONS.DESIGNATION_MANAGE] },
      { text: "Holidays", icon: Calendar, path: "/admin/holidays", requiredPermissions: [PERMISSIONS.HOLIDAY_VIEW, PERMISSIONS.HOLIDAY_MANAGE] },
      { text: "Leave Types", icon: Tag, path: "/admin/leave-types", requiredPermissions: [PERMISSIONS.LEAVE_TYPE_MANAGE] },
      { text: "Break Types", icon: Coffee, path: "/admin/break-types", requiredPermissions: [PERMISSIONS.BREAK_TYPE_MANAGE] },
      { text: "Leave Balances", icon: HistoryIcon, path: "/admin/leave-balances", requiredPermissions: [PERMISSIONS.LEAVE_BALANCE_MANAGE] },
      { text: "Reimbursement Types", icon: Tag, path: "/admin/reimbursement-types", requiredPermissions: [PERMISSIONS.REIMBURSEMENT_TYPE_MANAGE] },
      { text: "Roles", icon: UserCheck, path: "/admin/roles", requiredPermissions: [PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_MANAGE] },
      { text: "System Settings", icon: Settings, path: "/admin/settings", requiredPermissions: [PERMISSIONS.ROLE_MANAGE] },
    ],
  },
  {
    text: "Schedule",
    icon: Calendar,
    path: "/schedule",
    isSection: true,
    requiredPermissions: [PERMISSIONS.SCHEDULE_VIEW],
    children: [
      { text: "Roster Management", icon: LayoutDashboard, path: "/schedule", requiredPermissions: [PERMISSIONS.SCHEDULE_VIEW] },
      { text: "Roster Requests", icon: Clock, path: "/schedule/requests", requiredPermissions: [PERMISSIONS.SCHEDULE_MANAGE] },
    ],
  },
  {
    text: "Attendance",
    icon: Clock,
    path: "/attendance",
    requiredPermissions: [PERMISSIONS.ATTENDANCE_VIEW],
  },
  {
    text: "Leave",
    icon: CalendarOff,
    path: "/leave",
    requiredPermissions: [PERMISSIONS.LEAVE_VIEW],
  },
  {
    text: "Reimbursements",
    icon: Receipt,
    path: "/reimbursements",
    requiredPermissions: [PERMISSIONS.REIMBURSEMENT_VIEW],
  },
  {
    text: "Support",
    icon: HelpCircle,
    path: "/support",
    isSection: true,
    requiredPermissions: [PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.SUPPORT_MANAGE],
    children: [
      { text: "All Tickets", icon: MessageSquare, path: "/support/tickets", requiredPermissions: [PERMISSIONS.SUPPORT_VIEW] },
      { text: "Settings", icon: Settings, path: "/support/settings", requiredPermissions: [PERMISSIONS.SUPPORT_MANAGE] },
    ],
  },
  {
    text: "Payroll",
    icon: Banknote,
    path: "/payroll",
    isSection: true,
    requiredPermissions: [PERMISSIONS.PAYROLL_VIEW],
    children: [
      { text: "Component Master", icon: Layers, path: "/admin/payroll-masters", requiredPermissions: [PERMISSIONS.PAYROLL_MANAGE] },
      { text: "Salary Config", icon: Settings, path: "/payroll/salary-configs", requiredPermissions: [PERMISSIONS.PAYROLL_VIEW] },
      { text: "Monthly Payslips", icon: Receipt, path: "/payroll/payslips", requiredPermissions: [PERMISSIONS.PAYROLL_VIEW] },
    ],
  },
];

/**
 * Wrapper component to filter an individual menu item based on permissions.
 * Uses the useAnyPermission hook (which handles Super Admin bypass).
 */
const PermissionGuard: React.FC<{
  permissions?: string[];
  children: React.ReactNode;
}> = ({ permissions, children }) => {
  const hasAccess = useAnyPermission(...(permissions || []));

  // If no specific permissions required, always show
  if (!permissions || permissions.length === 0) {
    return <>{children}</>;
  }

  return hasAccess ? <>{children}</> : null;
};

const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  handleDrawerToggle,
  onSupportClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Organization: true, // Keep it open by default
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-gradient-to-b from-primary to-primary-dark text-white">
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/") ||
            (item.children?.some(child => location.pathname === child.path || location.pathname.startsWith(child.path + "/")));

          if (item.isSection && item.children) {
            const isOpen = openSections[item.text];

            // Filter children based on permissions
            return (
              <PermissionGuard key={item.text} permissions={item.requiredPermissions}>
                <div className="mb-1">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSection(item.text)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-3 transition-all duration-200 hover:bg-white/10 group rounded-none h-auto",
                      isActive ? "text-white" : "text-white/70 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-accent")} />
                      <span className={cn("text-sm font-bold tracking-tight uppercase", isActive && "text-white")}>{item.text}</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                  </Button>
                  {isOpen && (
                    <div className="mt-1 space-y-1 bg-black/10">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path || location.pathname.startsWith(child.path + "/");
                        return (
                          <PermissionGuard key={child.text} permissions={child.requiredPermissions}>
                            <Button
                              variant="ghost"
                              onClick={() => handleNavigation(child.path)}
                              className={cn(
                                "w-full flex items-center gap-4 pl-12 pr-5 py-2.5 text-left transition-all duration-200 border-l-4 rounded-none h-auto justify-start",
                                isChildActive
                                  ? "bg-white/10 border-accent text-white font-bold"
                                  : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <ChildIcon className={cn("w-4 h-4", isChildActive && "text-accent")} />
                              <span className="text-sm font-normal">{child.text}</span>
                            </Button>
                          </PermissionGuard>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PermissionGuard>
            );
          }

          return (
            <PermissionGuard key={item.text} permissions={item.requiredPermissions}>
              <Button
                variant="ghost"
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all duration-200",
                  "border-l-4 hover:bg-white/10 group rounded-none h-auto justify-start",
                  isActive
                    ? "bg-white/15 border-accent font-bold text-white shadow-inner"
                    : "border-transparent text-white/80 hover:text-white",
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-accent")} />
                <span className="text-sm font-medium tracking-wide">{item.text}</span>
              </Button>
            </PermissionGuard>
          );
        })}
      </nav>

      {/* Support Section */}
      <div className="px-4 mb-2">
        <button
          onClick={onSupportClick}
          className="w-full flex items-center gap-4 px-5 py-3 text-left transition-all duration-200 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 group h-auto"
        >
          <HelpCircle className="w-5 h-5 transition-transform group-hover:scale-110 text-accent" />
          <div className="flex flex-col text-left">
            <span className="text-sm font-black uppercase tracking-wider">Support</span>
            <span className="text-[10px] opacity-50 font-bold">Get Assistance</span>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          &copy; {new Date().getFullYear()} CodecIT
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          style={{ top: HEADER_HEIGHT }}
          onClick={handleDrawerToggle}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 bottom-0 z-40 transform transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ top: HEADER_HEIGHT, width: DRAWER_WIDTH }}
      >
        <div className="absolute top-2 right-2 md:hidden z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors h-auto w-auto"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop permanent drawer - starts below header */}
      <aside
        className="hidden md:block fixed left-0 bottom-0 z-30 shadow-xl"
        style={{ top: HEADER_HEIGHT, width: DRAWER_WIDTH }}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
