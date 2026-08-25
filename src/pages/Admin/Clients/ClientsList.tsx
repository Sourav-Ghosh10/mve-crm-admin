import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Edit,
    CheckCircle2,
    XCircle,
    Trash2,
    Users as UsersIcon,
    Globe,
    Mail,
    Phone,
    HelpCircle
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import { clientService } from "../../../services/clientService";
import type { Client, ClientFilters } from "../../../types/client.types";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";

import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";
import { SearchInput } from "../../../components/common/Search/SearchInput";

const ClientsList: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hasData, setHasData] = useState(true);

    const navigate = useNavigate();
    const { confirm, ConfirmationDialog } = useConfirmation();
    const { hasPermission: canManage } = usePermissions(PERMISSIONS.CLIENT_MANAGE);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const fetchData = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));

            const params: ClientFilters = {
                page: currentPage,
                limit: limit,
            };

            if (debouncedSearchTerm.trim()) {
                params.search = debouncedSearchTerm.trim();
            }

            if (statusFilter !== "all") {
                params.is_active = statusFilter === "active";
            }

            const response = await clientService.getAll(params);

            setClients(response.clients);
            setTotalPages(response.totalPages);

            if (response.total === 0 && !debouncedSearchTerm.trim() && statusFilter === "all") {
                setHasData(false);
            } else {
                setHasData(true);
            }
        } catch (error) {
            console.error("Failed to fetch clients:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, limit]);

    useEffect(() => {
        fetchData(1);
        setPage(1);
    }, [fetchData]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData(newPage);
    };

    const handleToggleStatus = async (client: Client) => {
        const action = client.is_active ? "deactivate" : "activate";
        const confirmed = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Client`,
            message: `Are you sure you want to ${action} "${client.name}"?`,
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant: client.is_active ? 'danger' : 'info'
        });

        if (confirmed) {
            try {
                await clientService.update({ id: client.id, is_active: !client.is_active });
                fetchData(page);
            } catch (error) {
                alert(getErrorMessage(error, `Failed to ${action} client`));
            }
        }
    };

    const handleDelete = async (client: Client) => {
        const confirmed = await confirm({
            title: 'Delete Client',
            message: `Are you sure you want to PERMANENTLY delete "${client.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger'
        });

        if (confirmed) {
            try {
                await clientService.delete(client.id);
                fetchData(page);
            } catch (error) {
                alert(getErrorMessage(error, "Failed to delete client"));
            }
        }
    };

    const handleEdit = (client: Client) => {
        navigate(`edit/${client.id}`);
    };

    const handleAdd = () => {
        navigate('create');
    };

    const { isSuperAdmin } = usePermissions();

    const columns = [
        {
            _id: "name",
            label: "Client Details",
            format: (_: unknown, row: Client) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <UsersIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-foreground uppercase tracking-tight">
                            {row.name}
                        </span>
                        <span className="text-[10px] font-bold text-foreground-tertiary uppercase flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {row.city} • {row.timezone}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            _id: "contact",
            label: "Primary Contact",
            format: (_: unknown, row: Client) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-foreground">
                        {row.primary_contact.name}
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-foreground-secondary flex items-center gap-1 lowercase">
                            <Mail className="w-3 h-3" /> {row.primary_contact.email}
                        </span>
                        <span className="text-[10px] text-foreground-secondary flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {row.primary_contact.phone}
                        </span>
                    </div>
                </div>
            )
        },
        {
            _id: "billing",
            label: "Billing Rate",
            format: (_: unknown, row: Client) => (
                <div className="flex flex-col">
                    <span className={cn(
                        "font-bold text-xs uppercase tracking-wider",
                        isSuperAdmin ? "text-foreground" : "text-foreground-tertiary italic"
                    )}>
                        {isSuperAdmin
                            ? `${row.currency === 'GBP' ? '£' : '$'}${row.billing_rate?.toLocaleString()}`
                            : "Restricted"
                        }
                    </span>
                    {isSuperAdmin && (
                        <span className="text-[10px] text-foreground-tertiary">
                            per effective hour
                        </span>
                    )}
                </div>
            )
        },
        {
            _id: "delivery",
            label: "Delivery Channel",
            format: (_: unknown, row: Client) => (
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                        row.communication_preference === 'both' ? "bg-primary/10 border-primary/20 text-primary" :
                            row.communication_preference === 'whatsapp' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                "bg-blue-50 border-blue-200 text-blue-600"
                    )}>
                        {row.communication_preference || 'email'}
                    </span>
                </div>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: Client) => (
                <span className={cn(
                    "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
                    row.is_active
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-foreground-tertiary border-border"
                )}>
                    {row.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: Client) => (
                <div className="flex items-center justify-end gap-2">
                    {canManage && (
                        <>
                            <button
                                onClick={() => handleEdit(row)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                                title="Edit Client"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleToggleStatus(row)}
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                    row.is_active ? "hover:bg-warning/10 hover:text-warning" : "hover:bg-success/10 hover:text-success",
                                    "text-foreground-secondary"
                                )}
                                title={row.is_active ? "Deactivate" : "Activate"}
                            >
                                {row.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handleDelete(row)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-error/10 hover:text-error text-foreground-secondary transition-all"
                                title="Delete Client"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    const displayColumns = canManage ? columns : columns.filter(col => col._id !== 'actions');

    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Accessing Client Registry...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 mx-auto px-4 sm:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Client Management</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Manage active clients and billing configurations.
                    </p>
                </div>
                {canManage && (
                    <div className="flex items-center gap-3">
                        <a 
                            href="mailto:support@codecit.com?subject=Client Management Support"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground-tertiary hover:text-primary transition-all border border-border font-black text-[10px] uppercase tracking-widest"
                        >
                            <HelpCircle className="w-4 h-4" />
                            Help & Support
                        </a>
                        <Button
                            onClick={handleAdd}
                            startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                        >
                            Onboard Client
                        </Button>
                    </div>
                )}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={(val) => {
                            setSearchTerm(val);
                            setLoading(true);
                        }}
                        searchKey="clients"
                        placeholder="Search by name, contact or city..."
                        disabled={!hasData}
                    />
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                    <FilterDropdown
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full lg:w-[200px]"
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "active", label: "Active Only" },
                            { value: "inactive", label: "Inactive Only" },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-primary/5 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Database...</p>
                    </div>
                )}
                <Table
                    columns={displayColumns}
                    rows={clients}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Clients Found"
                            description={searchTerm ? `No clients matching "${searchTerm}" found.` : "Onboard your first client to populate the registry."}
                            className="py-24"
                        />
                    }
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                        Page <span className="text-primary">{page}</span> of {totalPages || 1}
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

            {ConfirmationDialog}
        </div>
    );
};

export default ClientsList;
