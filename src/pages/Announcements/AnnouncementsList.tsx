import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { announcementService } from "../../services/announcementService";
import type {
    Announcement,
    AnnouncementFilters,
    AnnouncementPriority,
    AnnouncementCategory
} from "../../types/announcement.types";
import Button from "../../components/common/Button";
import { SearchInput } from "../../components/common/Search/SearchInput";
import FilterDropdown from "../../components/common/Filter/FilterDropdown";
import Pagination from "../../components/common/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { useConfirmation } from "../../hooks/useConfirmation";
import { getErrorMessage } from "../../utils/errorHandling";
import UnifiedFilter from "../../components/common/Filter/UnifiedFilter";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import AnnouncementTable from "../../components/Announcements/AnnouncementTable";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const AnnouncementsList: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get filters from URL or defaults
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Filter states
    const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get("priority") || "all");
    const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get("category") || "all");
    const [timelineFilter, setTimelineFilter] = useState<string>(searchParams.get("timeline") || "all");

    // Pagination
    const initialPage = Number(searchParams.get("page")) || 1;
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(20); // Increased limit as we filter on frontend
    const [totalPages, setTotalPages] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const { confirm, ConfirmationDialog } = useConfirmation();

    const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Sync state to URL
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (priorityFilter !== "all") params.priority = priorityFilter;
        if (categoryFilter !== "all") params.category = categoryFilter;
        if (timelineFilter !== "all") params.timeline = timelineFilter;
        if (page > 1) params.page = page.toString();
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearchTerm, priorityFilter, categoryFilter, timelineFilter, page, setSearchParams]);

    // Permissions
    const { hasPermission: canCreate } = usePermissions(PERMISSIONS.ANNOUNCEMENT_CREATE);

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const apiFilters: AnnouncementFilters = {
                page: 1, // Fetch a larger chunk for manual filtering
                limit: 100, // Fetch more to allow effective frontend filtering
                search: debouncedSearchTerm.trim() || undefined,
                priority: priorityFilter !== "all" ? (priorityFilter as AnnouncementPriority) : undefined,
                category: categoryFilter !== "all" ? (categoryFilter as AnnouncementCategory) : undefined,
            };

            const response = await announcementService.getAll(apiFilters);
            setAllAnnouncements(response.data);
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, priorityFilter, categoryFilter]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    // Apply timeline filter and pagination on the client side
    const filteredAnnouncements = React.useMemo(() => {
        const now = new Date();
        let filtered = [...allAnnouncements];

        if (timelineFilter === "upcoming") {
            filtered = filtered.filter(a => a.publishDate && new Date(a.publishDate) > now);
        } else if (timelineFilter === "live") {
            filtered = filtered.filter(a => {
                const startDate = a.publishDate ? new Date(a.publishDate) : null;
                const endDate = (a.expiresAt || a.expiryDate) ? new Date((a.expiresAt || a.expiryDate) as string) : null;
                const isLive = (!startDate || startDate <= now) && (!endDate || endDate >= now);
                return isLive;
            });
        } else if (timelineFilter === "expired") {
            filtered = filtered.filter(a => {
                const endDate = (a.expiresAt || a.expiryDate) ? new Date((a.expiresAt || a.expiryDate) as string) : null;
                return endDate && endDate < now;
            });
        }

        return filtered;
    }, [allAnnouncements, timelineFilter]);

    // Update pagination metadata whenever filtered list changes
    useEffect(() => {
        setTotalResults(filteredAnnouncements.length);
        setTotalPages(Math.ceil(filteredAnnouncements.length / limit));
        setPage(1);
    }, [filteredAnnouncements, limit]);

    const paginatedAnnouncements = React.useMemo(() => {
        const startIndex = (page - 1) * limit;
        return filteredAnnouncements.slice(startIndex, startIndex + limit);
    }, [filteredAnnouncements, page, limit]);

    const handleDelete = async (announcement: Announcement) => {
        const confirmed = await confirm({
            title: "Delete Announcement",
            message: `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger"
        });

        if (confirmed) {
            try {
                await announcementService.delete(announcement.id);
                fetchAnnouncements();
            } catch (error) {
                const errorMessage = getErrorMessage(error, "Failed to delete announcement");
                alert(errorMessage);
            }
        }
    };

    const handleEdit = (announcement: Announcement) => {
        navigate(`/announcements/edit/${announcement.id}`);
    };

    const handleAdd = () => {
        navigate("/announcements/create");
    };

    if (isInitialLoading) {
        return <GlobalLoader fullScreen message="Loading Announcements..." />;
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 px-2 sm:px-0 mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                        Announcements
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold tracking-widest uppercase align-middle border border-primary/20">
                            {totalResults} Total
                        </span>
                    </h1>
                    <p className="text-sm sm:text-base text-foreground-tertiary mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Manage company-wide updates and news.
                    </p>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
                    {canCreate && (
                        <Button
                            onClick={handleAdd}
                            startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                        >
                            Create Announcement
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="announcements"
                        placeholder="Search announcements..."
                    />
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2">
                    <UnifiedFilter
                        filters={[
                            {
                                id: "timeline",
                                label: "Timeline",
                                value: timelineFilter,
                                onChange: setTimelineFilter,
                                options: [
                                    { value: "all", label: "All Timeline" },
                                    { value: "live", label: "LiveNow" },
                                    { value: "upcoming", label: "Upcoming" },
                                    { value: "expired", label: "Expired" },
                                ]
                            },
                            {
                                id: "priority",
                                label: "Priority",
                                value: priorityFilter,
                                onChange: setPriorityFilter,
                                options: [
                                    { value: "all", label: "All Priorities" },
                                    { value: "low", label: "Low" },
                                    { value: "medium", label: "Medium" },
                                    { value: "high", label: "High" },
                                    { value: "critical", label: "Critical" },
                                ]
                            },
                            {
                                id: "category",
                                label: "Category",
                                value: categoryFilter,
                                onChange: setCategoryFilter,
                                options: [
                                    { value: "all", label: "All Categories" },
                                    { value: "general", label: "General" },
                                    { value: "policy", label: "Policy" },
                                    { value: "event", label: "Event" },
                                    { value: "holiday", label: "Holiday" },
                                    { value: "other", label: "Other" },
                                ]
                            }
                        ]}
                    />
                </div>
            </div>

            <AnnouncementTable
                announcements={paginatedAnnouncements}
                isLoading={loading}
                searchTerm={debouncedSearchTerm}
                priorityFilter={priorityFilter}
                categoryFilter={categoryFilter}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4">
                <div className="flex items-center gap-3">
                    <p className="text-xs sm:text-sm font-bold text-foreground-tertiary uppercase tracking-widest bg-muted/50 px-3 sm:px-4 py-2 rounded-2xl border border-border/30">
                        Page <span className="text-primary">{page}</span> of {totalPages || 1} (Total: {totalResults})
                    </p>
                    <div className="relative group">
                        <FilterDropdown
                            value={limit.toString()}
                            options={[5, 10, 20, 50].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
                            onChange={(v) => {
                                setLimit(Number(v));
                                setPage(1);
                            }}
                            className="h-9 px-3 rounded-xl border-border/50 text-xs font-bold text-foreground-tertiary"
                            align="start"
                        />
                    </div>
                </div>

                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>
            {ConfirmationDialog}
        </div>
    );
};

export default AnnouncementsList;

