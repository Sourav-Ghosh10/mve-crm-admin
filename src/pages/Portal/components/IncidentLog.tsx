import React, { useState, useEffect } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Activity,
    Clock,
    ArrowRight,
    Search,
    Filter,
    Users,
    Wrench,
    Wifi,
    HardDrive,
    Globe,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { incidentService } from "../../../services/incidentService";
import type { Incident } from "../../../services/incidentService";

interface IncidentLogProps {
    userId?: string;
    clientId?: string;
}

const IncidentLog: React.FC<IncidentLogProps> = ({ userId, clientId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<string>("all");
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const data = await incidentService.getPortalIncidents(clientId);
                setIncidents(data);
            } catch (err) {
                console.error("Failed to fetch incidents", err);
                setIncidents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, [userId, clientId]);

    const getIncidentType = (incident: Incident) => {
        if (incident.status === "resolved") return "success";
        if (incident.severity === "high") return "error";
        if (incident.severity === "medium") return "warning";
        return "info";
    };

    const filteredIncidents = incidents.filter(inc => {
        const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inc.description.toLowerCase().includes(searchTerm.toLowerCase());
        const type = getIncidentType(inc);
        const matchesFilter = filter === "all" || type === filter;
        return matchesSearch && matchesFilter;
    });

    const getTypeConfig = (type: string) => {
        switch (type) {
            case "error":
                return { icon: AlertTriangle, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
            case "warning":
                return { icon: Activity, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" };
            case "success":
                return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/20" };
            case "info":
            default:
                return { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "staffing": return Users;
            case "technical": return Wifi;
            case "maintenance": return Wrench;
            case "infrastructure": return HardDrive;
            default: return Activity;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "active":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "resolved":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const activeCount = incidents.filter(i => i.status === "active").length;
    const resolvedCount = incidents.filter(i => i.status === "resolved").length;

    return (
        <div className="bg-surface rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border/50 bg-muted/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-black text-foreground tracking-tight uppercase flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Incident Log
                        </h2>
                        <p className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest mt-1">
                            Operational updates and service status
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full md:w-64"
                            />
                        </div>
                        <div className="relative group">
                            <button className="p-2 border border-border rounded-xl hover:bg-muted/50 transition-colors text-foreground-tertiary">
                                <Filter className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-32 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col p-1">
                                {["all", "error", "warning", "success", "info"].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={cn(
                                            "text-xs font-semibold px-3 py-2 text-left rounded-lg capitalize hover:bg-muted transition-colors",
                                            filter === f ? "bg-primary/10 text-primary" : "text-foreground-secondary"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface rounded-xl p-3 border border-border">
                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block mb-1">Open Issues</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-foreground leading-none">{activeCount}</span>
                            {activeCount > 0 && (
                                <span className="text-error text-xs font-bold mb-0.5"><ArrowRight className="w-3 h-3 inline rotate-45" /></span>
                            )}
                        </div>
                    </div>
                    <div className="bg-surface rounded-xl p-3 border border-border">
                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block mb-1">Resolved</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-foreground leading-none">{resolvedCount}</span>
                            <span className="text-foreground-tertiary text-xs font-bold mb-0.5">recent</span>
                        </div>
                    </div>
                    <div className="col-span-2 bg-gradient-to-r from-success/10 to-transparent rounded-xl p-3 border border-border/50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-2 h-2 rounded-full", activeCount === 0 ? "bg-success animate-pulse" : "bg-amber-500 animate-pulse")} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", activeCount === 0 ? "text-success" : "text-amber-600")}>
                                {activeCount === 0 ? "All Systems Normal" : `${activeCount} Active Incident${activeCount > 1 ? "s" : ""}`}
                            </span>
                        </div>
                        <p className="text-xs text-foreground-secondary">
                            {activeCount === 0
                                ? "All services are fully operational."
                                : "Our team is working to resolve the issues."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Log Feed */}
            <div className="p-6 flex-1 overflow-y-auto max-h-[600px] bg-muted/5 relative">
                {/* Timeline Line */}
                <div className="absolute left-10 top-6 bottom-6 w-px bg-border/50 hidden md:block" />

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredIncidents.length > 0 ? (
                            filteredIncidents.map((incident) => {
                                const type = getIncidentType(incident);
                                const config = getTypeConfig(type);
                                const Icon = config.icon;
                                const CatIcon = getCategoryIcon(incident.category);

                                return (
                                    <div key={incident._id} className="relative flex gap-4 md:gap-6 group">
                                        {/* Timeline Node */}
                                        <div className="hidden md:flex flex-col items-center">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center relative z-10 border shadow-sm transition-transform group-hover:scale-110", config.bg, config.border, config.color)}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Mobile Icon */}
                                        <div className={cn("w-10 h-10 rounded-full flex md:hidden items-center justify-center shrink-0 border shadow-sm", config.bg, config.border, config.color)}>
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        {/* Content Card */}
                                        <div className="flex-1 bg-surface border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", getStatusStyle(incident.status))}>
                                                            {incident.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-foreground-tertiary uppercase flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(incident.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-bold text-foreground">{incident.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-foreground-tertiary uppercase tracking-wider">
                                                    <span className={cn("flex items-center gap-1 capitalize")}>
                                                        <CatIcon className="w-3 h-3" /> {incident.category}
                                                    </span>
                                                    {incident.isGlobal && (
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <Globe className="w-3 h-3" /> Global
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                                                {incident.description}
                                            </p>

                                            {incident.resolutionNote && (
                                                <div className="bg-emerald-50 border border-emerald-200/50 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-emerald-700 font-medium">
                                                        <strong>Resolution:</strong> {incident.resolutionNote}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                                <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest mr-1">Severity:</span>
                                                <span className={cn(
                                                    "text-xs font-bold px-2.5 py-1 rounded-md border capitalize",
                                                    incident.severity === "high" ? "bg-red-50 text-red-600 border-red-200" :
                                                    incident.severity === "medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                )}>
                                                    {incident.severity === "high" ? "Critical" : incident.severity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-foreground-tertiary" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1">No logs found</h3>
                                <p className="text-sm text-foreground-secondary">
                                    {searchTerm || filter !== "all"
                                        ? "No incidents match your current search criteria."
                                        : "No operational incidents to report at this time."}
                                </p>
                                {(searchTerm || filter !== "all") && (
                                    <button
                                        onClick={() => { setSearchTerm(""); setFilter("all"); }}
                                        className="mt-4 text-sm font-semibold text-primary hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-surface flex justify-center">
                <span className="text-xs font-black uppercase text-foreground-tertiary tracking-widest">
                    {incidents.length} Incident{incidents.length !== 1 ? "s" : ""} on Record
                </span>
            </div>
        </div>
    );
};

export default IncidentLog;
