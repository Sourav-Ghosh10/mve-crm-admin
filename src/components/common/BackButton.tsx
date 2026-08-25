import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

interface BackButtonProps {
    label?: string;
    to?: string;
    onClick?: () => void;
    className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
    label = "Back",
    to,
    onClick,
    className
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:text-primary/80 transition-colors group w-fit",
                className
            )}
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {label}
        </button>
    );
};

export default BackButton;
