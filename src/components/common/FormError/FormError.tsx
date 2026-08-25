import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface FormErrorProps {
    message: string | string[] | null | undefined;
    className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
    if (!message) return null;

    const messages = Array.isArray(message) ? message : [message];

    return (
        <div className={cn(
            "bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 mb-2",
            className
        )}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 leading-relaxed">
                {messages.map((m, idx) => (
                    <span key={idx}>{m}</span>
                ))}
            </div>
        </div>
    );
};

export default FormError;
