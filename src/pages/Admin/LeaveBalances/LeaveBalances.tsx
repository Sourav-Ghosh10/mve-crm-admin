import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User as UserIcon, Calendar, Briefcase, ArrowLeft, Search, X, Edit2 } from "lucide-react";
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

    // Modal state for Add Opening Balance
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{
        leaveTypeId: string;
        amount: string | number;
        hours: string | number;
        recordedDate: string;
        description: string;
    }>({ leaveTypeId: '', amount: '', hours: '', recordedDate: new Date().toISOString().split("T")[0], description: '' });
    const [isSavingModal, setIsSavingModal] = useState(false);

    // Dynamic Accrual Preview state for Add Opening Balance
    interface AccrualPreview {
        isSameDate: boolean;
        accruedDays: number;
        accruedHours: number;
        workingDays: number;
        eligibleHours: number;
        approvedUsed: number;
        fromDate: string;
        toDate: string;
    }
    const [accrualPreview, setAccrualPreview] = useState<AccrualPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const formatPreviewDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [, m, d] = parts.map(Number);
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return `${d} ${monthNames[m - 1]}`;
        }
        return dateStr;
    };

    // Modal state for Adjust Balance
    const [adjustModal, setAdjustModal] = useState<{
        isOpen: boolean;
        leaveType: LeaveBalanceDetails | null;
        days: string | number;
        hours: string | number;
        recordedDate: string;
    }>({ isOpen: false, leaveType: null, days: '', hours: '', recordedDate: new Date().toISOString().split("T")[0] });
    const [isSavingAdjust, setIsSavingAdjust] = useState(false);
    const [adjustAccrualPreview, setAdjustAccrualPreview] = useState<AccrualPreview | null>(null);
    const [isLoadingAdjustPreview, setIsLoadingAdjustPreview] = useState(false);

    const getWorkingHoursPerDay = useCallback((leaveTypeId: string) => {
        if (!leaveTypeId) return 8;
        const lt = leaveTypesForModal.find(t => (t._id || t.id || t.name) === leaveTypeId)
            || detailedBalances.find(b => (b.leaveTypeId || b.code || b.name) === leaveTypeId);
        return (lt && 'workingHoursPerDay' in lt && lt.workingHoursPerDay) ? lt.workingHoursPerDay : 8;
    }, [leaveTypesForModal, detailedBalances]);

    const handleLeaveTypeChange = (val: string) => {
        const rate = getWorkingHoursPerDay(val);
        setModalData(prev => {
            let newHours = prev.hours;
            if (prev.amount !== '' && !isNaN(Number(prev.amount))) {
                const daysNum = Number(prev.amount);
                newHours = Number((daysNum * rate).toFixed(2));
            }
            return {
                ...prev,
                leaveTypeId: val,
                hours: newHours
            };
        });
    };

    const handleDaysChange = (val: string) => {
        const rate = getWorkingHoursPerDay(modalData.leaveTypeId);
        if (val === '') {
            setModalData(prev => ({ ...prev, amount: '', hours: '' }));
            return;
        }
        const days = parseFloat(val);
        const hrs = !isNaN(days) ? Number((days * rate).toFixed(2)) : '';
        setModalData(prev => ({ ...prev, amount: val, hours: hrs }));
    };

    const handleHoursChange = (val: string) => {
        const rate = getWorkingHoursPerDay(modalData.leaveTypeId);
        if (val === '') {
            setModalData(prev => ({ ...prev, amount: '', hours: '' }));
            return;
        }
        const hrs = parseFloat(val);
        const days = !isNaN(hrs) && rate > 0 ? Number((hrs / rate).toFixed(4)) : '';
        setModalData(prev => ({ ...prev, hours: val, amount: days }));
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setAccrualPreview(null);
        setIsLoadingPreview(false);
        setModalData({ leaveTypeId: '', amount: '', hours: '', recordedDate: new Date().toISOString().split("T")[0], description: '' });
    };

    const handleOpenAdjustModal = (type: LeaveBalanceDetails) => {
        const rate = type.workingHoursPerDay || 8;
        const userBal = selectedUser?.leaveBalance?.[type.name];
        const currDays = (type.currentBalance !== null && type.currentBalance !== undefined && type.currentBalance !== 0)
            ? type.currentBalance
            : (userBal !== undefined && userBal !== null)
                ? userBal
                : (type.currentBalance ?? (type as any).available ?? (type.totalAllocated ?? 0));
        const numDays = Number(currDays) || 0;
        const currHours = Number((numDays * rate).toFixed(2));
        setAdjustModal({
            isOpen: true,
            leaveType: type,
            days: Number(numDays.toFixed(4)),
            hours: currHours,
            recordedDate: new Date().toISOString().split("T")[0]
        });
        setAdjustAccrualPreview(null);
        setIsLoadingAdjustPreview(false);
    };

    const handleSaveAdjust = async () => {
        if (!selectedUser || !adjustModal.leaveType) return;
        const numDays = typeof adjustModal.days === 'string' ? parseFloat(adjustModal.days) : adjustModal.days;
        if (isNaN(numDays) || numDays < 0) {
            toast.error("Please enter a valid balance amount (0 or greater)");
            return;
        }
        if (!adjustModal.recordedDate) {
            toast.error("Please select the date when the balance was recorded");
            return;
        }
        try {
            setIsSavingAdjust(true);
            const uid = selectedUser._id || selectedUser.id;
            const leaveTypeName = adjustModal.leaveType.name;
            const leaveTypeId = adjustModal.leaveType.leaveTypeId || adjustModal.leaveType.code || leaveTypeName;

            const res = await leaveService.addOpeningBalance({
                employeeId: uid,
                leaveType: leaveTypeId,
                amount: numDays,
                recordedDate: adjustModal.recordedDate,
                description: `Balance adjusted to ${numDays} days as of ${adjustModal.recordedDate} by Admin`
            });

            if (res?.accruedAmount && res.accruedAmount > 0) {
                toast.success(`Balance for ${leaveTypeName} updated to ${res.newBalance} days (${Number((res.newBalance * (adjustModal.leaveType.workingHoursPerDay || 8)).toFixed(2))} hours)! (Includes +${res.accruedAmount}d accrued)`);
            } else {
                toast.success(`Balance for ${leaveTypeName} updated to ${numDays} days (${Number((numDays * (adjustModal.leaveType.workingHoursPerDay || 8)).toFixed(2))} hours)!`);
            }
            setAdjustModal({ isOpen: false, leaveType: null, days: '', hours: '', recordedDate: new Date().toISOString().split("T")[0] });
            setAdjustAccrualPreview(null);
            setIsLoadingAdjustPreview(false);
            await loadBalances(selectedUser);
        } catch (err) {
            console.error("Failed to update balance:", err);
            toast.error("Failed to update leave balance.");
        } finally {
            setIsSavingAdjust(false);
        }
    };

    const loadBalances = useCallback(async (user: User) => {
        try {
            const uid = user._id || user.id;
            const [data, freshUser] = await Promise.all([
                leaveService.getEmployeeBalance(uid).catch(() => null),
                userService.getById(uid).catch(() => null)
            ]);
            if (freshUser) {
                setSelectedUser(freshUser);
            }
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
        const numericAmount = typeof modalData.amount === 'string' ? parseFloat(modalData.amount) : modalData.amount;
        if (!selectedUser || !modalData.leaveTypeId || isNaN(numericAmount) || numericAmount < 0) {
            toast.error("Please fill in all required fields with a valid amount (0 or greater)");
            return;
        }
        if (!modalData.recordedDate) {
            toast.error("Please select the date when the balance was recorded");
            return;
        }
        try {
            setIsSavingModal(true);
            const uid = selectedUser._id || selectedUser.id;

            const res = await leaveService.addOpeningBalance({
                employeeId: uid,
                leaveType: modalData.leaveTypeId,
                amount: numericAmount,
                recordedDate: modalData.recordedDate,
                description: modalData.description || 'Opening balance manually added by Admin'
            });

            if (res?.accruedAmount && res.accruedAmount > 0) {
                toast.success(`Opening balance saved! Added ${res.accruedAmount} days of eligible accrued leave.`);
            } else {
                toast.success("Opening balance updated successfully!");
            }
            setIsModalOpen(false);
            setAccrualPreview(null);
            setIsLoadingPreview(false);
            setModalData({ leaveTypeId: '', amount: '', hours: '', recordedDate: new Date().toISOString().split("T")[0], description: '' });
            await loadBalances(selectedUser);
        } catch (err) {
            console.error("Failed to add opening balance:", err);
            toast.error("Failed to add opening balance.");
        } finally {
            setIsSavingModal(false);
        }
    };

    // Automatically calculate dynamic accrual preview whenever recordedDate or leaveType changes
    useEffect(() => {
        if (!isModalOpen) {
            setAccrualPreview(null);
            setIsLoadingPreview(false);
            return;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const recDate = modalData.recordedDate;
        const uid = selectedUser?._id || selectedUser?.id;

        // If date is same or empty or in future, or leave type not selected yet: no need to calculate
        if (!recDate || recDate === todayStr || recDate > todayStr || !modalData.leaveTypeId || !uid) {
            setAccrualPreview(null);
            setIsLoadingPreview(false);
            return;
        }

        let isMounted = true;
        const fetchPreview = async () => {
            try {
                setIsLoadingPreview(true);
                const data = await leaveService.getOpeningBalancePreview({
                    employeeId: uid,
                    leaveTypeId: modalData.leaveTypeId,
                    recordedDate: recDate
                });
                if (isMounted) {
                    setAccrualPreview(data);
                }
            } catch (err) {
                console.warn("Failed to fetch balance preview:", err);
                if (isMounted) {
                    setAccrualPreview(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingPreview(false);
                }
            }
        };

        const timer = setTimeout(fetchPreview, 150);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [isModalOpen, modalData.recordedDate, modalData.leaveTypeId, selectedUser]);

    // Automatically calculate dynamic accrual preview whenever recordedDate changes in Adjust modal
    useEffect(() => {
        if (!adjustModal.isOpen || !adjustModal.leaveType) {
            setAdjustAccrualPreview(null);
            setIsLoadingAdjustPreview(false);
            return;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const recDate = adjustModal.recordedDate;
        const uid = selectedUser?._id || selectedUser?.id;
        const leaveTypeId = adjustModal.leaveType.leaveTypeId || adjustModal.leaveType.code || adjustModal.leaveType.name;

        // If date is same or empty or in future, or leave type / uid missing: no need to calculate
        if (!recDate || recDate === todayStr || recDate > todayStr || !leaveTypeId || !uid) {
            setAdjustAccrualPreview(null);
            setIsLoadingAdjustPreview(false);
            return;
        }

        let isMounted = true;
        const fetchPreview = async () => {
            try {
                setIsLoadingAdjustPreview(true);
                const data = await leaveService.getOpeningBalancePreview({
                    employeeId: uid,
                    leaveTypeId: leaveTypeId,
                    recordedDate: recDate
                });
                if (isMounted) {
                    setAdjustAccrualPreview(data);
                }
            } catch (err) {
                console.warn("Failed to fetch adjust balance preview:", err);
                if (isMounted) {
                    setAdjustAccrualPreview(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingAdjustPreview(false);
                }
            }
        };

        const timer = setTimeout(fetchPreview, 150);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [adjustModal.isOpen, adjustModal.recordedDate, adjustModal.leaveType, selectedUser]);

    // Dynamic calculation for Total Leave Balance (opening balance + accrued leave)
    const modalRate = getWorkingHoursPerDay(modalData.leaveTypeId);
    const numOpeningDays = (modalData.amount !== '' && !isNaN(Number(modalData.amount))) ? Number(modalData.amount) : 0;
    const numOpeningHours = (modalData.hours !== '' && !isNaN(Number(modalData.hours))) 
        ? Number(modalData.hours) 
        : (modalRate > 0 ? Number((numOpeningDays * modalRate).toFixed(2)) : 0);
    const accruedDays = (accrualPreview && !accrualPreview.isSameDate) ? (accrualPreview.accruedDays || 0) : 0;
    const accruedHours = (accrualPreview && !accrualPreview.isSameDate) ? (accrualPreview.accruedHours || 0) : 0;
    const totalDays = Number((numOpeningDays + accruedDays).toFixed(4));
    const totalHours = Number((numOpeningHours + accruedHours).toFixed(2));

    // Dynamic calculation for Adjust Modal Total Leave Balance (opening balance + accrued leave)
    const adjustRate = adjustModal.leaveType?.workingHoursPerDay || 8;
    const adjustOpeningDays = (adjustModal.days !== '' && !isNaN(Number(adjustModal.days))) ? Number(adjustModal.days) : 0;
    const adjustOpeningHours = (adjustModal.hours !== '' && !isNaN(Number(adjustModal.hours)))
        ? Number(adjustModal.hours)
        : (adjustRate > 0 ? Number((adjustOpeningDays * adjustRate).toFixed(2)) : 0);
    const adjustAccruedDays = (adjustAccrualPreview && !adjustAccrualPreview.isSameDate) ? (adjustAccrualPreview.accruedDays || 0) : 0;
    const adjustAccruedHours = (adjustAccrualPreview && !adjustAccrualPreview.isSameDate) ? (adjustAccrualPreview.accruedHours || 0) : 0;
    const adjustTotalDays = Number((adjustOpeningDays + adjustAccruedDays).toFixed(4));
    const adjustTotalHours = Number((adjustOpeningHours + adjustAccruedHours).toFixed(2));

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
                            <Button size="sm" onClick={handleOpenModal}>+ Add Opening Balance</Button>
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
                                                const userBal = selectedUser?.leaveBalance?.[type.name];
                                                const current = (type.currentBalance !== null && type.currentBalance !== undefined && type.currentBalance !== 0)
                                                    ? type.currentBalance
                                                    : (userBal !== undefined && userBal !== null)
                                                        ? userBal
                                                        : (type.currentBalance ?? (type as any).available ?? (type.totalAllocated ?? 0));
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
                                                            {type.totalAllocated ? `${Number(Number(type.totalAllocated).toFixed(2))} Days` : "N/A"}
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
                                                                                {Number(Number(current).toFixed(2))} Days
                                                                                <div className="text-xs text-foreground-tertiary mt-0.5">
                                                                                    {Number((Number(current) * (type.workingHoursPerDay || 8)).toFixed(2))} Hours
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {!isUnpaid && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleOpenAdjustModal(type)}
                                                                        className="h-9 px-3 text-xs flex items-center gap-1.5 rounded-xl border-border/60 hover:border-primary/50 hover:bg-primary/5 shadow-none"
                                                                        title="Adjust or set balance"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5 text-primary" />
                                                                        <span>Adjust</span>
                                                                    </Button>
                                                                )}
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

            {/* Add Opening Balance Modal */}
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
                            onChange={handleLeaveTypeChange}
                            options={modalOptions}
                            placeholder="Select Leave Type"
                        />
                        <Input
                            type="date"
                            label="Recorded Date"
                            required
                            value={modalData.recordedDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setModalData(prev => ({ ...prev, recordedDate: e.target.value }))}
                            helperText="Date when balance was recorded in previous HRM system"
                        />

                        {/* Dynamic Accrued Leave Preview */}
                        {isLoadingPreview && (
                            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-2.5 text-xs text-primary animate-pulse">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                                <span className="font-semibold">Calculating eligible leave accrued from {formatPreviewDate(modalData.recordedDate)} to {formatPreviewDate(new Date().toISOString().split("T")[0])}...</span>
                            </div>
                        )}

                        {!isLoadingPreview && accrualPreview && !accrualPreview.isSameDate && (
                            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 transition-all">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-xs font-bold text-foreground">
                                            Leave balance from <span className="text-primary font-black">{formatPreviewDate(accrualPreview.fromDate)}</span> to <span className="text-primary font-black">{formatPreviewDate(accrualPreview.toDate)}</span>
                                        </span>
                                    </div>
                                    <span className="shrink-0 whitespace-nowrap text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                                        +{accrualPreview.accruedDays} Days ({accrualPreview.accruedHours}h)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-foreground-tertiary pt-1.5 border-t border-border/40">
                                    <span>
                                        Accrued across <strong className="text-foreground font-semibold">{accrualPreview.workingDays} working days</strong> ({accrualPreview.eligibleHours}h eligible) under leave policy
                                    </span>
                                    {accrualPreview.approvedUsed > 0 && (
                                        <span className="text-amber-600 font-semibold shrink-0 ml-2">
                                            -{accrualPreview.approvedUsed}d approved
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                type="number"
                                step="any"
                                label="Amount (Days)"
                                required
                                min={0}
                                value={modalData.amount}
                                onChange={(e) => handleDaysChange(e.target.value)}
                                placeholder="0"
                            />
                            <Input
                                type="number"
                                step="any"
                                label="Amount (Hours)"
                                min={0}
                                value={modalData.hours}
                                onChange={(e) => handleHoursChange(e.target.value)}
                                placeholder="0"
                                helperText={`1 Day = ${getWorkingHoursPerDay(modalData.leaveTypeId)} Hours`}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs rounded-xl"
                                onClick={() => {
                                    setModalData(prev => ({ ...prev, amount: 0, hours: 0 }));
                                }}
                            >
                                ⚡ Set to 0 Hours (0 Days)
                            </Button>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <label className="block text-[10px] sm:text-[11px] font-black text-foreground-tertiary uppercase tracking-widest">
                                    Total Leave Balance
                                </label>
                                {accrualPreview && !accrualPreview.isSameDate && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                        Opening + Accrued
                                    </span>
                                )}
                            </div>
                            <div className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3.5 border border-border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md flex items-center justify-between">
                                <span className="text-sm font-black text-foreground">
                                    {totalDays} Days ({totalHours} Hours)
                                </span>
                                <span className="text-[11px] font-semibold text-foreground-tertiary">
                                    1 Day = {modalRate} Hours
                                </span>
                            </div>
                            <p className="text-[10px] text-foreground-tertiary mt-1.5 px-1">
                                {accrualPreview && !accrualPreview.isSameDate
                                    ? `Includes ${numOpeningHours}h opening balance + ${accruedHours}h accrued leave`
                                    : `Total calculated balance (1 Day = ${modalRate} Hours)`}
                            </p>
                        </div>
                        <TextArea
                            label="Description (Optional)"
                            value={modalData.description}
                            onChange={(e) => setModalData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            placeholder="e.g. Initial balance"
                        />
                    </div>
                </Modal>
            )}

            {/* Adjust Balance Modal */}
            {adjustModal.isOpen && adjustModal.leaveType && (
                <Modal
                    open={adjustModal.isOpen}
                    onClose={() => {
                        setAdjustModal({ isOpen: false, leaveType: null, days: '', hours: '', recordedDate: new Date().toISOString().split("T")[0] });
                        setAdjustAccrualPreview(null);
                        setIsLoadingAdjustPreview(false);
                    }}
                    title={`Adjust Balance: ${adjustModal.leaveType.name}`}
                    actions={
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="outline" onClick={() => {
                                setAdjustModal({ isOpen: false, leaveType: null, days: '', hours: '', recordedDate: new Date().toISOString().split("T")[0] });
                                setAdjustAccrualPreview(null);
                                setIsLoadingAdjustPreview(false);
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveAdjust} isLoading={isSavingAdjust}>
                                Update Balance
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block">Leave Type</span>
                                <span className="text-sm font-black text-foreground">{adjustModal.leaveType.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest block">Current Balance</span>
                                <span className="text-sm font-bold text-foreground">
                                    {Number(Number(adjustModal.leaveType.currentBalance ?? 0).toFixed(2))} Days ({Number(((adjustModal.leaveType.currentBalance ?? 0) * (adjustModal.leaveType.workingHoursPerDay || 8)).toFixed(2))}h)
                                </span>
                            </div>
                        </div>

                        <Input
                            type="date"
                            label="Recorded Date"
                            required
                            value={adjustModal.recordedDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setAdjustModal(prev => ({ ...prev, recordedDate: e.target.value }))}
                            helperText="Date when balance was recorded in previous HRM system"
                        />

                        {/* Dynamic Accrued Leave Preview */}
                        {isLoadingAdjustPreview && (
                            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-2.5 text-xs text-primary animate-pulse">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                                <span className="font-semibold">Calculating eligible leave accrued from {formatPreviewDate(adjustModal.recordedDate)} to {formatPreviewDate(new Date().toISOString().split("T")[0])}...</span>
                            </div>
                        )}

                        {!isLoadingAdjustPreview && adjustAccrualPreview && !adjustAccrualPreview.isSameDate && (
                            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 transition-all">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-xs font-bold text-foreground">
                                            Leave balance from <span className="text-primary font-black">{formatPreviewDate(adjustAccrualPreview.fromDate)}</span> to <span className="text-primary font-black">{formatPreviewDate(adjustAccrualPreview.toDate)}</span>
                                        </span>
                                    </div>
                                    <span className="shrink-0 whitespace-nowrap text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                                        +{adjustAccrualPreview.accruedDays} Days ({adjustAccrualPreview.accruedHours}h)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-foreground-tertiary pt-1.5 border-t border-border/40">
                                    <span>
                                        Accrued across <strong className="text-foreground font-semibold">{adjustAccrualPreview.workingDays} working days</strong> ({adjustAccrualPreview.eligibleHours}h eligible) under leave policy
                                    </span>
                                    {adjustAccrualPreview.approvedUsed > 0 && (
                                        <span className="text-amber-600 font-semibold shrink-0 ml-2">
                                            -{adjustAccrualPreview.approvedUsed}d approved
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                type="number"
                                step="any"
                                label="New Balance (Days)"
                                required
                                min={0}
                                value={adjustModal.days}
                                onChange={(e) => {
                                    const rate = adjustModal.leaveType?.workingHoursPerDay || 8;
                                    const val = e.target.value;
                                    if (val === '') {
                                        setAdjustModal(prev => ({ ...prev, days: '', hours: '' }));
                                    } else {
                                        const d = parseFloat(val);
                                        setAdjustModal(prev => ({
                                            ...prev,
                                            days: val,
                                            hours: !isNaN(d) ? Number((d * rate).toFixed(2)) : ''
                                        }));
                                    }
                                }}
                                placeholder="0"
                            />
                            <Input
                                type="number"
                                step="any"
                                label="New Balance (Hours)"
                                required
                                min={0}
                                value={adjustModal.hours}
                                onChange={(e) => {
                                    const rate = adjustModal.leaveType?.workingHoursPerDay || 8;
                                    const val = e.target.value;
                                    if (val === '') {
                                        setAdjustModal(prev => ({ ...prev, days: '', hours: '' }));
                                    } else {
                                        const h = parseFloat(val);
                                        setAdjustModal(prev => ({
                                            ...prev,
                                            hours: val,
                                            days: !isNaN(h) && rate > 0 ? Number((h / rate).toFixed(4)) : ''
                                        }));
                                    }
                                }}
                                placeholder="0"
                                helperText={`1 Day = ${adjustModal.leaveType.workingHoursPerDay || 8} Hours`}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs rounded-xl"
                                onClick={() => {
                                    setAdjustModal(prev => ({ ...prev, days: 0, hours: 0 }));
                                }}
                            >
                                ⚡ Set to 0 Hours (0 Days)
                            </Button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <label className="block text-[10px] sm:text-[11px] font-black text-foreground-tertiary uppercase tracking-widest">
                                    Total Leave Balance
                                </label>
                                {adjustAccrualPreview && !adjustAccrualPreview.isSameDate && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                        Opening + Accrued
                                    </span>
                                )}
                            </div>
                            <div className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3.5 border border-border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md flex items-center justify-between">
                                <span className="text-sm font-black text-foreground">
                                    {adjustTotalDays} Days ({adjustTotalHours} Hours)
                                </span>
                                <span className="text-[11px] font-semibold text-foreground-tertiary">
                                    1 Day = {adjustRate} Hours
                                </span>
                            </div>
                            <p className="text-[10px] text-foreground-tertiary mt-1.5 px-1">
                                {adjustAccrualPreview && !adjustAccrualPreview.isSameDate
                                    ? `Includes ${adjustOpeningHours}h opening balance + ${adjustAccruedHours}h accrued leave`
                                    : `Total calculated balance (1 Day = ${adjustRate} Hours)`}
                            </p>
                        </div>
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
                                                            {Number(Number(val).toFixed(2))}
                                                        </span>
                                                        <span className="text-[10px] text-foreground-tertiary mt-1">
                                                            {Number((Number(val) * (lt.workingHoursPerDay || 8)).toFixed(2))}h
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
