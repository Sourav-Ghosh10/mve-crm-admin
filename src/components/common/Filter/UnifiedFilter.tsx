import React from "react"
import { Filter } from "lucide-react"
import { cn } from "../../../lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "../../ui/dropdown-menu"
import { Button } from "../../ui/button"

interface FilterOption {
    value: string;
    label: string;
}

interface FilterGroup {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
}

interface UnifiedFilterProps {
    filters: FilterGroup[];
    className?: string;
    disabled?: boolean;
}

const UnifiedFilter: React.FC<UnifiedFilterProps> = ({
    filters,
    className,
    disabled = false,
}) => {
    const activeFiltersCount = filters.filter(f => f.value !== "all").length;

    const handleClearAll = () => {
        filters.forEach(f => f.onChange("all"));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "h-10 px-4 rounded-xl border-2 font-bold text-sm flex items-center gap-2 transition-all duration-200",
                        activeFiltersCount > 0
                            ? "border-primary text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/80 hover:text-primary"
                            : "border-border/50 text-foreground-secondary hover:bg-muted/60 hover:text-foreground",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                >
                    <Filter className={cn("w-4 h-4", activeFiltersCount > 0 ? "text-primary" : "text-foreground-tertiary")} />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary text-white text-[10px] font-black leading-none">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>
                    Refine Results
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {filters.map((group) => (
                    <DropdownMenuSub key={group.id}>
                        <DropdownMenuSubTrigger>
                            <span className="flex-1 text-xs font-bold uppercase tracking-wider">{group.label}</span>
                            <span className="text-[10px] font-bold text-primary ml-2 truncate max-w-[80px]">
                                {group.options.find(o => o.value === group.value)?.label || "All"}
                            </span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48 max-h-80 overflow-y-auto">
                            <DropdownMenuRadioGroup value={group.value} onValueChange={group.onChange}>
                                {group.options.map((opt) => (
                                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                ))}

                {activeFiltersCount > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleClearAll}
                            className="text-error focus:text-error bg-error/5 focus:bg-error/10 font-bold text-xs justify-center py-2 cursor-pointer mt-1 mx-1 rounded-lg"
                        >
                            Clear All Filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UnifiedFilter
