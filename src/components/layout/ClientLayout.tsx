import React from "react";
import { Outlet } from "react-router-dom";
import ClientHeader from "./ClientHeader";
import Footer from "./Footer";
import IncidentStatusBanner from "../portal/IncidentStatusBanner";
import { useAppSelector } from "../../store/hooks";
import SupportModal from "../common/Support/SupportModal";

const ClientLayout: React.FC = () => {
    const user = useAppSelector((state) => state.auth.user);
    const [supportOpen, setSupportOpen] = React.useState(false);
    // Attempt to get clientId from the user context
    const clientId = user?.clientId || undefined;

    return (
        <div className="min-h-screen bg-muted/30">
            <ClientHeader onSupportClick={() => setSupportOpen(true)} />

            <main className="pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    {/* Incident Status Banner */}
                    <IncidentStatusBanner clientId={clientId} />

                    {/* Passive Portal Indicator */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-tertiary">
                                Live Data Matrix • Authorization: Passive
                            </span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-surface border border-border shadow-sm">
                            <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest">
                                System v4.1.0-readonly
                            </span>
                        </div>
                    </div>

                    <Outlet />
                </div>
            </main>

            <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-border mt-auto">
                <Footer />
            </div>

            <SupportModal 
                open={supportOpen} 
                onClose={() => setSupportOpen(false)} 
                preFilledSubject="Pulse Ops Portal Support Request"
            />
        </div>
    );
};

export default ClientLayout;
