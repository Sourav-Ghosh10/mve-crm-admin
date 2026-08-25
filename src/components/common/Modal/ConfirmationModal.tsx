import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import Button from '../Button/Button';
import { cn } from '../../../lib/utils';

interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
}) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            maxWidth="md"
            hideHeader
            actions={
                <div className="grid grid-cols-2 gap-4 w-full">
                    <Button
                        variant="secondaryOutline"
                        onClick={onClose}
                        className="rounded-2xl h-12 font-bold text-sm bg-muted/30 border-border/50 hover:bg-muted transition-all duration-300"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'destructive' : 'default'}
                        className={cn(
                            "rounded-2xl h-12 font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg",
                            variant === 'success' && "bg-success hover:bg-success/90 text-white border-none"
                        )}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center text-center py-4">
                {/* Icon Section with Rings */}
                <div className="relative mb-6">
                    <div className={cn(
                        "absolute inset-0 rounded-full animate-ping opacity-20",
                        variant === 'danger' ? "bg-error" : variant === 'success' ? "bg-success" : "bg-primary"
                    )} />
                    <div className={cn(
                        "relative w-20 h-20 rounded-full flex items-center justify-center shadow-inner transition-transform hover:scale-105 duration-500",
                        variant === 'danger' ? "bg-error/10 text-error border-4 border-error/5" :
                            variant === 'success' ? "bg-success/10 text-success border-4 border-success/5" :
                                "bg-primary/10 text-primary border-4 border-primary/5"
                    )}>
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm",
                        )}>
                            {variant === 'danger' ? (
                                <AlertTriangle className="w-6 h-6" />
                            ) : variant === 'success' ? (
                                <CheckCircle2 className="w-6 h-6" />
                            ) : (
                                <Info className="w-6 h-6" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-3 px-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                        {title}
                    </h3>
                    <p className="text-base text-foreground-tertiary leading-relaxed font-medium max-w-[280px] mx-auto">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
