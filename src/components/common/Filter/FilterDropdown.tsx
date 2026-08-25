import React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../../lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "../../ui/dropdown-menu"
import { Button } from "../../ui/button"

interface FilterOption {
    value: string
    label: string
}

interface FilterDropdownProps {
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    align?: "start" | "center" | "end"
    disabled?: boolean
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
    value,
    options,
    onChange,
    placeholder = "Select option",
    className,
    align = "start",
    disabled = false,
}) => {
    const selectedOption = options.find((opt) => opt.value === value)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between h-10 px-4 rounded-xl border-2 font-bold text-sm transition-all duration-200",
                        value !== "all"
                            ? "border-primary text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/80 hover:text-primary"
                            : "border-border/50 text-foreground-secondary hover:bg-muted/60 hover:text-foreground hover:text-foreground-secondary",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                >

                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform duration-300", value !== "all" ? "text-primary" : "text-foreground-tertiary")} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[14rem]" align={align}>
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    {options.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default FilterDropdown
