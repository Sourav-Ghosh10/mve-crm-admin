import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  Send,
  Shield,
  Users,
  Wrench,
  Wifi,
  HardDrive,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Bell,
  Activity,
  Globe,
  RefreshCw,
  // Search,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import Pagination from "../../../components/common/Pagination";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import { incidentService } from "../../../services/incidentService";
import { clientService } from "../../../services/clientService";
import type { Incident, CreateIncidentRequest, IncidentFilters } from "../../../services/incidentService";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import UnifiedFilter from "../../../components/common/Filter/UnifiedFilter";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import type { Client } from "../../../types/client.types";
import FormSelect from "../../../components/common/Select/FormSelect" ;

// ─── Constants ───
const CATEGORIES = [
  { value: "staffing", label: "Staffing", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "technical", label: "Technical", icon: Wifi, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "infrastructure", label: "Infrastructure", icon: HardDrive, color: "text-rose-500", bg: "bg-rose-500/10" },
];

const SEVERITIES = [
  { value: "low", label: "Low", color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" },
  { value: "medium", label: "Medium", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" },
  { value: "high", label: "High / Critical", color: "text-red-600", bg: "bg-red-100", border: "border-red-200" },
];

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { hasPermission: canManage } = usePermissions(PERMISSIONS.INCIDENT_MANAGE);
  const { confirm, ConfirmationDialog } = useConfirmation();

  // Form state
  const [form, setForm] = useState<CreateIncidentRequest>({
    title: "",
    description: "",
    category: "technical",
    severity: "medium",
    clientId: null,
    isGlobal: true,
    publishedToPortal: false,
    sendAlertNow: false,
    resolutionNote: "",
  });

  const fetchData = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      const params: IncidentFilters = {
        page: currentPage,
        limit: limit,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      const response = await incidentService.getAll(params);
      setIncidents(response.incidents);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || response.incidents.length);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, categoryFilter, limit]);

  useEffect(() => {
    fetchData(1);
    setPage(1);
  }, [fetchData]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchData(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const fetchClients = useCallback(async () => {
    try {
      const response = await clientService.getAll({ limit: 100 });
      setClients(response.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!form.title.trim() || !form.description.trim()) {
      return;
    }

    if (!form.isGlobal && !form.clientId) {
      return;
    }

    try {
      setSubmitting(true);
      await incidentService.create(form);
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        category: "technical",
        severity: "medium",
        clientId: null,
        isGlobal: true,
        publishedToPortal: false,
        sendAlertNow: false,
        resolutionNote: "",
      });
      setShowErrors(false);
      fetchData(1);
      setPage(1);
    } catch (err) {
      console.error("Failed to create incident:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveId || !resolutionNote.trim()) return;
    try {
      setResolving(true);
      await incidentService.resolve(resolveId, resolutionNote);
      setResolveId(null);
      setResolutionNote("");
      fetchData(page);
    } catch (err) {
      console.error("Failed to resolve incident:", err);
    } finally {
      setResolving(false);
    }
  };

  const handleTogglePublish = async (incident: Incident) => {
    try {
      await incidentService.update(incident._id, {
        publishedToPortal: !incident.publishedToPortal,
      });
      fetchData(page);
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  const handleSendAlert = async (id: string) => {
    try {
      await incidentService.sendAlert(id);
      fetchData(page);
    } catch (err) {
      console.error("Failed to send alert:", err);
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    const isConfirmed = await confirm({
      title: "Delete Incident",
      message: `Are you sure you want to permanently delete "${title || 'this incident'}"? Subscribed clients will no longer see this update.`,
      confirmLabel: "Delete Incident",
      variant: "danger",
    });

    if (!isConfirmed) return;

    try {
      await incidentService.delete(id);
      fetchData(page);
    } catch (err) {
      console.error("Failed to delete incident:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCategoryConfig = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat) || CATEGORIES[1];

  const getSeverityConfig = (sev: string) =>
    SEVERITIES.find((s) => s.value === sev) || SEVERITIES[1];

  const columns = [
    {
      _id: "details",
      label: "Incident Details",
      format: (_: unknown, row: Incident) => {
        const catConfig = getCategoryConfig(row.category);
        const CatIcon = catConfig.icon;
        const sevConfig = getSeverityConfig(row.severity);
        return (
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catConfig.bg)}>
              <CatIcon className={cn("w-5 h-5", catConfig.color)} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className={cn("font-black text-foreground uppercase tracking-tight truncate max-w-[200px]", row.status === "resolved" && "line-through opacity-70")}>
                {row.title}
              </span>
              <div className="flex items-center gap-2">
                <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border", sevConfig.bg, sevConfig.color, sevConfig.border)}>
                  {sevConfig.label}
                </span>
                <span className="text-[10px] font-bold text-foreground-tertiary uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatTime(row.createdAt)}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
        _id: "description",
        label: "Impact",
        format: (_: unknown, row: Incident) => (
            <div className="max-w-[250px]">
                <p className="text-xs text-foreground-secondary line-clamp-2 leading-relaxed">
                    {row.description}
                </p>
                {row.resolutionNote && (
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block italic">
                        Resolution: {row.resolutionNote}
                    </span>
                )}
            </div>
        )
    },
    {
      _id: "association",
      label: "Affected Target",
      format: (_: unknown, row: Incident) => {
        const clientName = typeof row.clientId === "object" && row.clientId ? row.clientId.name : "Specific Client";
        return (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              {row.isGlobal ? (
                <>
                  <Globe className="w-3 h-3 text-primary" /> Global
                </>
              ) : (
                <>
                  <Users className="w-3 h-3 text-foreground-tertiary" /> {clientName}
                </>
              )}
            </span>
            <span className="text-[10px] text-foreground-tertiary uppercase font-medium">
              {row.isGlobal ? "All client portals" : "Single client portal"}
            </span>
          </div>
        );
      },
    },
    {
      _id: "status",
      label: "Status",
      format: (_: unknown, row: Incident) => (
        <span className={cn(
          "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
          row.status === "active"
            ? "bg-amber-100 text-amber-600 border-amber-200 shadow-sm"
            : "bg-success/10 text-success border-success/20"
        )}>
          {row.status}
        </span>
      ),
    },
    {
      _id: "visibility",
      label: "Visibility",
      format: (_: unknown, row: Incident) => (
        <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg border", row.publishedToPortal ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-foreground-tertiary")} title={row.publishedToPortal ? "Published" : "Hidden"}>
                {row.publishedToPortal ? <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Published</span> : <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" />Hidden</span>}
            </div>
            {row.alertSent && (
                <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-500" title="Alert Sent">
                    <Bell className="w-3.5 h-3.5" />
                </div>
            )}
        </div>
      )
    },
    {
      _id: "actions",
      label: "Actions",
      align: "right" as const,
      format: (_: unknown, row: Incident) => (
        <div className="flex items-center justify-end gap-2">
          {canManage && (
            <>
                {row.status !== "resolved" && (
                    <>
                        <button
                            onClick={() => handleTogglePublish(row)}
                            className={cn(
                                "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                row.publishedToPortal ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-muted text-foreground-secondary"
                            )}
                            title={row.publishedToPortal ? "Unpublish from portal" : "Publish to portal"}
                        >
                            {row.publishedToPortal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        {!row.alertSent && (
                            <button
                                onClick={() => handleSendAlert(row._id)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 hover:text-blue-500 text-foreground-secondary transition-all"
                                title="Send alert email"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setResolveId(row._id);
                                setResolutionNote(row.resolutionNote || "");
                            }}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50 hover:text-emerald-500 text-foreground-secondary transition-all"
                            title="Mark as resolved"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                    </>
                )}
                <button
                    onClick={() => handleDelete(row._id, row.title)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-error/10 hover:text-error text-foreground-secondary transition-all"
                    title="Delete incident"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Accessing Incident Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Incident Log</h1>
          <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Operational disruptions and service status history.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowForm(true)}
            startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
            // className="bg-red-600 hover:bg-red-700"
          >
            Log Incident
          </Button>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm group hover:border-primary/30 transition-all">
              <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block mb-1">Active Issues</span>
              <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-amber-500 leading-none">
                    {incidents.filter(i => i.status === "active").length}
                  </span>
                  <Activity className="w-5 h-5 text-amber-500/30 group-hover:scale-110 transition-transform" />
              </div>
          </div>
          <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm group hover:border-primary/30 transition-all">
              <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block mb-1">Critical Priority</span>
              <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-red-500 leading-none">
                    {incidents.filter(i => i.severity === "high" && i.status === "active" ).length}
                  </span>
                  <Shield className="w-5 h-5 text-red-500/30 group-hover:scale-110 transition-transform" />
              </div>
          </div>
          <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm group hover:border-primary/30 transition-all">
              <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block mb-1">Resolved (Rec.)</span>
              <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-emerald-500 leading-none">
                    {incidents.filter(i => i.status === "resolved").length}
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/30 group-hover:scale-110 transition-transform" />
              </div>
          </div>
          <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm group hover:border-primary/30 transition-all">
              <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block mb-1">Total Logs</span>
              <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-foreground leading-none">{incidents.length}</span>
                  <Clock className="w-5 h-5 text-foreground-tertiary/30 group-hover:scale-110 transition-transform" />
              </div>
          </div>
      </div>

      {/* Control Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            searchKey="incidents"
            placeholder="Search incidents by title or details..."
          />
        </div>

        <div className="shrink-0 flex items-center justify-end gap-3">
          <UnifiedFilter
            filters={[
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "resolved", label: "Resolved" },
                ]
              },
              {
                id: "category",
                label: "Category",
                value: categoryFilter,
                onChange: setCategoryFilter,
                options: [
                  { value: "all", label: "All Categories" },
                  ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))
                ]
              }
            ]}
          />
          <button
            onClick={() => fetchData(page)}
            className="p-2.5 border border-border/50 rounded-2xl hover:bg-muted/50 transition-colors text-foreground-tertiary shrink-0"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-black/[0.03] overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Syncing Services...</p>
          </div>
        )}
        <Table
          columns={columns}
          rows={incidents}
          className="border-none"
          emptyState={
            <EmptyState
              title="No Incidents Found"
              description={searchTerm ? `No incidents matching "${searchTerm}" found.` : "All operational systems are stable."}
              className="py-24"
            />
          }
        />
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4 pb-8">
        <div className="flex items-center gap-3">
          <p className="text-xs sm:text-sm font-bold text-foreground-tertiary uppercase tracking-widest bg-muted/50 px-3 sm:px-4 py-2 rounded-2xl border border-border/30">
            Page <span className="text-primary">{page}</span> of {totalPages || 1} (Total: {total})
          </p>
          <div className="relative group">
            <FilterDropdown
              value={limit.toString()}
              options={[10, 20, 50, 100].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
              onChange={(v) => handleLimitChange(Number(v))}
              className="
                h-9 px-3 rounded-xl border-border/50
                text-xs font-bold text-foreground-tertiary
                pr-8
                hover:text-foreground-tertiary
                focus:text-foreground-tertiary
                data-[state=open]:text-foreground-tertiary
              "
              align="start"
            />
          </div>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* ─── Create Incident Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl w-full max-w-4xl max-h-[75vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="sticky top-0 bg-surface border-b border-border/50 p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Log System Incident
                  </h2>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Record operational disruptions for client awareness
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-foreground-tertiary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-foreground-tertiary">
                      Incident Title <span className="text-red-500">*</span>
                    </label>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      form.title.length > 90 ? "text-red-500" : "text-foreground-tertiary/60"
                    )}>
                      {form.title.length} / 100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 100) })}
                    placeholder="e.g., ISP fiber cut, Support line downtime"
                    className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-foreground-tertiary">
                      Full Description <span className="text-red-500">*</span>
                    </label>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      form.description.length > 900 ? "text-red-500" : "text-foreground-tertiary/60"
                    )}>
                      {form.description.length} / 1000
                    </span>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 1000) })}
                    placeholder="Provide technical details and current mitigation steps..."
                    rows={4}
                    className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
                    required
                  />
                </div>

                {/* Category & Severity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-foreground-tertiary mb-3">
                      Incident Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setForm({ ...form, category: cat.value })}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wide transition-all",
                              form.category === cat.value
                                ? `${cat.bg} ${cat.color} border-current shadow-sm`
                                : "border-border text-foreground-tertiary hover:bg-muted/50"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-foreground-tertiary mb-3">
                      Severity Level
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {SEVERITIES.map((sev) => (
                        <button
                          key={sev.value}
                          type="button"
                          onClick={() => setForm({ ...form, severity: sev.value })}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all text-left",
                            form.severity === sev.value
                              ? `${sev.bg} ${sev.color} ${sev.border} shadow-sm`
                              : "border-border text-foreground-tertiary hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              sev.value === "low" && "bg-emerald-500",
                              sev.value === "medium" && "bg-amber-500",
                              sev.value === "high" && "bg-red-500"
                            )}
                          />
                          {sev.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Client Association */}
                <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                  <label className="block text-xs font-black uppercase tracking-widest text-foreground-tertiary mb-3">
                    Affected Clients
                  </label>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isGlobal: true, clientId: null })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        form.isGlobal
                          ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                          : "border-border text-foreground-tertiary hover:bg-muted/50"
                      )}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Global
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isGlobal: false })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        !form.isGlobal
                          ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                          : "border-border text-foreground-tertiary hover:bg-muted/50"
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Specific
                    </button>
                  </div>

                  {!form.isGlobal && (
                    <FormSelect
                      label="Choose Affected Client"
                      value={form.clientId || ""}
                      onChange={(val) => setForm({ ...form, clientId: val || null })}
                      options={clients.map(c => ({ value: c.id, label: c.name }))}
                      placeholder="Search and select a client..."
                      className="mb-0"
                      required={!form.isGlobal}
                      error={showErrors && !form.isGlobal && !form.clientId}
                      helperText={showErrors && !form.isGlobal && !form.clientId ? "Please select at least one client" : undefined}
                    />
                  )}
                </div>

                {/* Toggles */}
                <div className="bg-surface rounded-2xl border border-border/50 divide-y divide-border/50">
                  <label className="flex items-center justify-between p-4 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground block">
                          Publish to Client Portal
                        </span>
                        <span className="text-[10px] text-foreground-tertiary font-medium">
                          Make this visible to clients on their dashboard status banner
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors",
                        form.publishedToPortal ? "bg-primary" : "bg-border"
                      )}
                      onClick={() => setForm({ ...form, publishedToPortal: !form.publishedToPortal })}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          form.publishedToPortal && "translate-x-5"
                        )}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground block">
                          Send Automated Alert
                        </span>
                        <span className="text-[10px] text-foreground-tertiary font-medium">
                          Email primary client contacts about this operational disruption
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors",
                        form.sendAlertNow ? "bg-blue-500" : "bg-border"
                      )}
                      onClick={() => setForm({ ...form, sendAlertNow: !form.sendAlertNow })}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          form.sendAlertNow && "translate-x-5"
                        )}
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-surface border-t border-border/50 p-6 flex items-center justify-between z-10">
                <Button variant="ghost" onClick={() => setShowForm(false)} type="button" className="text-xs font-black uppercase tracking-widest">
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !form.title.trim() || !form.description.trim()}
                  className="px-8 font-black text-xs uppercase tracking-widest"
                >
                  {submitting ? "Logging..." : "Log Incident"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Resolve Modal ─── */}
      {resolveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-emerald-500/5 p-6 border-b border-emerald-500/10 shrink-0">
              <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                Market as Resolved
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-foreground-tertiary">
                    Resolution Summary <span className="text-red-500">*</span>
                  </label>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    resolutionNote.length > 900 ? "text-red-500" : "text-foreground-tertiary/60"
                  )}>
                    {resolutionNote.length} / 1000
                  </span>
                </div>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value.slice(0, 1000))}
                  placeholder="Explain the fix or root cause for client transparency..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <Clock className="w-4 h-4 text-foreground-tertiary shrink-0 mt-0.5" />
                <p className="text-[10px] text-foreground-secondary font-medium leading-normal">
                  Note: Once resolved, the incident status will update across all portals. Published incidents will naturally expire from client dashboards after 24 hours.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-surface border-t border-border/50 p-6 flex items-center justify-between z-10 shrink-0">
              <Button variant="ghost" onClick={() => { setResolveId(null); setResolutionNote(""); }} className="text-[10px] font-black tracking-widest uppercase">
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                isLoading={resolving}
                disabled={!resolutionNote.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black tracking-widest uppercase px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resolve Issue
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog Overlay */}
      {ConfirmationDialog}
    </div>
  );
};

export default IncidentManagement;
