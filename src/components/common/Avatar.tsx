import React from "react";
import { cn, getInitials } from "../../lib/utils";

interface AvatarProps {
    src?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    objectFit?: "cover" | "contain";
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    firstName,
    lastName,
    name,
    className,
    size = "md",
    objectFit = "cover",
}) => {
    const fullName = name || `${firstName || ""} ${lastName || ""}`.trim() || "User";
    const initials = getInitials(fullName);

    const getAvatarColor = () => {
        const colors = [
            "from-blue-500 to-blue-600",
            "from-purple-500 to-purple-600",
            "from-emerald-500 to-emerald-600",
            "from-orange-500 to-orange-600",
            "from-pink-500 to-pink-600",
            "from-cyan-500 to-cyan-600",
        ];
        const index = fullName.length % colors.length;
        return colors[index];
    };

    const sizes = {
        xs: "w-6 h-6 text-[10px] rounded-lg",
        sm: "w-8 h-8 text-xs rounded-xl",
        md: "w-10 h-10 text-sm rounded-xl",
        lg: "w-12 h-12 text-lg rounded-2xl",
        xl: "w-16 h-16 text-2xl rounded-2xl",
        "2xl": "w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 text-4xl sm:text-5xl lg:text-7xl rounded-xl sm:rounded-[1rem]",
    };

    return (
        <div
            className={cn(
                "relative shrink-0 flex items-center justify-center overflow-hidden shadow-sm",
                objectFit === "contain" && src ? "bg-muted" : "bg-gradient-to-br",
                !src && getAvatarColor(),
                objectFit === "cover" && src && "bg-gradient-to-br",
                sizes[size],
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={fullName}
                    // className={cn(
                    //     "w-full h-full",
                    //     objectFit === "cover" ? "object-cover" : "object-contain"
                    // )}
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement?.classList.add(...getAvatarColor().split(" "));
                    }}
                />
            ) : (
                <span className="font-bold text-white uppercase">{initials}</span>
            )}
        </div>
    );
};

export default Avatar;
