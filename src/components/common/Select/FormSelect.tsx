import { forwardRef } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

interface Option {
    value: string;
    label: string;
}

interface FormSelectProps {
    label?: string;
    value?: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    error?: boolean;
    helperText?: string;
    className?: string;
    disabled?: boolean;
    startIcon?: React.ReactNode;
    required?: boolean;
    searchable?: boolean;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    onScrollToBottom?: () => void;
    isLoadingMore?: boolean;
}

const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
    ({
        label,
        value,
        options,
        onChange,
        placeholder = "Select option",
        error,
        helperText,
        className,
        disabled,
        startIcon,
        required,
        searchable = false,
        searchTerm = "",
        onSearchChange,
        onScrollToBottom,
        isLoadingMore = false,
    }, ref) => {
        const selectedOption = options.find((opt) => opt.value === value);
        const selectId = label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined;

        const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
            if (!onScrollToBottom || isLoadingMore) return;
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight + 50) {
                onScrollToBottom();
            }
        };

        return (
            <div className="mb-3 sm:mb-4 relative group w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-[10px] sm:text-[11px] font-black text-foreground-tertiary mb-1.5 uppercase tracking-widest px-1 cursor-pointer"
                    >
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={disabled}>
                        <button
                            ref={ref}
                            id={selectId}
                            type="button"
                            className={cn(
                                "w-full flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md transition-all duration-300 outline-none text-left",
                                "focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 focus:border-primary focus:shadow-lg sm:focus:shadow-xl",
                                error ? "border-error focus:ring-error" : "border-border hover:border-primary/40",
                                disabled && "opacity-50 cursor-not-allowed",
                                className
                            )}
                        >
                            <div className="flex items-center gap-3 truncate max-w-[calc(100%-24px)]">
                                {startIcon && <div className="text-primary group-focus-within:opacity-100 transition-opacity flex-shrink-0">{startIcon}</div>}
                                <span className={cn("truncate font-medium", !selectedOption ? "text-foreground-tertiary" : "text-foreground")}>
                                    {selectedOption ? selectedOption.label : placeholder}
                                </span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 sm:w-5 sm:h-5 text-foreground-tertiary/60 group-focus-within:text-primary transition-colors flex-shrink-0", disabled && "opacity-50")} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[350px] overflow-auto custom-scrollbar p-1.5"
                        onScroll={handleScroll}
                    >
                        {searchable && (
                            <div className="sticky top-0 z-20 bg-white pb-1.5 mb-1.5 border-b border-border/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-tertiary" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        autoFocus
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-muted/30 border border-border/50 rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/5 transition-all text-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {options.length === 0 && !isLoadingMore && (
                                    <div className="px-4 py-3 text-center">
                                        <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">No matching records</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                            {options.map((option) => (
                                <DropdownMenuRadioItem
                                    key={option.value}
                                    value={option.value}
                                    className="rounded-lg py-2.5 text-xs sm:text-sm font-medium focus:bg-primary/5 focus:text-primary cursor-pointer"
                                >
                                    {option.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>

                        {isLoadingMore && (
                            <div className="flex items-center justify-center py-3 gap-2 border-t border-border/30 mt-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Loading More...</p>
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                {helperText && (
                    <p className={cn("mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium sm:font-bold px-1", error ? "text-error" : "text-foreground-tertiary")}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
