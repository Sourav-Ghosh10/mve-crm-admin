import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  User, 
  CheckCircle2, 
  Loader2,
  Send,
  UserPlus,
  ArrowLeft,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Paperclip,
  FileText,
  Download,
  X
} from 'lucide-react';
import api from '../../services/api';
import supportService from '../../services/supportService';
import type { SupportTicket } from '../../services/supportService';
import { useAppSelector } from '../../store/hooks';
import Button from '../../components/common/Button';
import { cn } from '../../lib/utils';

const SupportTicketsDashboard: React.FC = () => {
    const adminUser = useAppSelector((state) => state.auth.user);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const lastFetchRef = useRef<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const API_BASE_URL = api.defaults.baseURL;

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');

    // Detail view state
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTickets = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const params: Record<string, string | number | boolean> = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (priorityFilter !== 'all') params.priority = priorityFilter;
            if (sourceFilter !== 'all') params.source = sourceFilter;
            if (isPolling && lastFetchRef.current) params.lastFetch = lastFetchRef.current;

            const data = await supportService.getAllTickets(params);
            
            if (isPolling) {
                // Merge updates if polling
                if (data.tickets.length > 0) {
                    setTickets(prev => {
                        const updatedIds = new Set(data.tickets.map(t => t._id));
                        const untouched = prev.filter(t => !updatedIds.has(t._id));
                        return [...data.tickets, ...untouched].sort((a, b) => 
                            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                        );
                    });
                }
            } else {
                setTickets(data.tickets);
            }
            lastFetchRef.current = new Date().toISOString();
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, [statusFilter, priorityFilter, sourceFilter]);

    useEffect(() => {
        fetchTickets();
        
        // Start polling (every 30 seconds)
        const interval = setInterval(() => {
            fetchTickets(true);
        }, 30000);
        
        return () => clearInterval(interval);
    }, [fetchTickets]);

    // Update selected ticket details if it's in the list
    useEffect(() => {
        if (selectedTicketId) {
            const ticket = tickets.find(t => t._id === selectedTicketId);
            if (ticket) setSelectedTicket(ticket);
        } else {
            setSelectedTicket(null);
        }
    }, [selectedTicketId, tickets]);

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        setSubmitting(true);
        try {
            const updated = await supportService.replyToTicket(selectedTicket._id, replyText, 'admin', attachments);
            setReplyText("");
            setAttachments([]);
            // Update local state by updating the list
            setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
        } catch (err) {
            console.error("Failed to reply", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if (!selectedTicketId) return;
        try {
            const updated = await supportService.updateStatus(selectedTicketId, status);
            setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleAssign = async () => {
        if (!selectedTicketId || !adminUser) return;
        try {
            const updated = await supportService.assignTicket(selectedTicketId, adminUser.id);
            setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
        } catch (err) {
            console.error("Failed to assign ticket", err);
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

    const filteredTickets = tickets.filter(t => 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.createdBy?.personalInfo?.firstName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] -m-6 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="bg-surface border-b border-border px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Support Dashboard</h1>
                        <p className="text-[10px] text-foreground-tertiary font-black uppercase tracking-widest flex items-center gap-2">
                             System Resolution Nexus • {filteredTickets.length} Active Vectors
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary group-focus-within:text-primary transition-colors" />
                        <input 
                            placeholder="Find ticket..."
                            className="pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-48 md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="h-10 w-px bg-border mx-1 hidden md:block" />

                    <div className="flex items-center bg-muted/20 rounded-xl p-1 border border-border/50">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-surface shadow-sm text-primary" : "text-foreground-tertiary hover:text-foreground")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-surface shadow-sm text-primary" : "text-foreground-tertiary hover:text-foreground")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <Button variant="ghost" size="icon" onClick={() => fetchTickets()} className="hover:rotate-180 transition-transform duration-500">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Ticket List */}
                <div className={cn(
                    "flex flex-col border-r border-border bg-muted/5 transition-all duration-300",
                    selectedTicketId ? "w-0 md:w-[350px] lg:w-[450px]" : "w-full"
                )}>
                    {/* Filters Sub-bar */}
                    <div className="p-4 bg-surface border-b border-border flex items-center gap-3 overflow-x-auto custom-scrollbar no-scrollbar">
                         <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 bg-muted/20 border border-border/50 rounded-lg text-[10px] font-black uppercase focus:outline-none transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-1.5 bg-muted/20 border border-border/50 rounded-lg text-[10px] font-black uppercase focus:outline-none transition-all"
                        >
                            <option value="all">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                         <select 
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="px-3 py-1.5 bg-muted/20 border border-border/50 rounded-lg text-[10px] font-black uppercase focus:outline-none transition-all"
                        >
                            <option value="all">All Sources</option>
                            <option value="employee_portal">Employee Portal</option>
                            <option value="client_portal">Client Portal</option>
                            <option value="admin_panel">Admin Panel</option>
                        </select>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-foreground-tertiary">
                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                <span className="text-xs font-black uppercase tracking-widest italic animate-pulse">Scanning Data Vectors...</span>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <MessageSquare className="w-16 h-16 text-muted mb-4 opacity-20" />
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">No Active Incidents</h3>
                                <p className="text-xs text-foreground-tertiary mt-2">All sectors clear for selected filters.</p>
                            </div>
                        ) : (
                            <div className={cn(
                                "p-4 space-y-3",
                                viewMode === 'grid' && !selectedTicketId && "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 space-y-0"
                            )}>
                                {filteredTickets.map((ticket) => (
                                    <button
                                        key={ticket._id}
                                        onClick={() => setSelectedTicketId(ticket._id)}
                                        className={cn(
                                            "w-full flex flex-col text-left rounded-2xl border transition-all duration-300 overflow-hidden",
                                            selectedTicketId === ticket._id 
                                                ? "bg-surface border-primary shadow-lg ring-1 ring-primary/20 scale-[0.98]" 
                                                : "bg-surface border-border/50 hover:border-primary/50 hover:bg-muted/5 shadow-sm"
                                        )}
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                                        ticket.status === 'open' ? "bg-blue-100 text-blue-600" :
                                                        ticket.status === 'in-progress' ? "bg-orange-100 text-orange-600" :
                                                        "bg-emerald-100 text-emerald-600"
                                                    )}>{ticket.status.replace('-', ' ')}</span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                        ticket.priority === 'urgent' ? "border-error text-error bg-error/5" :
                                                        ticket.priority === 'high' ? "border-orange-200 text-orange-600" :
                                                        "border-border text-foreground-tertiary"
                                                    )}>{ticket.priority}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-foreground-tertiary">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-foreground truncate group-hover:text-primary tracking-tight">{ticket.subject}</h4>
                                                <p className="text-xs text-foreground-tertiary line-clamp-1 mt-1 font-medium">{ticket.message}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black uppercase text-foreground-tertiary overflow-hidden">
                                                        {ticket.createdBy?.personalInfo?.firstName?.[0] || 'U'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                         <span className="text-[10px] font-black text-foreground-tertiary leading-none">
                                                            {ticket.createdBy?.personalInfo?.firstName} {ticket.createdBy?.personalInfo?.lastName}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-primary uppercase mt-0.5 tracking-tighter opacity-70 italic">{ticket.source.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-foreground-tertiary">
                                                    <MessageSquare className="w-3.5 h-3.5 opacity-40" />
                                                    <span className="text-[10px] font-black">{ticket.messages.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View - Conversation */}
                {selectedTicket && (
                    <div className="flex-1 flex flex-col bg-surface animate-in slide-in-from-right-4 duration-300">
                        {/* Detail Header */}
                        <div className="px-8 py-6 border-b border-border shadow-sm flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedTicketId(null)} className="md:hidden p-2 hover:bg-muted rounded-xl">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-foreground tracking-tight">{selectedTicket.subject}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest">Incident #{selectedTicket._id.toString().slice(-8)}</span>
                                        <span className="text-border">•</span>
                                        <span className="text-[10px] font-bold text-foreground-secondary flex items-center gap-1.5">
                                            <User className="w-3 h-3" />
                                            {selectedTicket.createdBy?.personalInfo?.firstName} {selectedTicket.createdBy?.personalInfo?.lastName} ({selectedTicket.userType})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden lg:flex items-center bg-muted/20 border border-border/50 rounded-xl p-1">
                                    <button 
                                        onClick={() => handleStatusUpdate('in-progress')}
                                        className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", selectedTicket.status === 'in-progress' ? "bg-surface shadow-sm text-orange-600" : "text-foreground-tertiary hover:text-foreground")}
                                    >In Progress</button>
                                    <button 
                                        onClick={() => handleStatusUpdate('resolved')}
                                        className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", selectedTicket.status === 'resolved' ? "bg-surface shadow-sm text-emerald-600" : "text-foreground-tertiary hover:text-foreground")}
                                    >Resolved</button>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={handleAssign}
                                    startIcon={selectedTicket.assignedTo ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    disabled={selectedTicket.assignedTo?._id === adminUser?.id}
                                >
                                    {selectedTicket.assignedTo?._id === adminUser?.id ? "Assigned to You" : "Claim Incident"}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedTicketId(null)} className="hidden md:flex">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Conversation Thread */}
                        <div className="flex-1 overflow-y-auto px-12 py-8 bg-muted/5 space-y-8 custom-scrollbar">
                           {/* Initial Request Vector */}
                           <div className="flex flex-col max-w-[80%] mr-auto items-start">
                               <div className="flex items-center gap-2 mb-2 px-1">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">Source Incident Vector (Initial Request)</span>
                                   <span className="text-[9px] opacity-40 font-bold">{new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                               </div>
                               <div className="px-6 py-4 rounded-[2rem] rounded-tl-none text-sm shadow-sm leading-relaxed whitespace-pre-wrap font-medium border border-border/50 bg-surface text-foreground">
                                   <p>{selectedTicket.message}</p>
                                   {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                                       <div className="mt-4 flex flex-wrap gap-2">
                                           {selectedTicket.attachments.map((file, idx: number) => (
                                               <a 
                                                   key={idx}
                                                   href={file?.url && /^https?:\/\//i.test(String(file.url)) ? file.url : `${API_BASE_URL}/files/view?key=${file.url}`}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="flex items-center gap-2 px-3 py-2 bg-muted/10 border border-border/50 rounded-xl text-[10px] font-black text-foreground hover:text-primary hover:border-primary transition-all group shadow-sm"
                                               >
                                                   <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center">
                                                       <FileText className="w-3.5 h-3.5 text-foreground-tertiary group-hover:text-primary" />
                                                   </div>
                                                   <span className="truncate max-w-[150px]">{file.name}</span>
                                                   <Download className="w-3.5 h-3.5 ml-auto opacity-50" />
                                               </a>
                                           ))}
                                       </div>
                                   )}
                               </div>
                           </div>

                           {selectedTicket.messages.slice(1).map((msg, i) => (
                               <div key={i} className={cn("flex flex-col max-w-[80%]", msg.senderType === 'admin' ? "ml-auto items-end" : "mr-auto items-start")}>
                                   <div className="flex items-center gap-2 mb-2 px-1">
                                       <span className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">
                                           {msg.senderType === 'admin' ? 'Administrative Feedback' : `${selectedTicket.createdBy?.personalInfo?.firstName} (User Matrix)`}
                                       </span>
                                       <span className="text-[9px] opacity-40 font-bold">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                   </div>
                                   <div className={cn(
                                       "px-6 py-4 rounded-[2rem] text-sm shadow-sm leading-relaxed whitespace-pre-wrap font-medium border transition-all",
                                       msg.senderType === 'admin' 
                                           ? "bg-primary text-white border-primary-dark shadow-primary/20" 
                                           : "bg-surface border-border/50 text-foreground"
                                   )}>
                                       <p>{msg.text}</p>
                                       {msg.attachments && msg.attachments.length > 0 && (
                                           <div className="mt-3 space-y-2">
                                               {msg.attachments.map((file, fIdx: number) => (
                                                   <a 
                                                       key={fIdx}
                                                       href={file?.url && /^https?:\/\//i.test(String(file.url)) ? file.url : `${API_BASE_URL}/files/view?key=${file.url}`}
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className={cn(
                                                           "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all",
                                                           msg.senderType === 'admin'
                                                               ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                                               : "bg-muted/10 border-border/50 text-foreground hover:border-primary hover:text-primary"
                                                       )}
                                                   >
                                                       <FileText className="w-3.5 h-3.5" />
                                                       <span className="truncate max-w-[150px]">{file.name}</span>
                                                       <Download className="w-3.5 h-3.5 ml-auto opacity-50" />
                                                   </a>
                                               ))}
                                           </div>
                                       )}
                                   </div>
                               </div>
                           ))}
                        </div>

                        <div className="px-12 py-6 bg-surface border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                            {selectedTicket.status !== 'resolved' ? (
                                <div className="space-y-4">
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 px-4">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl text-[10px] text-primary font-black">
                                                    <FileText className="w-4 h-4" />
                                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                                    <button type="button" onClick={() => removeAttachment(idx)}><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative flex items-end gap-4 p-3 rounded-[2.5rem] bg-muted/20 border border-border focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-foreground-tertiary hover:text-primary hover:bg-primary/5 shrink-0"
                                        >
                                            <Paperclip className="w-5.5 h-5.5" />
                                        </button>
                                        <textarea 
                                            rows={1}
                                            placeholder="Enter administrative reply protocols..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-foreground-tertiary px-4 py-3 resize-none max-h-48 custom-scrollbar"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleReply())}
                                        />
                                        <Button 
                                            size="icon" 
                                            onClick={handleReply} 
                                            disabled={submitting || !replyText.trim()}
                                            className="w-12 h-12 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform shrink-0"
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                    <input type="file" className="hidden" ref={fileInputRef} multiple onChange={handleFileChange} accept="image/*,application/pdf" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-in zoom-in-50 duration-500" />
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Resolution Finalized</h3>
                                    <p className="text-xs text-foreground-tertiary">This incident vector is marked as resolved. Communication logged and encrypted.</p>
                                    <button 
                                        onClick={() => handleStatusUpdate('in-progress')}
                                        className="mt-4 text-xs font-black text-primary hover:underline uppercase tracking-tighter"
                                    >Re-Open Vector</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTicketsDashboard;
