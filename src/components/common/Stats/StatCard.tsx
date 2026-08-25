import React from "react";
import { cn } from "../../../lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: string; positive: boolean };
    color: "primary" | "success" | "warning" | "error" | "info";
    className?: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    trend,
    color,
    className,
    onClick,
}) => {
    const colorVariants = {
        primary: "text-primary border-primary bg-primary/10",
        success: "text-success border-success bg-success/10",
        warning: "text-warning border-warning bg-warning/10",
        error: "text-error border-error bg-error/10",
        info: "text-info border-info bg-info/10",
    };

    const shadowVariants = {
        primary: "shadow-primary/5",
        success: "shadow-success/5",
        warning: "shadow-warning/5",
        error: "shadow-error/5",
        info: "shadow-info/5",
    };

    return (
        <div 
            onClick={onClick}
            className={cn(
            "bg-surface p-6 rounded-[2rem] border border-border/40 shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col justify-between",
            onClick && "cursor-pointer active:scale-95",
            shadowVariants[color],
            className
        )}>

            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border border-border/20",
                    colorVariants[color]
                )}>
                    {icon}
                </div>
                {trend && (
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        trend.positive ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    )}>
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <div className="text-3xl font-black text-foreground tracking-tighter mb-1">{value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-tertiary">{title}</div>
            </div>
        </div>
    );
};

export default StatCard;
