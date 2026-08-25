import React, { useState, useEffect } from "react";
import AssignedTeam from "./components/AssignedTeam";
import IncidentLog from "./components/IncidentLog";
import {
    Activity,
    ArrowUpRight,
    Zap,
    BarChart3,
    ShieldAlert
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAppSelector } from "../../store/hooks";
import { dashboardService } from "../../services/dashboardService";

interface DashboardStats {
    efficiency: number;
    availability: number;
    resourceLoad: number;
    security: string;
    clientCount?: number;
}

const TeamDashboard: React.FC = () => {
    const user = useAppSelector((state) => state.auth.user);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (user?.id) {
                    const response = await dashboardService.getStats(user.id);
                    setStats(response);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!user) {
        return <div className="text-center py-12">No user data available</div>;
    }

    // Use fetched stats or show placeholder
    const displayStats = stats || {
        efficiency: 0,
        availability: 0,
        resourceLoad: 0,
        security: "Pending",
        clientCount: 0
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header / Stats Overlay */}
            <div id="analytics-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface p-6 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:scale-110" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Efficiency</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-foreground tracking-tighter">{displayStats.efficiency.toFixed(1)}%</span>
                        {displayStats.efficiency > 0 && (
                            <div className="flex items-center text-success text-[10px] font-black mb-1.5">
                                <ArrowUpRight className="w-3 h-3" /> 2.1%
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-[2rem] border border-border/50 shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Availability</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-foreground tracking-tighter">{displayStats.availability.toFixed(1)}%</span>
                        <span className="text-[10px] font-bold text-foreground-tertiary mb-1.5 lowercase">Uptime</span>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-[2rem] border border-border/50 shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Resource Load</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-foreground tracking-tighter">{displayStats.resourceLoad.toFixed(0)}%</span>
                        <div className="w-20 h-1.5 bg-muted rounded-full mb-3 ml-2 overflow-hidden">
                            <div className="h-full bg-warning" style={{ width: `${displayStats.resourceLoad}%` }} />
                        </div>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-[2rem] border border-border/50 shadow-sm group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Active Accounts</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-foreground tracking-tighter">{displayStats.clientCount || 0}</span>
                        <span className="text-[10px] font-bold text-foreground-tertiary mb-1.5 uppercase ml-1">Clients</span>
                    </div>
                </div>
            </div>

            {/* Team Grid */}
            <div id="resources-section">
                <AssignedTeam userId={user?.id} />
            </div>

            <div id="logs-section">
                <IncidentLog userId={user?.id} clientId={user?.clientId} />
            </div>
        </div>
    );
};

export default TeamDashboard;
