import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User as UserIcon, Calendar, Briefcase, ArrowLeft, Search, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/common/Card";
import { userService } from "../../../services/userService";
import { leaveService } from "../../../services/leaveService";
import { leaveTypeService } from "../../../services/leaveTypeService";
import type { User } from "../../../types/user.types";
import type { LeaveBalanceDetails } from "../../../types/leave.types";
import type { LeaveType } from "../../../types/organization.types";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal/Modal";
import Input from "../../../components/common/Input/Input";
import FormSelect from "../../../components/common/Select/FormSelect";
import TextArea from "../../../components/common/Input/TextArea";

const LeaveBalancesDetail: React.FC<{ userId: string }> = ({ userId }) => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [detailedBalances, setDetailedBalances] = useState<LeaveBalanceDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [leaveTypesForModal, setLeaveTypesForModal] = useState<LeaveType[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ leaveTypeId: '', amount: 0, description: '' });
    const [isSavingModal, setIsSavingModal] = useState(false);

    const loadBalances = useCallback(async (user: User) => {
        try {
            const uid = user._id || user.id;
            const data = await leaveService.getEmployeeBalance(uid);
            // API returns { status:'success', data:{ balances:[...] } }
            // leaveService returns response.data.data => { balances:[...] }
            const balances: LeaveBalanceDetails[] =
                (data as unknown as { balances: LeaveBalanceDetails[] })?.balances ||
                [];
            setDetailedBalances(balances);
        } catch (err) {
            console.warn("Could not fetch detailed balances:", err);
            setDetailedBalances([]);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [user, typesRes] = await Promise.all([
                    userService.getById(userId),
                    leaveTypeService.getAll({ limit: 100 }),
                ]);
                setSelectedUser(user);
                setLeaveTypesForModal(typesRes.data?.filter((t: LeaveType) => t.isActive) || []);
                await loadBalances(user);
            } catch (err: unknown) {
                console.error("Failed to load employee:", err);
                const msg = err instanceof Error ? err.message : "Failed to load employee details";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId, loadBalances]);

    const handleSaveOpeningBalance = async () => {
        if (!selectedUser || !modalData.leaveTypeId || modalData.amount <= 0) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            setIsSavingModal(true);
            await leaveService.addOpeningBalance({
                employeeId: selectedUser._id || selectedUser.id,
                leaveType: modalData.leaveTypeId,
                amount: modalData.amount,
                description: modalData.description || 'Opening balance manually added by Admin'
            });
            toast.success("Opening balance added successfully!");
            setIsModalOpen(false);
            setModalData({ leaveTypeId: '', amount: 0, description: '' });
            loadBalances(selectedUser);
        } catch (err) {
            console.error("Failed to add opening balance:", err);
            toast.error("Failed to add opening balance.");
        } finally {
            setIsSavingModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Fetching Balances...</p>
            </div>
        );
    }

    if (error || !selectedUser) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[3rem] border border-dashed border-border/50">
                <div className="w-20 h-20 bg-muted/30 rounded-[2rem] flex items-center justify-center text-foreground-tertiary mb-6 border border-border/50">
                    <UserIcon className="w-10 h-10 opacity-30" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight uppercase">
                    {error ? "Error Loading Employee" : "Employee Not Found"}
                </h3>
                {error && (
                    <p className="text-sm text-foreground-tertiary mt-2 max-w-xs text-center">{error}</p>
                )}
                <Button variant="outline" onClick={() => navigate('/admin/leave-balances')} className="mt-6">Back to All Employees</Button>
            </div>
        );
    }

    // Build modal options from live leave types or fallback to balances
    const modalOptions = leaveTypesForModal.length > 0
        ? leaveTypesForModal.filter(t => t.isPaid).map(t => ({ value: t._id || t.id || t.name, label: t.name }))
        : detailedBalances.filter(b => b.isPaid).map(b => ({ value: b.leaveTypeId || b.code || b.name, label: b.name }));

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/admin/leave-balances')} className="mb-2 -ml-4 hover:bg-muted/50 rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Employees
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* User Card */}
                <div className="lg:col-span-4 gap-6 flex flex-col">
                    <Card className="rounded-xl sm:rounded-xl border-border/50 shadow-2xl overflow-hidden bg-surface relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                        <CardContent className="pt-10 text-center">
                            <Avatar
                                src={selectedUser.personalInfo.profilePicture}
                                firstName={selectedUser.personalInfo.firstName}
                                lastName={selectedUser.personalInfo.lastName}
                                className="w-24 h-24 mx-auto mb-6 shadow-2xl shadow-primary/20 rounded-[2rem]"
                            />
                            <h3 className="text-2xl font-black text-foreground tracking-tight">
                                {selectedUser.personalInfo.firstName} {selectedUser.personalInfo.lastName}
                            </h3>
                            <p className="text-foreground-tertiary text-sm font-bold mt-1">@{selectedUser.username}</p>

                            <div className="mt-8 flex flex-col gap-3">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/30 text-left">
                                    <Briefcase className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Employee ID</p>
                                        <p className="text-sm font-black text-foreground">{selectedUser.employeeId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/30 text-left">
                                    <Calendar className="w-5 h-5 text-accent" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest">Department</p>
                                        <p className="text-sm font-black text-foreground">{selectedUser.employment.department}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Adjustment Form */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="rounded-xl sm:rounded-xl border-border/50 shadow-2xl bg-surface">
                        <CardHeader className="border-b border-border/30 px-8 py-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Employee Balances</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => setIsModalOpen(true)}>+ Add Opening Balance</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border/30">
                                            <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Leave Type</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Code</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Annual Allowance</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Current Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {detailedBalances.length > 0 ? (
                                            detailedBalances.map((type) => {
                                                const current = type.currentBalance ?? 0;
                                                const isUnpaid = !type.isPaid;

                                                return (
                                                    <tr key={type.leaveTypeId || type.code} className="hover:bg-muted/10 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-2 h-2 rounded-full",
                                                                    type.isPaid ? "bg-primary" : "bg-foreground-tertiary"
                                                                )} />
                                                                <span className="font-bold text-foreground text-sm">{type.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 text-center">
                                                            <span className="px-2 py-1 rounded-lg bg-muted text-[10px] font-black uppercase border border-border/50 text-foreground-tertiary">
                                                                {type.code}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6 text-center font-black text-sm text-foreground-tertiary">
                                                            {type.totalAllocated ? `${type.totalAllocated} Days` : "N/A"}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-1">
                                                                        {isUnpaid ? "Information" : "Available"}
                                                                    </span>
                                                                    <div className="relative w-32">
                                                                        {isUnpaid ? (
                                                                            <div className="w-full px-4 py-2 text-right bg-muted/20 border border-border/30 rounded-2xl font-black text-sm text-foreground-tertiary">
                                                                                Unpaid
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full px-4 py-2 text-right bg-muted/20 border border-border/30 rounded-2xl font-black text-sm text-foreground">
                                                                                {current} Days
                                                                                <div className="text-xs text-foreground-tertiary mt-0.5">
                                                                                    {Number((current * (type.workingHoursPerDay || 8)).toFixed(2))} Hours
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-12 text-center text-sm font-bold text-foreground-tertiary">
                                                    No leave balances found for this employee.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isModalOpen && (
                <Modal 
                    open={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    title="Add Opening Balance"
                    actions={
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveOpeningBalance} isLoading={isSavingModal}>Save Balance</Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <FormSelect
                            label="Leave Type"
                            required
                            value={modalData.leaveTypeId}
                            onChange={(val) => setModalData(prev => ({ ...prev, leaveTypeId: val }))}
                            options={modalOptions}
                            placeholder="Select Leave Type"
                        />
                        <Input
                            type="number"
                            label="Amount (Days)"
                            required
                            min={0}
                            value={modalData.amount}
                            onChange={(e) => setModalData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        />
                        <TextArea
                            label="Description (Optional)"
                            value={modalData.description}
                            onChange={(e) => setModalData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
};

const LeaveBalancesList: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersRes, typesRes] = await Promise.all([
                    userService.getAll({ page: 1, limit: 100 }),
                    leaveTypeService.getAll({ limit: 100 })
                ]);
                setUsers(usersRes.users || []);
                setLeaveTypes(typesRes.data?.filter((t: LeaveType) => t.isActive) || []);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load employee list");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase();
        return users.filter((u) => {
            const fullName = `${u.personalInfo.firstName} ${u.personalInfo.lastName}`.toLowerCase();
            const email = (u.personalInfo.email || "").toLowerCase();
            const empId = (u.employeeId || "").toLowerCase();
            const dept = (u.employment?.department || "").toLowerCase();
            return fullName.includes(q) || email.includes(q) || empId.includes(q) || dept.includes(q);
        });
    }, [users, searchQuery]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Loading Employees...</p>
            </div>
        );
    }

    return (
        <Card className="rounded-xl border-border/50 shadow-2xl bg-surface animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="border-b border-border/30 px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-primary" />
                        All Employee Balances
                        <span className="text-sm font-bold text-foreground-tertiary normal-case ml-1">
                            ({filteredUsers.length} / {users.length})
                        </span>
                    </CardTitle>
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary pointer-events-none" />
                        <input
                            id="leave-balance-search"
                            type="text"
                            placeholder="Search by name, email, ID, dept..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-sm font-medium text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/30">
                                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-foreground-tertiary sticky left-0 z-10 bg-muted/80 backdrop-blur-sm">Employee</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">ID / Dept</th>
                                {leaveTypes.map(lt => (
                                    <th key={lt._id || lt.id} className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                                        {lt.code || lt.name}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredUsers.map(user => (
                                <tr 
                                    key={user._id || user.id} 
                                    onClick={() => navigate(`/admin/leave-balances/${user._id || user.id}`)}
                                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-8 py-4 sticky left-0 z-10 bg-surface group-hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar 
                                                src={user.personalInfo.profilePicture}
                                                firstName={user.personalInfo.firstName}
                                                lastName={user.personalInfo.lastName}
                                                size="sm"
                                            />
                                            <div>
                                                <p className="font-bold text-sm text-foreground">
                                                    {user.personalInfo.firstName} {user.personalInfo.lastName}
                                                </p>
                                                <p className="text-xs text-foreground-tertiary">{user.personalInfo.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-sm text-foreground">{user.employeeId}</p>
                                        <p className="text-xs text-foreground-tertiary">{user.employment?.department}</p>
                                    </td>
                                    {leaveTypes.map(lt => {
                                        const canonicalName = lt.name;
                                        const balances = user.leaveBalance as Record<string, number> | undefined;
                                        const val = balances ? balances[canonicalName] : undefined;
                                        const isUnpaid = !lt.isPaid;
                                        
                                        return (
                                            <td key={lt._id || lt.id} className="px-6 py-4 text-center">
                                                {isUnpaid ? (
                                                    <span className="text-xs text-foreground-tertiary">—</span>
                                                ) : val !== undefined ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-1 rounded-md">
                                                            {val}
                                                        </span>
                                                        <span className="text-[10px] text-foreground-tertiary mt-1">
                                                            {Number((val * (lt.workingHoursPerDay || 8)).toFixed(2))}h
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-foreground-tertiary">0</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-primary underline underline-offset-2 group-hover:opacity-80 transition-opacity">
                                            Manage →
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={leaveTypes.length + 3} className="px-8 py-12 text-center text-sm font-bold text-foreground-tertiary">
                                        {searchQuery ? `No employees match "${searchQuery}"` : "No active employees found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const LeaveBalances: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();

    return (
        <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6 pb-12">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Leave Balances</h1>
                <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Manage and view employee leave quotas.
                </p>
            </div>

            {userId ? <LeaveBalancesDetail userId={userId} /> : <LeaveBalancesList />}
        </div>
    );
};

export default LeaveBalances;
