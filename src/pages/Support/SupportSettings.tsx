import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Save,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2
} from 'lucide-react';
import supportService from '../../services/supportService';
import type { SupportSettings } from '../../services/supportService';
import Button from '../../components/common/Button';
import { cn } from '../../lib/utils';

const SupportSettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<SupportSettings>>({
        supportEmail: '',
        supportPhone: '',
        supportMessage: '',
        allowUrgentEmail: true,
        clientSupportEnabled: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await supportService.getSettings();
            setFormData(data);
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        setMessage(null);
        try {
            await supportService.updateSettings(formData);
            setMessage({ type: 'success', text: 'Support settings updated successfully' });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-foreground-tertiary font-medium">Loading resolution matrix...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <SettingsIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Support Logic</h1>
                        <p className="text-sm text-foreground-tertiary font-bold tracking-widest">Global Configuration Matrix</p>
                    </div>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={submitting}
                    startIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    className="shadow-xl shadow-primary/20"
                >
                    Initialize Update
                </Button>
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3 animate-in zoom-in-95 duration-200",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-error/5 border-error/20 text-error"
                )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Contact Information */}
                <div className="md:col-span-2 space-y-8">
                    <section className="bg-surface rounded-[2.5rem] border border-border/50 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Public Access Channels</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary px-2 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Support Email
                                </label>
                                <input 
                                    className="w-full px-5 py-3.5 rounded-[1.25rem] bg-muted/20 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                    value={formData.supportEmail}
                                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary px-2 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> Support Phone
                                </label>
                                <input 
                                    className="w-full px-5 py-3.5 rounded-[1.25rem] bg-muted/20 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                    value={formData.supportPhone}
                                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary px-2 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> Response Protocol (Support Message)
                            </label>
                            <textarea 
                                rows={4}
                                className="w-full p-5 rounded-[1.5rem] bg-muted/20 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                                value={formData.supportMessage}
                                onChange={(e) => setFormData({ ...formData, supportMessage: e.target.value })}
                            />
                            <p className="text-[10px] text-foreground-tertiary font-medium italic px-2">
                                This message is displayed to users in the Support Modal.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Protocol Toggles */}
                <div className="space-y-8">
                    <section className="bg-surface rounded-[2.5rem] border border-border/50 shadow-sm p-8 space-y-6">
                         <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Protocol Toggles</h3>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={() => setFormData({ ...formData, allowUrgentEmail: !formData.allowUrgentEmail })}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-all group"
                            >
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-tight text-foreground">Urgent Email</p>
                                    <p className="text-[10px] font-bold text-foreground-tertiary">Real-time SMTP Alerts</p>
                                </div>
                                {formData.allowUrgentEmail ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-foreground-tertiary" />}
                            </button>

                            <button 
                                onClick={() => setFormData({ ...formData, clientSupportEnabled: !formData.clientSupportEnabled })}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-all group"
                            >
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-tight text-foreground">Client Portal</p>
                                    <p className="text-[10px] font-bold text-foreground-tertiary">Active Support Integration</p>
                                </div>
                                {formData.clientSupportEnabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-foreground-tertiary" />}
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-bold text-primary leading-relaxed text-center italic">
                                "Toggling these protocols overrides global system behavior for all users."
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SupportSettingsPage;
