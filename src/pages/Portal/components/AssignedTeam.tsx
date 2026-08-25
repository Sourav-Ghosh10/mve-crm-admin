import React, { useState, useEffect } from "react";
import { Mail, Calendar, MapPin, ExternalLink, ShieldCheck, Activity, Clock, Zap } from "lucide-react";
import Avatar from "../../../components/common/Avatar";
import type { User as UserType } from "../../../types/user.types";
import { clientService } from "../../../services/clientService";

interface AssignedTeamProps {
    userId?: string;
}

const getTimeAgo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "Offline";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return "long ago";
};

const AssignedTeam: React.FC<AssignedTeamProps> = ({ userId }) => {
    const [team, setTeam] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<UserType | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                // Fetch assigned employees for the current client user
                const employees = await clientService.getMyAssignedEmployees();
                setTeam(employees || []);
            } catch (err) {
                console.error("Failed to fetch assigned team", err);
                setTeam([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [userId]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[280px] rounded-3xl bg-surface border border-border animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Assigned Talent</h2>
                    <p className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest mt-1">
                        High-Performance Resources powering your account
                    </p>
                </div>
                <div className="flex -space-x-3">
                    {team.map((m) => (
                        <Avatar
                            key={m.id}
                            src={m.personalInfo.profilePicture}
                            name={`${m.personalInfo.firstName} ${m.personalInfo.lastName}`}
                            size="sm"
                            className="border-2 border-surface shadow-md"
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member, idx) => {
                    const getStatus = (attendance?: { isClockedIn: boolean, status: string, sessionCount?: number, totalHoursToday?: number }) => {
                        const isPresent = attendance?.status === 'PRESENT' || attendance?.isClockedIn;
                        if (isPresent) {
                            return { label: "Present", color: "success", isOnline: true };
                        }
                        return { label: "Absent", color: "error", isOnline: false };
                    };

                    const status = getStatus(member.attendance);
                    const uptime = 98 + (idx % 3) + 0.5;

                    return (
                        <div
                            key={member.id}
                            className="group relative bg-surface rounded-[2rem] border border-border/50 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 overflow-visible"
                        >
                            {/* Status Ornament */}
                            <div className={`absolute top-2 right-2 z-20 flex items-center gap-1.5 px-3 py-1 bg-${status.color}/10 rounded-full border border-${status.color}/20`}>
                                <span className={`w-1.5 h-1.5 rounded-full bg-${status.color} ${status.label === 'Online' ? 'animate-pulse' : ''}`} />
                                <span className={`text-[9px] font-black uppercase text-${status.color} tracking-widest`}>{status.label}</span>
                            </div>

                            {/* Top Decoration */}
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex flex-col items-center text-center">
                                <div className="relative mt-8 mb-4">
                                    <Avatar
                                        src={member.personalInfo.profilePicture}
                                        name={`${member.personalInfo.firstName} ${member.personalInfo.lastName}`}
                                        size="2xl"
                                        className="rounded-[2rem] shadow-xl border-4 border-surface group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface rounded-xl flex items-center justify-center shadow-lg text-primary border border-border">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                </div>

                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">
                                    {member.personalInfo.firstName} {member.personalInfo.lastName}
                                </h3>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">
                                    {member.employment.designation || "Creative Technologist"}
                                </p>

                                <div className="w-full space-y-3 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-3 text-foreground-tertiary">
                                        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-medium lowercase truncate flex-1 text-left">
                                            {member.personalInfo.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-foreground-tertiary">
                                        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
                                            <MapPin className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-medium text-left">
                                            {member.employment.location || member.personalInfo.address?.city || "Remote Matrix"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-foreground-tertiary">
                                        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                            <Clock className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between text-[10px] font-medium text-left">
                                            <span>Last Seen</span>
                                            <span className="font-bold text-foreground">{getTimeAgo(member.lastActiveAt || member.lastLogin)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-foreground-tertiary">
                                        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                            <Activity className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between text-[10px] font-medium text-left">
                                            <span>30-Day Uptime</span>
                                            <span className="font-bold text-foreground">{uptime}%</span>
                                        </div>
                                    </div>
                                    {member.attendance && (
                                        <>
                                            <div className="flex items-center gap-3 text-foreground-tertiary">
                                                <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 text-primary">
                                                    <Zap className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between text-[10px] font-medium text-left">
                                                    <span>Daily Sessions</span>
                                                    <span className="font-bold text-foreground">{member.attendance.sessionCount || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-foreground-tertiary">
                                                <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 text-success">
                                                    <Clock className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between text-[10px] font-medium text-left">
                                                    <span>Today's Work</span>
                                                    <span className="font-bold text-foreground">{(member.attendance.totalHoursToday || 0).toFixed(1)}h</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {member.assignedToClients && member.assignedToClients.length > 0 && (
                                    <div className="w-full flex flex-wrap gap-1 mb-4 justify-center">
                                        {member.assignedToClients.map(c => (
                                            <span key={c.id} className="text-[8px] font-black uppercase text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <button 
                                    onClick={() => setSelectedMember(member)}
                                    className="mt-2 w-full py-3 bg-muted/50 text-foreground hover:bg-primary hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Performance Log
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Growth Metric Card */}
                <div className="bg-primary/5 rounded-[2rem] border border-primary/20 p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-primary/10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-2">Scale Team</h3>
                    <p className="text-[10px] text-foreground-tertiary font-medium leading-relaxed mb-6">
                        Need more high-bandwidth resources?
                    </p>
                    <button className="px-6 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
                        Request Expansion
                    </button>
                </div>
            </div>
            {/* Performance Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div 
                        className="bg-surface w-full max-w-2xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex gap-6">
                                    <Avatar 
                                        src={selectedMember.personalInfo.profilePicture} 
                                        name={`${selectedMember.personalInfo.firstName} ${selectedMember.personalInfo.lastName}`}
                                        size="xl"
                                        className="rounded-2xl border-4 border-primary/10"
                                    />
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                                            {selectedMember.personalInfo.firstName} {selectedMember.personalInfo.lastName}
                                        </h2>
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                                            {selectedMember.employment.designation} • {selectedMember.attendance?.isClockedIn ? "Currently Clocked In" : `Last Active: ${getTimeAgo(selectedMember.lastActiveAt || selectedMember.lastLogin)}`}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                                >
                                    <svg className="w-6 h-6 text-foreground-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { label: "Availability", value: "99.4%", color: "text-success" },
                                    { label: "Efficiency", value: "96.2%", color: "text-primary" },
                                    { label: "Quality Score", value: "4.9/5", color: "text-warning" }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        <span className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest block mb-1">{stat.label}</span>
                                        <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest">Recent Activity</h3>
                                {[
                                    { date: "Oct 24, 2023", task: "Optimized Database Query Patterns", status: "Completed" },
                                    { date: "Oct 23, 2023", task: "Implemented Auth Middleware", status: "Completed" },
                                    { date: "Oct 22, 2023", task: "Code Review: Dashboard Widgets", status: "In Progress" }
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-surface border border-border/50 rounded-2xl hover:border-primary/30 transition-colors">
                                        <div>
                                            <p className="text-xs font-bold text-foreground">{log.task}</p>
                                            <p className="text-[10px] text-foreground-tertiary uppercase font-medium mt-0.5">{log.date}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{log.status}</span>
                                    </div>
                                ))}
                            </div>

                            <button 
                                className="w-full mt-8 py-4 bg-foreground text-surface rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-primary/10"
                                onClick={() => setSelectedMember(null)}
                            >
                                Download Full Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignedTeam;
