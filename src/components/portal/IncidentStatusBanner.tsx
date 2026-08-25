import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { incidentService } from "../../services/incidentService";
import type { Incident } from "../../services/incidentService";

interface IncidentStatusBannerProps {
  clientId?: string;
}

const IncidentStatusBanner: React.FC<IncidentStatusBannerProps> = ({ clientId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await incidentService.getPortalIncidents(clientId);
        setIncidents(data);
      } catch (err) {
        console.error("Failed to fetch portal incidents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchIncidents, 120000);
    return () => clearInterval(interval);
  }, [clientId]);

  const visibleIncidents = incidents.filter((inc) => !dismissedIds.has(inc._id));

  if (loading || visibleIncidents.length === 0) return null;

  const activeIncidents = visibleIncidents.filter((i) => i.status === "active");
  const baseIncidents = activeIncidents.length > 0 ? activeIncidents : visibleIncidents;

  const highestSeverity = baseIncidents.some((i) => i.severity === "high")
    ? "high"
    : baseIncidents.some((i) => i.severity === "medium")
    ? "medium"
    : "low";

  const activeCount = visibleIncidents.filter((i) => i.status === "active").length;
  const resolvedCount = visibleIncidents.filter((i) => i.status === "resolved").length;

  const bannerConfig = {
    high: {
      bg: "bg-gradient-to-r from-red-600 to-red-500",
      border: "border-red-400/30",
      textColor: "text-white",
      subTextColor: "text-white/70",
      badgeBg: "bg-white/20",
      iconColor: "text-white",
      icon: AlertTriangle,
      pulse: "animate-pulse",
      text: "Service Disruption Alert",
    },
    medium: {
      bg: "bg-gradient-to-r from-amber-400 to-amber-300",
      border: "border-amber-500/20",
      textColor: "text-amber-950",
      subTextColor: "text-amber-900/70",
      badgeBg: "bg-amber-950/10",
      iconColor: "text-amber-900",
      icon: Activity,
      pulse: "animate-pulse",
      text: "Service Advisory",
    },
    low: {
      bg: "bg-gradient-to-r from-blue-600 to-blue-500",
      border: "border-blue-400/30",
      textColor: "text-white",
      subTextColor: "text-white/70",
      badgeBg: "bg-white/20",
      iconColor: "text-white",
      icon: Activity,
      pulse: "",
      text: "Service Notice",
    },
  };

  const config = bannerConfig[highestSeverity];
  const Icon = config.icon;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
      {/* Main Banner */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden shadow-lg border",
          config.bg,
          config.border
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.badgeBg, config.pulse)}>
              <Icon className={cn("w-4 h-4", config.iconColor)} />
            </div>
            <div>
              <h3 className={cn("text-sm font-black uppercase tracking-wider", config.textColor)}>
                {config.text}
              </h3>
              <p className={cn("text-[11px] font-medium", config.subTextColor)}>
                {activeCount > 0 && `${activeCount} active`}
                {activeCount > 0 && resolvedCount > 0 && " · "}
                {resolvedCount > 0 && `${resolvedCount} recently resolved`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                config.badgeBg,
                "hover:brightness-90",
                config.textColor
              )}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick summary (always visible) */}
        {!expanded && visibleIncidents.length > 0 && (
          <div className="px-5 pb-4">
            <p className={cn("text-sm font-medium", config.textColor, "opacity-90")}>
              {visibleIncidents[0].title}
              {visibleIncidents.length > 1 && (
                <span className={cn("ml-2 blur-[0.5px]", config.subTextColor)}>
                  +{visibleIncidents.length - 1} more
                </span>
              )}
            </p>
          </div>
        )}

        {/* Expanded list */}
        {expanded && (
          <div className="px-5 pb-4 space-y-3">
            {visibleIncidents.map((incident) => {
              const isResolved = incident.status === "resolved";
              return (
                <div
                  key={incident._id}
                  className={cn(
                    "bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 transition-all",
                    isResolved && "opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {isResolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-white" />
                        )}
                        <h4 className={cn("text-sm font-bold text-white", isResolved && "line-through opacity-80")}>
                          {incident.title}
                        </h4>
                        <span
                          className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                            isResolved
                              ? "bg-emerald-400/20 text-emerald-200"
                              : incident.severity === "high"
                              ? "bg-red-400/30 text-red-100"
                              : "bg-amber-400/30 text-amber-100"
                          )}
                        >
                          {isResolved ? "Resolved" : incident.severity === "high" ? "Critical" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed mb-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-white/50 font-medium">
                        <span className="flex items-center gap-1 capitalize">
                          {incident.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(incident.createdAt)}
                        </span>
                        {incident.resolutionNote && (
                          <span className="text-emerald-300/80">
                            Note: {incident.resolutionNote}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDismissedIds((prev) => new Set([...prev, incident._id]))}
                      className="p-1 rounded hover:bg-white/10 transition-colors text-white/40 hover:text-white/70 shrink-0"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentStatusBanner;
