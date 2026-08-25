import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Edit,
    Building2,
    MapPin,
    Phone,
    Mail,
    Archive,
    RefreshCw,
    Clock,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import { locationService } from "../../../services/locationService";
import type { OfficeLocation, OrganizationFilters, OfficeLocationInput } from "../../../types/organization.types";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import LocationForm from "./LocationForm";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";


const LocationsList: React.FC = () => {
    const [locations, setLocations] = useState<OfficeLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hasData, setHasData] = useState(true); // Track if any data exists
    const [error, setError] = useState<string | string[] | null>(null);

    const { confirm, ConfirmationDialog } = useConfirmation();

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Partial<OfficeLocation> | null>(null);

    const { hasPermission: canManage } = usePermissions(PERMISSIONS.LOCATION_MANAGE);

    const fetchLocations = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const filters: OrganizationFilters = {
                page: currentPage,
                limit,
                search: debouncedSearchTerm.trim() || undefined,
                isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
            };
            const response = await locationService.getAll(filters);
            setLocations(response.data);
            setTotalPages(response.totalPages);

            // Only disable search if there's no data AND no active filters/search
            const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all";
            if (!hasActiveFilters && response.total === 0) {
                setHasData(false);
            } else if (response.total > 0) {
                setHasData(true);
            }
        } catch (error) {
            console.error("Failed to fetch locations:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, limit]);

    useEffect(() => {
        fetchLocations(1);
        setPage(1);
    }, [fetchLocations]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchLocations(newPage);
    };

    const handleToggleStatus = async (location: OfficeLocation) => {
        const action = location.isActive ? "deactivate" : "activate";
        const confirmed = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Location`,
            message: `Are you sure you want to ${action} "${location.name}"? ${location.isActive ? "This will archive the location." : ""}`,
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant: location.isActive ? 'danger' : 'info'
        });

        if (confirmed) {
            try {
                await locationService.toggleStatus(location._id, !location.isActive);
                fetchLocations(page);
            } catch (error) {
                console.error(`Failed to ${action} location: `, error);

                const errorMessage = getErrorMessage(error, `Failed to ${action} location`);
                alert(errorMessage);
            }
        }
    };

    const handleEdit = (location: OfficeLocation) => {
        setCurrentLocation(location);
        setError(null);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentLocation({
            address: {
                country: "India",
                street: "",
                city: "",
                state: "",
                zipCode: ""
            },
            isActive: true,
            isHeadquarters: false,
            timezone: "Asia/Kolkata"
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: OfficeLocationInput) => {
        try {
            setFormLoading(true);
            setError(null);
            if (currentLocation?._id) {
                await locationService.update(currentLocation._id, data);
            } else {
                await locationService.create(data);
            }
            setIsModalOpen(false);
            fetchLocations(page);
        } catch (error) {
            console.error("Failed to save location:", error);

            const errorMessage = getErrorMessage(error, "Failed to save hub configuration.");
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        {
            _id: "name",
            label: "Location Details",
            format: (_: unknown, row: OfficeLocation) => (
                <div className="flex items-center gap-4 py-1">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm",
                        row.isHeadquarters
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 shadow-amber-500/5"
                            : "bg-primary/5 border-primary/10 text-primary"
                    )}>
                        <Building2 className={cn("w-6 h-6", row.isHeadquarters && "animate-pulse")} />
                    </div>
                    <div>
                        <div className="font-black text-foreground text-base tracking-tight flex items-center gap-2">
                            {row.name}
                            {row.isHeadquarters && (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-[8px] font-black text-white uppercase tracking-widest">HQ</span>
                            )}
                        </div>
                        <div className="text-xs font-bold text-foreground-tertiary flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {row.address.city}, {row.address.state}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            _id: "contact",
            label: "Contact Gateway",
            format: (_: unknown, row: OfficeLocation) => (
                <div className="space-y-1">
                    {row.contactInfo.phone && (
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground-secondary">
                            <Phone className="w-3 h-3 text-primary" />
                            {row.contactInfo.phone}
                        </div>
                    )}
                    {row.contactInfo.email && (
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground-tertiary">
                            <Mail className="w-3 h-3" />
                            {row.contactInfo.email}
                        </div>
                    )}
                </div>
            )
        },
        {
            _id: "address",
            label: "Postal Node",
            format: (_: unknown, row: OfficeLocation) => (
                <div className="text-xs font-bold text-foreground-secondary leading-relaxed">
                    <div className="flex items-center justify-between">
                        <span>{row.address.street}, {row.address.zipCode}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-foreground-tertiary uppercase text-[10px] tracking-widest">{row.address.country}</span>
                        <span className="flex items-center gap-1 text-[10px] font-black text-primary/80 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                            <Clock className="w-2.5 h-2.5" />
                            {row.timezone}
                        </span>
                    </div>
                </div>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: OfficeLocation) => (
                <span className={cn(
                    "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
                    row.isActive
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-foreground-tertiary border-border"
                )}>
                    {row.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            _id: "actions",
            label: "Actions",
            align: "right" as const,
            format: (_: unknown, row: OfficeLocation) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                        title="Edit Location"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleToggleStatus(row)}
                        className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                            row.isActive ? "hover:bg-warning/10 hover:text-warning" : "hover:bg-success/10 hover:text-success",
                            "text-foreground-secondary"
                        )}
                        title={row.isActive ? "Deactivate" : "Activate"}
                    >
                        {row.isActive ? <Archive className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
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
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Accessing Hub Network...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Locations</h1>
                    <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Manage your global office infrastructure.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleAdd}
                        startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    >
                        Add Location
                    </Button>
                )}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="locations"
                        placeholder="Search locations..."
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

            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-black/[0.03] overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Hub Registry...</p>
                    </div>
                )}
                <Table
                    columns={displayColumns}
                    rows={locations}
                    className="border-none"
                    emptyState={
                        <EmptyState
                            title="No Locations Found"
                            description={searchTerm ? `No locations matching "${searchTerm}" found.` : "Add your first office location to populate the list."}
                            className="py-24"
                        />
                    }
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-3">
                    <p className="text-xs sm:text-sm font-bold text-foreground-tertiary uppercase tracking-widest bg-muted/50 px-3 sm:px-4 py-2 rounded-2xl border border-border/30">
                        Page <span className="text-primary">{page}</span> of {totalPages || 1}
                    </p>
                    <div className="relative group">
                        <FilterDropdown
                            value={limit.toString()}
                            options={[10, 20, 50].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
                            onChange={(v) => setLimit(Number(v))}
                            className="
                            h-9 px-3 rounded-xl border-border/50
                            text-xs font-bold text-foreground-tertiary
                            pr-8
                            hover:text-foreground-tertiary
                            focus:text-foreground-tertiary
                            data-[state=open]:text-foreground-tertiary
                            "
                            align="end"
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

            {isModalOpen && (
                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={currentLocation?._id ? "Edit Location" : "Add Location"}
                    maxWidth="lg"
                >
                    <LocationForm
                        initialValues={currentLocation || {}}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={formLoading}
                        error={error}
                    />
                </Modal>
            )}
            {ConfirmationDialog}
        </div>
    );
};

export default LocationsList;
