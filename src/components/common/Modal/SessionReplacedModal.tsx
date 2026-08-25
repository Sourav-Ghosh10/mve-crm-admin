import React from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from '../Button/Button';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSessionReplacedOpen } from '../../../store/slices/uiSlice';
import { tokenStorage } from '../../../services/api';

const SessionReplacedModal: React.FC = () => {
    const dispatch = useAppDispatch();
    const open = useAppSelector((state) => state.ui.sessionReplacedOpen);

    const handleLogout = () => {
        tokenStorage.clearTokens();
        dispatch(setSessionReplacedOpen(false));
        window.location.href = `${import.meta.env.BASE_URL}login`.replace(/\/+/, "/");
    };

    if (!open) return null;

    return (
        <Modal
            open={open}
            onClose={() => { }} // Disable manual close to force action
            title="Session Conflict"
            maxWidth="sm"
            hideHeader
            actions={
                <div className="flex flex-col gap-3 w-full">
                    <Button
                        variant="default"
                        onClick={handleLogout}
                        className="w-full rounded-xl py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        Re-login
                    </Button>
                    {/* <Button
                        variant="secondaryOutline"
                        onClick={handleLogout}
                        className="w-full rounded-xl py-4 font-bold text-lg"
                    >
                        Go to Login
                    </Button> */}
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center text-center py-6 space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-error/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 rounded-full bg-error/10 flex items-center justify-center border-4 border-error/20 transition-transform hover:scale-105 duration-500">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm">
                            <AlertCircle className="w-10 h-10 text-error" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3 px-2">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Account Logged Out</h2>
                    <p className="text-foreground-secondary text-base leading-relaxed max-w-[300px] mx-auto font-medium">
                        Your account has been logged in from another device. Your current session will be closed.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default SessionReplacedModal;
