import React from "react";
import { Activity } from "lucide-react";
import { cn } from "../../../lib/utils";

interface GlobalLoaderProps {
    message?: string;
    className?: string;
    fullScreen?: boolean;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({
    message = "Loading...",
    className,
    fullScreen = false
}) => {
    return (
        <div className={cn(
            "flex flex-col justify-center items-center gap-4",
            fullScreen ? "h-[80vh]" : "h-full min-h-[300px]",
            className
        )}>
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Activity className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-foreground-secondary font-medium animate-pulse">{message}</p>
        </div>
    );
};

export default GlobalLoader;
