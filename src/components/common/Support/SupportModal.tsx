import React, { useState, useEffect, useRef } from "react";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Plus, 
  History, 
  ArrowLeft, 
  Loader2, 
  Phone,
  Paperclip,
  FileText,
  Download,
  X,
  Info
} from "lucide-react";
import supportService from "../../../services/supportService";
import type { SupportTicket, SupportSettings } from "../../../services/supportService";
import { cn } from "../../../lib/utils";
import { useAppSelector } from "../../../store/hooks";
import api from "../../../services/api";

const API_BASE_URL = api.defaults.baseURL;

interface SupportModalProps {
    open: boolean;
    onClose: () => void;
    preFilledSubject?: string;
}

const SupportModal: React.FC<SupportModalProps> = ({ open, onClose, preFilledSubject = "Pulse Ops Portal Support" }) => {
    const user = useAppSelector((state) => state.auth.user);
    const [view, setView] = useState<'options' | 'new' | 'history' | 'ticket'>('options');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [settings, setSettings] = useState<SupportSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // New ticket state
    const [subject, setSubject] = useState(preFilledSubject);
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState("medium");
    const [isUrgent, setIsUrgent] = useState(false);
    
    // Chat state
    const [replyText, setReplyText] = useState("");

    // Attachments state
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const SUBJECT_LIMIT = 100;
    const MESSAGE_LIMIT = 2000;
    const REPLY_LIMIT = 1000;

    useEffect(() => {
        if (open) {
            fetchSettings();
            if (view === 'history') {
                fetchTickets();
            }
        }
    }, [open, view]);

    useEffect(() => {
        if (view === 'ticket' && open) {
            const interval = setInterval(() => {
                if (selectedTicket) {
                    refreshTicket(selectedTicket._id);
                }
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [view, open, selectedTicket]);

    useEffect(() => {
        if (view === 'ticket') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedTicket?.messages, view]);

    const fetchSettings = async () => {
        try {
            const data = await supportService.getSettings();
            setSettings(data);
        } catch (err) {
            console.error("Failed to fetch support settings", err);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.getMyTickets();
            setTickets(data);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshTicket = async (id: string) => {
        try {
            const updatedTickets = await supportService.getMyTickets();
            const found = updatedTickets.find(t => t._id === id);
            if (found) {
                setSelectedTicket(found);
                setTickets(updatedTickets);
            }
        } catch (err) {
            console.error("Failed to refresh ticket", err);
        }
    };

    const handleCreateTicket = async () => {
        if (!message.trim()) return;
        setSubmitting(true);
        try {
            await supportService.createTicket({
                subject,
                message,
                priority: isUrgent ? 'urgent' : priority,
                source: user?.userType === 'CLIENT' ? 'client_portal' : 'admin_panel',
                userType: user?.userType === 'CLIENT' ? 'client' : 'admin',
                isUrgent,
                attachments
            });
            setSubject(preFilledSubject);
            setMessage("");
            setAttachments([]);
            setIsUrgent(false);
            await fetchTickets();
            setView('history');
        } catch (err) {
            console.error("Failed to create ticket", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        setSubmitting(true);
        try {
            const senderType = user?.userType === 'CLIENT' ? 'client' : 'admin';
            const updated = await supportService.replyToTicket(selectedTicket._id, replyText, senderType, attachments);
            setSelectedTicket(updated);
            setReplyText("");
            setAttachments([]);
            fetchTickets();
        } catch (err) {
            console.error("Failed to reply", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles].slice(0, 3));
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const renderFooter = () => {
        if (view === 'options') {
            return (
                <div className="flex justify-end w-full">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            );
        }
        if (view === 'new') {
            return (
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="ghost" onClick={() => setView('options')}>Cancel</Button>
                    <Button 
                        onClick={handleCreateTicket} 
                        disabled={!message.trim() || submitting}
                        startIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    >
                        Submit Ticket
                    </Button>
                </div>
            );
        }
        if (view === 'history') {
            return (
                <div className="flex justify-between items-center w-full">
                    <Button variant="ghost" onClick={() => setView('options')} startIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                    <Button variant="secondary" onClick={() => setView('new')} startIcon={<Plus className="w-4 h-4" />}>New Ticket</Button>
                </div>
            );
        }
        return null;
    };

    const renderContent = () => {
        switch (view) {
            case 'options':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setView('new')}
                                className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-primary" />
                                </div>
                                <span className="text-sm font-bold text-foreground">New Help Ticket</span>
                            </button>
                            <button 
                                onClick={() => setView('history')}
                                className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <History className="w-6 h-6 text-secondary" />
                                </div>
                                <span className="text-sm font-bold text-foreground">My Requests</span>
                            </button>
                        </div>

                        {settings && (
                            <div className="p-4 rounded-[1.5rem] bg-muted/20 border border-border/50 space-y-4">
                                <p className="text-xs text-foreground-tertiary leading-relaxed">{settings.supportMessage}</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-xs font-bold text-foreground">{settings.supportEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-xs font-bold text-foreground">{settings.supportPhone}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'new':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Subject</label>
                                <span className={cn("text-[9px] font-bold", subject.length >= SUBJECT_LIMIT ? "text-error" : "text-foreground-tertiary")}>
                                    {subject.length}/{SUBJECT_LIMIT}
                                </span>
                            </div>
                            <input 
                                value={subject}
                                maxLength={SUBJECT_LIMIT}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary px-2">Priority</label>
                                <select 
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/50 text-sm focus:outline-none transition-all font-medium"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className={cn(
                                    "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer w-full transition-all",
                                    isUrgent ? "bg-error/5 border-error" : "bg-muted/20 border-border/50"
                                )}>
                                    <input 
                                        type="checkbox" 
                                        checked={isUrgent}
                                        onChange={(e) => setIsUrgent(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-[10px] font-black uppercase text-error">Mark Urgent</span>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Detailed Message</label>
                                <span className={cn("text-[9px] font-bold", message.length >= MESSAGE_LIMIT ? "text-error" : "text-foreground-tertiary")}>
                                    {message.length}/{MESSAGE_LIMIT}
                                </span>
                            </div>
                            <textarea 
                                rows={4}
                                value={message}
                                maxLength={MESSAGE_LIMIT}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your issue..."
                                className="w-full p-4 rounded-[1.5rem] bg-muted/20 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                            />
                        </div>

                        {/* Attachments UI */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary px-2">Attachments (Max 3)</label>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-xl text-[10px] text-primary font-bold">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[120px]">{file.name}</span>
                                        <button type="button" onClick={() => removeAttachment(idx)} className="hover:text-error">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {attachments.length < 3 && (
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border border-dashed border-border rounded-xl text-[10px] font-bold text-foreground-tertiary hover:border-primary hover:text-primary transition-all"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" />
                                        Attach File
                                    </button>
                                )}
                                <input type="file" className="hidden" ref={fileInputRef} multiple onChange={handleFileChange} accept="image/*,application/pdf" />
                            </div>
                        </div>

                        {isUrgent && (
                            <div className="p-3 bg-error/5 border border-error/20 rounded-xl flex items-start gap-2">
                                <Info className="w-4 h-4 text-error shrink-0 mt-0.5" />
                                <p className="text-[10px] font-medium text-error leading-tight">
                                    Urgent tickets are prioritized and will trigger immediate alerts to our support staff.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'history':
                return (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : tickets.length === 0 ? (
                            <div className="py-20 text-center opacity-40"><MessageSquare className="w-12 h-12 mx-auto mb-2" /><p className="text-xs">No tickets yet.</p></div>
                        ) : (
                            tickets.map(ticket => (
                                <button
                                    key={ticket._id}
                                    onClick={() => { setSelectedTicket(ticket); setView('ticket'); }}
                                    className="w-full p-4 rounded-2xl border border-border/50 bg-surface hover:border-primary transition-all text-left group"
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                            ticket.status === 'open' ? "bg-blue-100 text-blue-600" :
                                            ticket.status === 'in-progress' ? "bg-orange-100 text-orange-600" :
                                            ticket.status === 'resolved' ? "bg-emerald-100 text-emerald-600" :
                                            "bg-muted text-foreground-tertiary"
                                        )}>{ticket.status}</span>
                                        <span className="text-[9px] opacity-40 font-bold">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{ticket.subject}</p>
                                    <p className="text-xs text-foreground-tertiary line-clamp-1">{ticket.message}</p>
                                </button>
                            ))
                        )}
                    </div>
                );

            case 'ticket':
                if (!selectedTicket) return null;
                return (
                    <div className="flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" onClick={() => setView('history')}><ArrowLeft className="w-4 h-4" /></Button>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate">{selectedTicket.subject}</h4>
                                    <p className="text-[10px] opacity-40 uppercase font-black">Ticket #{selectedTicket._id.toString().slice(-6)}</p>
                                </div>
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase px-2.5 py-1 rounded-lg",
                                selectedTicket.status === 'open' ? "bg-blue-500/10 text-blue-600" :
                                selectedTicket.status === 'in-progress' ? "bg-orange-500/10 text-orange-600" :
                                "bg-emerald-500/10 text-emerald-600"
                            )}>{selectedTicket.status}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
                            {/* Initial Message */}
                            <div className="flex flex-col max-w-[90%] mr-auto items-start">
                                <span className="text-[9px] font-black uppercase opacity-30 mb-1 px-1">Source Incident Vector (Initial Request)</span>
                                <div className="px-4 py-3 rounded-2xl bg-muted/10 border border-border/50 text-xs">
                                    <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedTicket.attachments.map((file: { name: string; url: string; fileType: string }, idx: number) => (
                                                <a 
                                                    key={idx}
                                                    href={file?.url && /^https?:\/\//i.test(String(file.url)) ? file.url : `${API_BASE_URL}/files/view?key=${file.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-2 py-1 bg-surface border border-border rounded-lg text-[10px] font-bold text-foreground hover:text-primary hover:border-primary transition-all group"
                                                >
                                                    <FileText className="w-3 h-3 text-foreground-tertiary group-hover:text-primary" />
                                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                                    <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thread */}
                            {selectedTicket.messages.slice(1).map((msg, i) => {
                                const isFromSupport = msg.senderType === 'admin';
                                return (
                                    <div key={i} className={cn("flex flex-col max-w-[90%]", isFromSupport ? i % 2 === 0 ? "mr-auto items-start" : "mr-auto items-start" : "ml-auto items-end")}>
                                        <span className="text-[9px] font-black uppercase opacity-30 mb-1 px-1">{isFromSupport ? 'Administrative Feedback' : `${selectedTicket.createdBy?.personalInfo?.firstName || 'User'} (User Vector)`}</span>
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-xs", 
                                            isFromSupport ? "bg-muted/10 border border-border/50" : "bg-primary text-white"
                                        )}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-3 space-y-1.5">
                                                    {msg.attachments.map((file: { name: string; url: string; fileType: string }, fIdx: number) => (
                                                        <a 
                                                            key={fIdx}
                                                            href={file?.url && /^https?:\/\//i.test(String(file.url)) ? file.url : `${API_BASE_URL}/files/view?key=${file.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={cn(
                                                                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all",
                                                                isFromSupport ? "bg-surface border-border hover:border-primary" : "bg-white/10 border-white/20 hover:bg-white/20"
                                                            )}
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            <span className="truncate max-w-[120px]">{file.name}</span>
                                                            <Download className="w-3 h-3 ml-auto opacity-50" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[8px] font-bold opacity-30 mt-1 px-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {selectedTicket.status !== 'resolved' && (
                            <div className="pt-4 border-t border-border mt-auto">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-primary/5 border border-primary/20 rounded-lg text-[9px] text-primary font-bold">
                                                <FileText className="w-3 h-3" />
                                                <span className="truncate max-w-[80px]">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(idx)}><X className="w-2.5 h-2.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-1 mb-1.5">
                                    <span className="text-[8px] font-black uppercase opacity-30">{attachments.length}/3 Files</span>
                                    <div className="flex-1" />
                                    <span className={cn("text-[8px] font-bold", replyText.length >= REPLY_LIMIT ? "text-error" : "opacity-30")}>
                                        {replyText.length}/{REPLY_LIMIT}
                                    </span>
                                </div>
                                <div className="flex items-end gap-2 bg-muted/10 border border-border/50 rounded-2xl p-2 focus-within:border-primary transition-all">
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-foreground-tertiary hover:text-primary hover:bg-primary/5"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                    <textarea 
                                        rows={1}
                                        maxLength={REPLY_LIMIT}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 bg-transparent border-none text-[12px] focus:outline-none focus:ring-0 resize-none py-1.5 px-2 font-medium max-h-32 custom-scrollbar"
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleReply())}
                                    />
                                    <Button 
                                        size="icon" 
                                        className="w-8 h-8 rounded-xl shrink-0" 
                                        onClick={handleReply} 
                                        disabled={submitting || !replyText.trim()}
                                    >
                                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    </Button>
                                    <input type="file" className="hidden" ref={fileInputRef} multiple onChange={handleFileChange} accept="image/*,application/pdf" />
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={view === 'ticket' ? "Ticket Conversation" : "System Support & Assistance"}
            maxWidth="md"
            actions={renderFooter()}
        >
            {renderContent()}
        </Modal>
    );
};

export default SupportModal;
