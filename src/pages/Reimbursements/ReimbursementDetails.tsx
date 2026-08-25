import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    FileText,
    IndianRupee,
    Tag,
    Clock,
    Download,
    Eye,
    ArrowUpRight
} from "lucide-react";
import { cn } from "../../lib/utils";
import { reimbursementService } from "../../services/reimbursementService";
import type { Reimbursement, ReimbursementAttachment } from "../../types/reimbursement.types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/Card";
import Button from "../../components/common/Button";
import BackButton from "../../components/common/BackButton";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import TextArea from "../../components/common/Input/TextArea";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useConfirmation } from "../../hooks/useConfirmation";
import Avatar from "../../components/common/Avatar";
import TimezoneToggle from "../../components/common/TimezoneToggle";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const ReimbursementDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { confirm, ConfirmationDialog } = useConfirmation();
    const [record, setRecord] = useState<Reimbursement | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    // Permissions
    const { hasPermission: canApprove } = usePermissions(PERMISSIONS.REIMBURSEMENT_APPROVE);
    const { hasPermission: canReject } = usePermissions(PERMISSIONS.REIMBURSEMENT_REJECT);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const response = await reimbursementService.getById(id);
                setRecord(response.data);
            } catch (error) {
                console.error("Failed to fetch reimbursement details:", error);
                toast.error("Could not load reimbursement details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!id) return;

        if (status === 'rejected' && !rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }

        const confirmed = await confirm({
            title: status === 'approved' ? 'Approve Request' : 'Reject Request',
            message: `Are you sure you want to ${status} this reimbursement request?`,
            confirmLabel: status === 'approved' ? 'Approve' : 'Reject',
            variant: status === 'approved' ? 'success' : 'danger'
        });

        if (!confirmed) return;

        try {
            setActionLoading(true);
            await reimbursementService.updateStatus(id, {
                status,
                rejectionReason: status === 'rejected' ? rejectionReason : undefined
            });
            toast.success(`Request ${status} successfully!`);
            navigate(-1);
        } catch (error) {
            console.error(`Failed to ${status} reimbursement:`, error);
            toast.error(`Failed to ${status} reimbursement.`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownload = async (url: string, fileName: string) => {
        try {
            // If it's a data URL, we can download it directly
            if (url.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // For external URLs, fetch as blob to force download
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);
            toast.success("Download started");
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: open in new tab
            window.open(url, '_blank', 'noopener,noreferrer');
            toast.error("Download failed. Opening in new tab.");
        }
    };

    if (loading) return <GlobalLoader fullScreen message="Loading request details..." />;

    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-error" />
                <h2 className="text-xl font-bold font-black uppercase tracking-tight">Record not found</h2>
                <Button onClick={() => navigate("/reimbursements")}>Back to List</Button>
            </div>
        );
    }

    const employeeData = record.employeeId;
    const empObj = (employeeData && typeof employeeData === 'object') ? employeeData : null;
    const empId = typeof employeeData === 'string'
        ? employeeData
        : (employeeData?.employeeId || 'Unknown');

    const fullName = empObj?.personalInfo
        ? `${empObj.personalInfo.firstName} ${empObj.personalInfo.lastName}`
        : (empObj?.firstName ? `${empObj.firstName} ${empObj.lastName}` : "Unknown Employee");

    const profilePicture = empObj?.personalInfo?.profilePicture;
    const firstName = empObj?.personalInfo?.firstName || empObj?.firstName || "";
    const lastName = empObj?.personalInfo?.lastName || empObj?.lastName || "";

    return (
        <div className="space-y-8 animate-in mt-6 fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 lg:px-6 py-8 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <BackButton label="Back to Requests" className="mb-4" />
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter shrink-0">
                            Request Details
                        </h1>
                        <div className={cn(
                            "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-sm",
                            record.status === 'approved' ? "bg-success/10 text-success border-success/20" :
                                record.status === 'rejected' ? "bg-error/10 text-error border-error/20" :
                                    "bg-warning/10 text-warning border-warning/20"
                        )}>
                            {record.status}
                        </div>
                    </div>
                    <p className="text-foreground-tertiary font-bold flex items-center gap-2 mt-2">
                        <Tag className="w-4 h-4" />
                        ID: {record._id}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <TimezoneToggle variant="horizontal" />
                    {record.status === 'pending' && !isRejecting && (
                        <div className="flex gap-3 w-full sm:w-auto">
                            {canReject && (
                                <Button
                                    variant="destructiveOutline"
                                    className="flex-1 sm:flex-none h-14 px-8 transition-all"
                                    onClick={() => setIsRejecting(true)}
                                    startIcon={<XCircle className="w-5 h-5" />}
                                >
                                    Reject
                                </Button>
                            )}
                            {canApprove && (
                                <Button
                                    className="flex-1 sm:flex-none h-14 px-8"
                                    onClick={() => handleAction('approved')}
                                    isLoading={actionLoading}
                                    startIcon={<CheckCircle2 className="w-5 h-5" />}
                                >
                                    Approve
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isRejecting && (
                <div className="bg-error/5 border border-error/20 rounded-[2.5rem] p-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 text-error">
                        <AlertCircle className="w-6 h-6" />
                        <h3 className="font-black text-lg uppercase tracking-tight">Rejection Details</h3>
                    </div>
                    <TextArea
                        label="Rejection Reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter the reason for rejecting this request..."
                        maxLength={500}
                        rows={4}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" className="text-foreground-tertiary" onClick={() => setIsRejecting(false)}>Cancel</Button>
                        <Button
                            className="bg-error hover:bg-error/90 text-white border-none h-12 px-8"
                            onClick={() => handleAction('rejected')}
                            isLoading={actionLoading}
                        >
                            Confirm Rejection
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Main Content Card */}
                    <Card variant="bordered" className="rounded-[3rem] bg-surface shadow-2xl shadow-primary/5 overflow-hidden border-border/40">
                        <CardHeader className="bg-muted/30 border-b border-border/30 px-10 py-8">
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground uppercase flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <FileText className="w-6 h-6" />
                                </div>
                                Claim Submission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-[0.2em]">Expense Date</p>
                                    <div className="flex items-center gap-3 text-lg font-black text-foreground">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        {format(new Date(record.expenseDate), "EEEE, MMMM do, yyyy")}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-[0.2em]">Expense Type</p>
                                    <div className="flex items-center gap-3 text-lg font-black text-foreground">
                                        <Tag className="w-5 h-5 text-accent" />
                                        {record.reimbursementType}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 py-0 border-border/30">
                                <h3 className="text-2xl font-black text-foreground tracking-tight">{record.title}</h3>
                                {record.description && <div className="bg-muted/30 rounded-3xl p-6 border border-border/20 text-foreground-secondary font-medium leading-relaxed">
                                    {record.description}
                                </div>}
                            </div>

                            <div className="space-y-6 pt-8 border-t border-border/30">
                                <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-[0.2em] flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Attachments {record.attachments?.length ? `(${record.attachments.length})` : ""}
                                </p>

                                {record.attachments && record.attachments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {record.attachments.map((file: ReimbursementAttachment | string, idx) => {
                                            const isString = typeof file === 'string';
                                            const url = isString ? file : file.fileUrl;
                                            const name = isString ? (url.split('/').pop() || 'Attachment') : file.fileName;

                                            // Handle both standard URLs and base64 data URLs
                                            const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith('data:image/');

                                            const handleOpen = (e: React.MouseEvent) => {
                                                e.preventDefault();
                                                if (url.startsWith('data:')) {
                                                    // Browsers block direct navigation to data URLs for security.
                                                    // We open a new tab and inject the image content instead.
                                                    const newTab = window.open();
                                                    if (newTab) {
                                                        newTab.document.body.style.margin = '0';
                                                        newTab.document.body.style.background = '#000';
                                                        newTab.document.body.style.display = 'flex';
                                                        newTab.document.body.style.alignItems = 'center';
                                                        newTab.document.body.style.justifyContent = 'center';
                                                        newTab.document.body.style.minHeight = '100vh';
                                                        newTab.document.body.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 100vh; object-fit: contain;">`;
                                                        newTab.document.title = name;
                                                    }
                                                } else {
                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                }
                                            };

                                            if (isImage) {
                                                return (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        onClick={handleOpen}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative aspect-video rounded-3xl overflow-hidden border border-border/40 hover:border-primary/40 transition-all shadow-sm hover:shadow-xl cursor-pointer"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                            <p className="text-white text-[10px] font-black uppercase tracking-widest truncate mb-1">{name}</p>
                                                            <div className="flex items-center gap-2 text-white/90 font-bold text-xs">
                                                                <Eye className="w-4 h-4" />
                                                                Click to Full View
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="absolute top-3 right-3 bg-surface/90 backdrop-blur rounded-xl p-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-white hover:scale-110 active:scale-95"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDownload(url, name);
                                                            }}
                                                            title="Download Attachment"
                                                        >
                                                            <Download className="w-4 h-4 text-primary" />
                                                        </div>
                                                    </a>
                                                );
                                            }

                                            return (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    onClick={handleOpen}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col p-5 rounded-3xl bg-surface border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group relative min-h-[120px] justify-between cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center text-foreground-tertiary group-hover:text-primary transition-colors shrink-0">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-1">Document</p>
                                                            <span className="text-sm font-bold text-foreground truncate block">{name}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                            View File <ArrowUpRight className="w-3 h-3" />
                                                        </span>
                                                        <div
                                                            className="p-2 -m-2 hover:bg-primary/10 rounded-xl transition-all z-20 hover:scale-110 active:scale-95"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDownload(url, name);
                                                            }}
                                                            title="Download Document"
                                                        >
                                                            <Download className="w-4 h-4 text-foreground-tertiary/40 group-hover:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-[2rem] bg-muted/20 border border-dashed border-border/40">
                                        <AlertCircle className="w-8 h-8 text-foreground-tertiary/30 mb-2" />
                                        <p className="text-sm font-bold text-foreground-tertiary uppercase tracking-widest">No attachments provided</p>
                                    </div>
                                )}
                            </div>

                            {record.status === 'rejected' && record.rejectionReason && (
                                <div className="mt-8 p-6 rounded-[2rem] bg-error/5 border border-error/20 flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center shrink-0">
                                        <XCircle className="w-6 h-6 text-error" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-error uppercase tracking-widest">Rejection Reason</p>
                                        <p className="font-bold text-foreground">{record.rejectionReason}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Employee & Financials */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Amount Card */}
                    <Card className="rounded-[3rem] bg-gradient-to-br from-primary to-primary-dark text-white p-10 shadow-2xl shadow-primary/30 border-none relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <IndianRupee className="w-64 h-64" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Amount</p>
                        <h2 className="text-5xl font-black mt-4 flex items-baseline gap-2 tabular-nums">
                            <span className="text-2xl font-bold opacity-60">₹</span>
                            {record.amount.toLocaleString()}
                        </h2>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Awaiting Payout</p>
                        </div>
                    </Card>

                    {/* Employee Card */}
                    <Card variant="bordered" className="rounded-[3rem] bg-surface shadow-xl border-border/40 overflow-hidden">
                        <div className="h-24 bg-muted/50 border-b border-border/30 relative">
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                <div className="p-1.5 bg-surface rounded-[2rem] shadow-xl border border-border/30">
                                    <Avatar
                                        src={profilePicture}
                                        firstName={firstName}
                                        lastName={lastName}
                                        size="xl"
                                        className="rounded-[1.5rem]"
                                    />
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-14 pb-8 px-8 text-center space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">{fullName}</h3>
                                <p className="text-sm font-bold text-foreground-tertiary">Employee ID: {empId ? empId.slice(-8).toUpperCase() : 'N/A'}</p>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30">
                                    <div className="flex items-center gap-3 shrink-0">
                                        <Clock className="w-4 h-4 text-foreground-tertiary" />
                                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Submitted</span>
                                    </div>
                                    <span className="text-xs font-bold text-foreground">{format(new Date(record.createdAt), "MMM dd, yyyy")}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30">
                                    <div className="flex items-center gap-3 shrink-0">
                                        <IndianRupee className="w-4 h-4 text-foreground-tertiary" />
                                        <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Policy Limit</span>
                                    </div>
                                    <span className="text-xs font-bold text-success font-black">UNLIMITED</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {ConfirmationDialog}
        </div>
    );
};

export default ReimbursementDetails;
