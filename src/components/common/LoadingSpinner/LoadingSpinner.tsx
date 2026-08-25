import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  fullScreen = false,
  size = "lg",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col justify-center items-center gap-4 animate-in fade-in duration-300",
        fullScreen ? "h-screen w-full" : "h-full w-full min-h-[300px]",
        className,
      )}
    >
      <div className="relative">
        <Loader2 className={cn("animate-spin text-primary drop-shadow-lg", sizeClasses[size])} />
        <div className="absolute inset-0 animate-ping opacity-20">
          <Loader2 className={cn("text-primary", sizeClasses[size])} />
        </div>
      </div>
      {message && (
        <p className="text-sm sm:text-base font-bold text-foreground-secondary uppercase tracking-widest animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
