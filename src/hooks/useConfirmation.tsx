import { useState, useCallback } from 'react';
import ConfirmationModal from '../components/common/Modal/ConfirmationModal';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info' | 'success';
}

export const useConfirmation = () => {
    const [options, setOptions] = useState<ConfirmationOptions | null>(null);
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmationOptions) => {
        return new Promise<boolean>((resolve) => {
            setOptions(opts);
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (resolveRef) {
            resolveRef(true);
        }
        setOptions(null);
        setResolveRef(null);
    }, [resolveRef]);

    const handleCancel = useCallback(() => {
        if (resolveRef) {
            resolveRef(false);
        }
        setOptions(null);
        setResolveRef(null);
    }, [resolveRef]);

    const ConfirmationDialog = options ? (
        <ConfirmationModal
            open={!!options}
            onClose={handleCancel}
            onConfirm={handleConfirm}
            title={options.title}
            message={options.message}
            confirmLabel={options.confirmLabel}
            cancelLabel={options.cancelLabel}
            variant={options.variant}
        />
    ) : null;

    return {
        confirm,
        ConfirmationDialog,
    };
};
