import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientCreationWizard from "./ClientCreationWizard";
import { clientService } from "../../../services/clientService";
import type { Client, CreateClientRequest, UpdateClientRequest } from "../../../types/client.types";
import { getErrorMessage } from "../../../utils/errorHandling";

const ClientFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Partial<Client> | null>(null);
    const [loading, setLoading] = useState(!!id);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClient = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await clientService.getById(id);
                setClient(data);
            } catch (err) {
                const msg = getErrorMessage(err, "Failed to fetch client details");
                setError(Array.isArray(msg) ? msg.join(", ") : msg);
            } finally {
                setLoading(false);
            }
        };

        fetchClient();
    }, [id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormSubmit = async (data: any) => {
        const payload = data as CreateClientRequest;
        try {
            setIsSaving(true);
            setError(null);
            if (id) {
                await clientService.update({ ...payload, id } as UpdateClientRequest);
            } else {
                await clientService.create(payload);
            }
            navigate("/clients");
        } catch (err) {
            const msg = getErrorMessage(err, "Failed to save client");
            setError(Array.isArray(msg) ? msg.join(", ") : msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">
                        {id ? "Syncing Client Data..." : "Initializing Onboarding..."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-2">
                    {id ? "Refine Client Profile" : "Strategic Client Onboarding"}
                </h1>
                <p className="text-foreground-tertiary font-medium">
                    {id
                        ? "Update the configuration and resource mapping for this account."
                        : "Configure the identity, financials, and team matrix for a new client partnership."}
                </p>
            </div>

            <div className="bg-surface border border-border/50 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5">
                <ClientCreationWizard
                    initialValues={client || { is_active: true }}
                    onSubmit={handleFormSubmit}
                    onCancel={() => navigate("/clients")}
                    isLoading={isSaving}
                    error={error}
                    onClearError={() => setError(null)}
                />
            </div>
        </div>
    );
};

export default ClientFormPage;
