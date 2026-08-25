import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Heart,
  Briefcase,
  Building,
  ExternalLink,
  Edit,
  MoreVertical,
  CheckCircle2,
  User as UserIcon,
  WifiOff,
  History,
} from "lucide-react";
import type { User } from "../../types/user.types";
import Button from "../../components/common/Button";
import BackButton from "../../components/common/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/Card";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import Avatar from "../../components/common/Avatar";
import { userService } from "../../services/userService";
import type { EmployeePresence } from "../../services/userService";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

// ─── Presence helpers ───────────────────────────────────────────────
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

const isUserOnline = (lastActiveAt: string | null | undefined): boolean => {
  if (!lastActiveAt) return false;
  return new Date(lastActiveAt).getTime() > Date.now() - ONLINE_THRESHOLD_MS;
};

const getTimeAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return "long time ago";
};
// ────────────────────────────────────────────────────────────────────

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [presenceData, setPresenceData] = useState<EmployeePresence | null>(null);

  // Permissions
  const { hasPermission: canEdit } = usePermissions(PERMISSIONS.EMPLOYEE_EDIT);
  const { hasPermission: canViewHistory } = usePermissions(PERMISSIONS.VIEW_USER_LOCATION_HISTORY);

  // Fetch presence data for this user
  const fetchPresence = useCallback(async () => {
    if (!id) return;
    try {
      const allPresence = await userService.getPresence();
      const match = allPresence.find((p) => p._id === id);
      if (match) setPresenceData(match);
    } catch (err) {
      console.error("Failed to fetch presence:", err);
    }
  }, [id]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const userData = await userService.getById(id);
        setUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchPresence();
  }, [id, fetchPresence]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClick = () => setIsMoreMenuOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isMoreMenuOpen]);

  if (loading) {
    return <GlobalLoader fullScreen message="Retreiving Profile..." />;
  }

  if (!user) {
    return (
      <div className="text-center p-12 bg-surface rounded-3xl border border-border shadow-soft flex flex-col items-center gap-4 max-w-md mx-auto mt-20">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Profile Not Found</h3>
          <p className="text-foreground-secondary mt-1">The employee profile you're looking for doesn't exist.</p>
        </div>
        <Button variant="outline" className="mt-2 rounded-xl" onClick={() => navigate("/users")}>
          Return to directory
        </Button>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const dayMap: Record<string, string> = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
  };

  return (
    <div className="space-y-6 animate-in mt-6 fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-4 lg:px-6">
      <div className="flex justify-between items-center mb-4">
        <BackButton label="Directory" />
      </div>

      {/* Dynamic Header Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-surface border border-border/50 shadow-md">
        {/* Cover Background */}
        <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary via-primary-dark to-primary-dark relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary-light/20 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreMenuOpen(!isMoreMenuOpen);
                }}
                className={cn(
                  "p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/30 text-white transition-all shadow-md active:scale-95 hover:bg-white/25 h-auto w-auto",
                  isMoreMenuOpen && "bg-white/30 scale-95"
                )}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>

              {isMoreMenuOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canEdit && (
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/users/edit/${user._id}`)}
                      className="w-full h-auto flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left justify-start rounded-none"
                      startIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit Profile
                    </Button>
                  )}
                  {canViewHistory && (
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/users/${user._id}/location-history`)}
                      className="w-full h-auto flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left justify-start rounded-none"
                      startIcon={<History className="w-4 h-4" />}
                    >
                      Login History
                    </Button>
                  )}
                  <div className="h-px bg-border/50" />
                  <div className="px-4 py-2 text-[10px] font-black text-foreground-tertiary uppercase tracking-widest bg-muted/30">
                    Account Status
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", user.isActive ? "bg-success" : "bg-error")} />
                    <span className="text-xs font-bold">{user.isActive ? "System Active" : "Suspended"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 pb-6 sm:pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6 lg:gap-10 -mt-16 sm:-mt-20 lg:-mt-24 relative z-10">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="bg-surface p-2 rounded-xl sm:rounded-xl shadow-2xl border-4 border-surface">
                <Avatar
                  src={user.personalInfo.profilePicture}
                  firstName={user.personalInfo.firstName}
                  lastName={user.personalInfo.lastName}
                  size="2xl"
                />
              </div>
              {(() => {
                const lastActive = presenceData?.lastActiveAt || user.lastActiveAt;
                const online = isUserOnline(lastActive);
                return (
                  <div className={cn(
                    "absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 border-4 border-surface rounded-full shadow-lg transition-colors",
                    online ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-400"
                  )} />
                );
              })()}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left pb-2 sm:pb-4 w-full">
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 mb-3 sm:mb-8">
                <div className="space-y-1">
                  <h1 className={cn(
                    "text-3xl sm:text-4xl lg:text-5xl tracking-tighter drop-shadow-sm font-black transition-colors duration-300",
                    user.userType === 'CLIENT' ? "text-foreground" : "text-white"
                  )}>
                    {user.personalInfo.firstName} {user.personalInfo.lastName}
                  </h1>
                  <p className={cn(
                    "text-sm sm:text-base font-bold lowercase tracking-tight transition-colors duration-300",
                    user.userType === 'CLIENT' ? "text-foreground-tertiary" : "text-white/60"
                  )}>
                    @{user.username}
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-3 items-center">
                  {user.isAdmin && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-[9px] font-black tracking-widest shadow-lg shadow-amber-500/20">
                      ADMIN
                    </span>
                  )}
                  {user.googleId && (
                    <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black tracking-widest flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" />
                      GOOGLE LINKED
                    </span>
                  )}
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-widest flex items-center gap-1.5 transition-all duration-300",
                    user.userType === 'CLIENT' 
                      ? "bg-success/10 text-success border-success/20" 
                      : "bg-white/15 text-white border-white/30 backdrop-blur-md"
                  )}>
                    <CheckCircle2 className="w-3 h-3" />
                    {user.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  {(() => {
                    const lastActive = presenceData?.lastActiveAt || user.lastActiveAt;
                    const online = isUserOnline(lastActive);
                    return (
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-1.5 border transition-all duration-300",
                        online
                          ? (user.userType === 'CLIENT' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-emerald-400/20 text-white border-emerald-400/30 backdrop-blur-md")
                          : (user.userType === 'CLIENT' ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white/10 text-white/70 border-white/20 backdrop-blur-md")
                      )}>
                        {online ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            ONLINE
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3" />
                            {lastActive ? `SEEN ${getTimeAgo(lastActive).toUpperCase()}` : "OFFLINE"}
                          </>
                        )}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Job Details - Hide for Client Users */}
              {user.userType !== 'CLIENT' && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8 bg-muted/10 md:bg-white/10 md:backdrop-blur-sm p-4 rounded-2xl border border-white/10 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-tertiary/80">Designation</p>
                      <p className="text-sm sm:text-base font-black text-foreground leading-tight">{user.employment?.designation || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border/20 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-tertiary/80">Department</p>
                      <p className="text-sm sm:text-base font-black text-foreground leading-tight">{user.employment?.department || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Essentials & Network */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity & Metadata */}
          <Card variant="default" className="rounded-3xl border-border/50 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Account Credentials</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-muted/50 border border-border/20">
                  <p className="text-[9px] font-black text-foreground-tertiary uppercase mb-1">Employee ID</p>
                  <p className="text-sm font-bold text-foreground truncate">{user.employeeId}</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/50 border border-border/20">
                  <p className="text-[9px] font-black text-foreground-tertiary uppercase mb-1">Username</p>
                  <p className="text-sm font-bold text-foreground truncate">@{user.username}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground-tertiary uppercase">Created At</span>
                  <span className="font-medium">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground-tertiary uppercase">Last Updated</span>
                  <span className="font-medium">{formatDate(user.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground-tertiary uppercase">Last Login</span>
                  <span className="font-medium">{formatDate(user.lastLogin)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground-tertiary uppercase">Last Active</span>
                  {(() => {
                    const lastActive = presenceData?.lastActiveAt || user.lastActiveAt;
                    const online = isUserOnline(lastActive);
                    return online ? (
                      <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online now
                      </span>
                    ) : (
                      <span className="font-medium">{lastActive ? getTimeAgo(lastActive) : "N/A"}</span>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground-tertiary uppercase">Password Alteration</span>
                  <span className="font-medium">{formatDate(user.passwordChangedAt)}</span>
                </div>
                {user.failedLoginAttempts > 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-error uppercase">Security Alerts</span>
                    <span className="font-black text-error bg-error/10 px-2 py-0.5 rounded-md">{user.failedLoginAttempts} Failed Attempts</span>
                  </div>
                )}
                {user.accountLockedUntil && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-error uppercase">Account Lock</span>
                    <span className="font-medium text-error">{formatDate(user.accountLockedUntil)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card variant="bordered" className="rounded-3xl border-primary/10 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Connectivity</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-transparent hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-foreground-tertiary uppercase">Email Address</p>
                  <p className="text-sm font-bold text-foreground truncate">{user.personalInfo.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-transparent hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-foreground-tertiary uppercase">Mobile Number</p>
                  <p className="text-sm font-bold text-foreground">{user.personalInfo.phone || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Security */}
          <Card variant="bordered" className="rounded-3xl border-indigo-500/10 shadow-md overflow-hidden">
            <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Network Security</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-[9px] font-black text-foreground-tertiary uppercase mb-3">Allowed IP Addresses</p>
              {user.allowedIPs && user.allowedIPs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.allowedIPs.map(ip => (
                    <span key={ip} className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold font-mono">
                      {ip}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success text-xs font-bold bg-success/5 p-3 rounded-xl border border-success/10">
                  <CheckCircle2 className="w-4 h-4" />
                  No IP restrictions applied (Global Access)
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Career & Personal */}
        <div className="lg:col-span-8 space-y-6">
          {user.userType !== 'CLIENT' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Employment Card */}
              <Card variant="bordered" className="md:col-span-3 rounded-[2.5rem] border-border/50 shadow-md overflow-hidden bg-surface">
                <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 bg-muted/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight">Employment Journey</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div>
                      <label className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest block mb-1.5">Join Date</label>
                      <p className="text-sm font-bold text-foreground">{formatDateOnly(user.employment?.dateOfJoining)}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest block mb-1.5">Work Type</label>
                      <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-xs font-black uppercase">{user.employment?.employmentType || 'N/A'}</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest block mb-1.5">Office Hub</label>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {user.employment?.location || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest block mb-1.5">Reporting Manager</label>
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        {typeof user.employment?.reportingManager === 'object' && user.employment?.reportingManager ? (
                          <>
                            <Avatar
                              src={user.employment.reportingManager.personalInfo?.profilePicture}
                              firstName={user.employment.reportingManager.personalInfo?.firstName}
                              lastName={user.employment.reportingManager.personalInfo?.lastName}
                              size="xs"
                            />
                            {user.employment.reportingManager.personalInfo?.firstName} {user.employment.reportingManager.personalInfo?.lastName}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 font-bold text-foreground-tertiary">
                            <UserIcon className="w-3.5 h-3.5" />
                            N/A
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-[2rem] bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-foreground-tertiary">Operational Window</span>
                      </div>
                      <span className="text-sm font-black text-primary">
                        {user.employment?.workingHours?.startTime || 'N/A'} — {user.employment?.workingHours?.endTime || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(dayMap).map(dayKey => {
                        const isOff = user.employment?.workingHours?.weeklyOff?.some(offDay =>
                          offDay === dayKey || offDay === dayMap[dayKey]
                        );
                        return (
                          <span key={dayKey} className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all",
                            isOff
                              ? "bg-error/5 border-error/20 text-error/60"
                              : "bg-success/5 border-success/20 text-success"
                          )}>
                            {dayKey}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privileges Card */}
              <Card variant="bordered" className="md:col-span-2 rounded-[2.5rem] border-border/50 shadow-md bg-surface h-full">
                <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 bg-muted/30">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Shield className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight">Privileges</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {[
                      { key: 'canApproveLeave', label: 'Absence Approval' },
                      { key: 'canApproveReimbursement', label: 'Financial Approval' },
                      { key: 'canManageSchedule', label: 'Schedule Management' },
                      { key: 'canViewReports', label: 'View Reports' }
                    ].map((perm) => (
                      <div key={perm.key} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 group hover:bg-muted transition-all">
                        <span className="text-xs font-bold text-foreground-tertiary group-hover:text-foreground transition-colors">{perm.label}</span>
                        {user.permissions?.[perm.key as keyof User['permissions']] ? (
                          <CheckCircle2 className="w-5 h-5 text-success animate-in zoom-in duration-300" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border/50" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Entitlement & Personal Detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entitlement Card */}
            {/* <Card variant="bordered" className="rounded-[2.5rem] border-orange-500/10 shadow-md bg-surface overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-foreground">Entitlements</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/leave-balances/${user._id}`)}
                    className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                    startIcon={<Edit className="w-3 h-3" />}
                  >
                    Adjust
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(user.leaveBalance).map(([key, value]) => (
                    <div key={key} className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 hover:scale-[1.02] transition-transform">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">{key} Credits</p>
                      <p className="text-2xl font-black text-orange-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card> */}

            {/* Residential Detail */}
            <Card variant="bordered" className="rounded-[2.5rem] border-info/10 shadow-md bg-surface">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">Residency</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest mb-1">Permanent Address</p>
                    <p className="text-sm font-bold leading-relaxed text-foreground">
                      {user.personalInfo.address?.street}, {user.personalInfo.address?.city}<br />
                      {user.personalInfo.address?.state}, {user.personalInfo.address?.zipCode}<br />
                      <span className="text-info">{user.personalInfo.address?.country}</span>
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest mb-1">Date of Birth</p>
                        <p className="text-sm font-bold text-foreground">{formatDateOnly(user.personalInfo?.dateOfBirth)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>



            {/* Emergency Nexus */}
            <Card variant="bordered" className="rounded-[2.5rem] border-error/10 shadow-md bg-surface relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Heart className="w-20 h-20 text-error" />
              </div>
              <CardContent className="pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-error rounded-full" />
                  <h4 className="text-xl font-black tracking-tight">Emergency Nexus</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-error/5 flex items-center justify-center text-error border border-error/10 shadow-inner">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground-tertiary uppercase tracking-widest mb-1">Primary Liaison</p>
                      <p className="text-lg font-black text-foreground">{user.personalInfo.emergencyContact?.name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div>
                      <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest mb-1">Bond</p>
                      <p className="text-sm font-bold text-foreground uppercase tracking-wider">{user.personalInfo.emergencyContact?.relationship}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest mb-1">Secure Line</p>
                      <p className="text-sm font-bold text-foreground font-mono">{user.personalInfo.emergencyContact?.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
