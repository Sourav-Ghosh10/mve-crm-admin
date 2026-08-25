import React from "react";
import { LogOut, LayoutDashboard, Users, HelpCircle } from "lucide-react";
import Button from "../common/Button";
import Avatar from "../common/Avatar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import logoStatic from "../../assets/codecit-logo.png";

interface ClientHeaderProps {
    onSupportClick?: () => void;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({ onSupportClick }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate("/login", { replace: true });
    };

    const userName = user ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}` : "Client User";
    const userEmail = user?.personalInfo?.email || "";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/80 backdrop-blur-md border-b border-border transition-all">
            <div className="h-full px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src={logoStatic}
                        alt="CodecIT"
                        className="w-10 h-10 rounded-xl shadow-lg shadow-primary/10"
                    />
                    <div>
                        <h1 className="text-sm font-black text-foreground uppercase tracking-tighter leading-none">
                            CodecIT <span className="text-primary">Portal</span>
                        </h1>
                        <p className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest mt-1">
                            Read-Only Performance Monitor
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 mr-6 border-r border-border pr-6">
                        <div 
                            onClick={() => document.getElementById('analytics-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-80 transition-all"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Analytics</span>
                        </div>
                        <div 
                            onClick={() => document.getElementById('resources-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 text-foreground-tertiary hover:text-foreground cursor-pointer transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Resources</span>
                        </div>
                        <button 
                            onClick={onSupportClick}
                            className="flex items-center gap-2 text-foreground-tertiary hover:text-primary cursor-pointer transition-colors bg-transparent border-none p-0 h-auto"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end hidden sm:block">
                            <p className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                {userName}
                            </p>
                            <p className="text-[9px] font-bold text-foreground-tertiary uppercase">
                                {userEmail}
                            </p>
                        </div>
                        <Avatar
                            src={user?.personalInfo?.profilePicture}
                            name={userName}
                            size="sm"
                            className="rounded-lg shadow-sm border border-border"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-xl hover:bg-error/5 hover:text-error text-foreground-tertiary transition-all ml-2"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ClientHeader;
