import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import payrollService, {
  type SalaryRevision,
  type AllowanceDeductionMaster,
} from "../../../services/payrollService";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { getErrorMessage } from "../../../utils/errorHandling";

interface SalaryRevisionHistoryProps {
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  onSwitchToConfig?: () => void;
}

const SalaryRevisionHistory: React.FC<SalaryRevisionHistoryProps> = ({
  employeeId,
  employeeName,
  employeeCode,
  onSwitchToConfig,
}) => {
  const [revisions, setRevisions] = useState<SalaryRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "SCHEDULED" | "CURRENT" | "PREVIOUS">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { confirm, ConfirmationDialog } = useConfirmation();

  const fetchRevisions = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await payrollService.getSalaryRevisions(employeeId);
      setRevisions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch salary revisions:", err);
      setError(getErrorMessage(err, "Failed to load salary revision history."));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const handleCancelScheduled = async (revision: SalaryRevision) => {
    const confirmed = await confirm({
      title: "Cancel Scheduled Revision",
      message: `Are you sure you want to cancel the scheduled revision of ₹${revision.revisedCTC.toLocaleString()} effective ${format(
        new Date(revision.effectiveDate),
        "dd MMM yyyy"
      )}? The employee will remain on their current salary.`,
      confirmLabel: "Cancel Revision",
      variant: "danger",
    });

    if (confirmed) {
      try {
        setCancellingId(revision._id);
        await payrollService.cancelSalaryRevision(revision._id);
        await fetchRevisions();
      } catch (err) {
        alert(getErrorMessage(err, "Failed to cancel scheduled revision."));
      } finally {
        setCancellingId(null);
      }
    }
  };

  const currentRevision = useMemo(
    () => revisions.find((r) => r.status === "CURRENT"),
    [revisions]
  );

  const scheduledRevision = useMemo(
    () => revisions.find((r) => r.status === "SCHEDULED"),
    [revisions]
  );

  const filteredRevisions = useMemo(() => {
    if (filter === "ALL") return revisions;
    return revisions.filter((r) => r.status === filter);
  }, [revisions, filter]);

  const counts = useMemo(
    () => ({
      ALL: revisions.length,
      SCHEDULED: revisions.filter((r) => r.status === "SCHEDULED").length,
      CURRENT: revisions.filter((r) => r.status === "CURRENT").length,
      PREVIOUS: revisions.filter((r) => r.status === "PREVIOUS").length,
    }),
    [revisions]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-foreground-tertiary">
          Retrieving Revision Audit Trail...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-error/10 border border-error/20 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-error mx-auto" />
        <p className="text-sm font-bold text-error">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchRevisions}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee & Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Active CTC */}
        <div className="p-5 rounded-3xl bg-surface border border-border/60 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Current Active CTC
            </span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2 tracking-tight">
            ₹{(currentRevision?.revisedCTC || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-medium text-foreground-tertiary mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            {currentRevision?.effectiveDate
              ? `Effective since ${format(new Date(currentRevision.effectiveDate), "dd MMM yyyy")}`
              : "No active revision"}
          </div>
        </div>

        {/* Scheduled Next Revision */}
        <div
          className={cn(
            "p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all",
            scheduledRevision
              ? "bg-primary/5 border-primary/30"
              : "bg-surface border-border/60 opacity-60"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Scheduled Next
            </span>
            {scheduledRevision && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black uppercase">
                Upcoming
              </span>
            )}
          </div>
          {scheduledRevision ? (
            <>
              <div className="text-2xl font-black text-primary mt-2 tracking-tight flex items-center gap-2">
                ₹{scheduledRevision.revisedCTC.toLocaleString()}
                {scheduledRevision.revisedCTC > scheduledRevision.oldCTC && (
                  <span className="text-xs font-black text-success flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    +{Math.round(
                      ((scheduledRevision.revisedCTC - scheduledRevision.oldCTC) /
                        (scheduledRevision.oldCTC || 1)) *
                        100
                    )}
                    %
                  </span>
                )}
              </div>
              <div className="text-[10px] font-bold text-primary/80 mt-1">
                From {format(new Date(scheduledRevision.effectiveDate), "dd MMM yyyy")} (
                {formatDistanceToNow(new Date(scheduledRevision.effectiveDate), { addSuffix: true })})
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-foreground-tertiary mt-2">None Scheduled</div>
              <div className="text-[10px] text-foreground-tertiary mt-1">
                Edit salary to schedule a future hike
              </div>
            </>
          )}
        </div>

        {/* Total Revisions Count */}
        <div className="p-5 rounded-3xl bg-surface border border-border/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Revision History
            </span>
            <span className="text-xs font-black text-foreground bg-muted px-2.5 py-1 rounded-xl">
              {revisions.length} Total
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {onSwitchToConfig && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSwitchToConfig}
                className="text-[10px] font-black uppercase tracking-wider h-8 rounded-xl border border-primary/20 text-primary hover:bg-primary/5 w-full flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Schedule New Revision
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          {(["ALL", "SCHEDULED", "CURRENT", "PREVIOUS"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5",
                filter === tab
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface hover:bg-muted text-foreground-secondary hover:text-foreground border border-border/60"
              )}
            >
              <span>{tab}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                  filter === tab ? "bg-white/20 text-white" : "bg-muted text-foreground-tertiary"
                )}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
        <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider">
          {filteredRevisions.length} Revisions Listed
        </span>
      </div>

      {/* Revisions List / Timeline */}
      {filteredRevisions.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-border/60 bg-surface/30">
          <Clock className="w-8 h-8 text-foreground-tertiary mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-foreground">No {filter.toLowerCase()} revisions found</p>
          <p className="text-xs text-foreground-tertiary mt-1">
            Revisions will automatically accumulate as salaries are configured and revised.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRevisions.map((rev, index) => {
            const isExpanded = expandedId === rev._id;
            const effDate = new Date(rev.effectiveDate);
            const isFutureDate = isFuture(effDate);
            const diffCTC = rev.revisedCTC - rev.oldCTC;
            const diffPct = rev.oldCTC > 0 ? Math.round((diffCTC / rev.oldCTC) * 100) : null;

            return (
              <div
                key={rev._id}
                className={cn(
                  "p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden",
                  rev.status === "CURRENT"
                    ? "bg-success/5 border-success/30 shadow-sm"
                    : rev.status === "SCHEDULED"
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "bg-surface/60 border-border/60 hover:border-border"
                )}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    {rev.status === "CURRENT" && (
                      <span className="px-3 py-1 rounded-full bg-success/20 text-success text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-success/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Current Active
                      </span>
                    )}
                    {rev.status === "SCHEDULED" && (
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-primary/30">
                        <Clock className="w-3 h-3" />
                        Scheduled Hike
                      </span>
                    )}
                    {rev.status === "PREVIOUS" && (
                      <span className="px-3 py-1 rounded-full bg-muted text-foreground-tertiary text-[10px] font-black uppercase tracking-wider border border-border/60">
                        Previous / Superseded
                      </span>
                    )}

                    {/* Effective Date */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-foreground-tertiary" />
                      <span>Effective: {format(effDate, "dd MMMM yyyy")}</span>
                      {isFutureDate && (
                        <span className="text-[10px] text-primary font-bold">
                          ({formatDistanceToNow(effDate, { addSuffix: true })})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason Pill & Cancel Button */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-muted/80 text-foreground text-[10px] font-black uppercase tracking-wider border border-border/50 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-primary" />
                      {rev.revisionReason || "Salary Revision"}
                    </span>

                    {rev.status === "SCHEDULED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelScheduled(rev)}
                        isLoading={cancellingId === rev._id}
                        className="text-[10px] font-bold text-error hover:bg-error/10 h-7 px-2.5 rounded-xl border border-error/20"
                        title="Cancel this scheduled salary revision"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Salary Change Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-center">
                  {/* Transition Block */}
                  <div className="flex items-center gap-4 col-span-2">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">
                        Old CTC
                      </div>
                      <div className="text-lg font-black text-foreground-secondary line-through opacity-75">
                        {rev.oldCTC > 0 ? `₹${rev.oldCTC.toLocaleString()}` : "₹0 (Initial)"}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />

                    <div className="space-y-0.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">
                        Revised CTC
                      </div>
                      <div className="text-xl font-black text-foreground flex items-center gap-2">
                        <span>₹{rev.revisedCTC.toLocaleString()}</span>
                        {diffCTC !== 0 && rev.oldCTC > 0 && (
                          <span
                            className={cn(
                              "text-xs font-black px-2 py-0.5 rounded-lg border flex items-center gap-1",
                              diffCTC > 0
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-error/10 text-error border-error/20"
                            )}
                          >
                            {diffCTC > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {diffCTC > 0 ? `+₹${diffCTC.toLocaleString()}` : `-₹${Math.abs(diffCTC).toLocaleString()}`}
                            {diffPct !== null && ` (${diffCTC > 0 ? "+" : ""}${diffPct}%)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Components toggle */}
                  <div className="flex justify-end">
                    {rev.items && rev.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : rev._id)}
                        className="text-[10px] font-black uppercase tracking-wider text-foreground-tertiary hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 bg-muted/40 hover:bg-muted transition-all"
                      >
                        <span>Components ({rev.items.filter((i) => i.isActive).length})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Component Breakdown Accordion */}
                {isExpanded && rev.items && rev.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary mb-2">
                      Component Overrides Breakdown
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {rev.items
                        .filter((i) => i.isActive)
                        .map((item, idx) => {
                          const master = item.masterId as AllowanceDeductionMaster;
                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-surface border border-border/50 flex flex-col"
                            >
                              <div className="text-[11px] font-black text-foreground truncate">
                                {master?.name || master?.code || "Component"}
                              </div>
                              <div className="text-[10px] font-bold text-primary mt-1">
                                {item.overrideValue != null ? `₹${item.overrideValue}` : "Default Rate"}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Footer timestamp */}
                {rev.createdAt && (
                  <div className="text-[9px] font-medium text-foreground-tertiary mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                    <span>
                      Recorded on {format(new Date(rev.createdAt), "dd MMM yyyy, hh:mm a")}
                    </span>
                    {rev.revisedBy && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-2.5 h-2.5" />
                        By: {(rev.revisedBy as any).personalInfo?.firstName || "Admin"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ConfirmationDialog}
    </div>
  );
};

export default SalaryRevisionHistory;
