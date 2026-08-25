import React, { useState, useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    User,
    Mail,
    Globe,
    Clock,
    DollarSign,
    TrendingUp,
    Calendar,
    ChevronRight,
    // ChevronLeft,
    Users,
    Check,
    UserPlus
} from "lucide-react";
import Input from "../../../components/common/Input";
import PhoneInput from "../../../components/common/Input/PhoneInput";
import Button from "../../../components/common/Button";
import { Currency, type Client } from "../../../types/client.types";
import { cn } from "../../../lib/utils";
import FormError from "../../../components/common/FormError/FormError";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";
import { userService } from "../../../services/userService";
import type { User as UserType } from "../../../types/user.types";
import Avatar from "../../../components/common/Avatar";
import { toast } from "react-hot-toast";

const schema = yup.object({
    name: yup.string().required("Client name is required").trim().max(100, "Client name cannot exceed 100 characters"),
    primary_contact: yup.object({
        name: yup.string().trim().required("Contact name is required").max(50, "Contact name cannot exceed 50 characters"),
        email: yup.string().trim().email("Invalid email format").required("Email is required").matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email (e.g. user@domain.com)").max(50, "Email cannot exceed 50 characters"),
        phone: yup.string().trim().required("Phone is required").min(10, "Phone number must be at least 10 digits").max(15, "Phone cannot exceed 15 digits"),
    }),
    city: yup.string().required("City is required").trim().max(50, "City cannot exceed 50 characters"),
    timezone: yup.string().required("Timezone is required").trim().max(50, "Timezone cannot exceed 50 characters"),
    billing_rate: yup.number().positive("Rate must be positive").max(10000, "Rate cannot exceed 10,000").required("Rate is required"),
    currency: yup.mixed<Currency>().oneOf(Object.values(Currency)).required("Currency is required"),
    internal_expense_inr: yup.number().positive("Expense must be positive").max(1000000, "Expense cannot exceed 1,000,000").required("Internal expense is required"),
    referral_source: yup.string().optional().trim().max(100, "Referral source cannot exceed 100 characters"),
    discovery_source: yup.string().optional().trim().max(100, "Source cannot exceed 100 characters"),
    onboarding_date: yup.string().required("Onboarding date is required"),
    is_active: yup.boolean().default(true),
    communication_preference: yup.string().oneOf(['email', 'whatsapp', 'both']).default('email').required("Preference is required"),
    portalAccess: yup.object({
        enabled: yup.boolean().default(false),
        primaryContactUserId: yup.string().optional().nullable(),
    }).optional(),
});

type ClientFormData = yup.InferType<typeof schema>;

interface ClientCreationWizardProps {
    initialValues?: Partial<Client>;
    onSubmit: (data: ClientFormData & { assigned_employees: string[] }) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
    onClearError?: () => void;
}

const STEPS = [
    { id: 'basic', title: 'Identity', icon: Building2 },
    { id: 'financials', title: 'Financials', icon: DollarSign },
    { id: 'marketing', title: 'Intelligence', icon: TrendingUp },
    { id: 'team', title: 'Team', icon: Users },
];

const ClientCreationWizard: React.FC<ClientCreationWizardProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
    onClearError
}) => {
    const [step, setStep] = useState(0);
    const [employees, setEmployees] = useState<UserType[]>([]);
    const [clientUsers, setClientUsers] = useState<UserType[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>(() => {
        const assigned = initialValues?.assigned_employees;
        if (!assigned) return [];
        return assigned.map((emp) => {
            if (typeof emp === 'string') return emp;
            const e = emp as { id?: string; _id?: string };
            return e.id || e._id || String(emp);
        });
    });
    const [portalAccessEnabled, setPortalAccessEnabled] = useState(() => {
        return initialValues?.portalAccess?.enabled || false;
    });
    const [selectedClientUser, setSelectedClientUser] = useState<string>(() => {
        const userId = initialValues?.portalAccess?.primaryContactUserId;
        // Handle both populated user object and plain ID string
        if (userId && typeof userId === 'object') {
            const u = userId as { _id?: string; id?: string };
            return u._id || u.id || '';
        }
        return (userId as string) || '';
    });
    const [searchEmp, setSearchEmp] = useState("");
    const [searchClientUser, setSearchClientUser] = useState("");
    
    // Pagination state
    const [empPage, setEmpPage] = useState(1);
    const [hasMoreEmployees, setHasMoreEmployees] = useState(true);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
    
    const [clientUserPage, setClientUserPage] = useState(1);
    const [hasMoreClientUsers, setHasMoreClientUsers] = useState(true);
    const [isClientUsersLoading, setIsClientUsersLoading] = useState(false);

    const { control, handleSubmit, trigger, watch, formState: { errors } } = useForm<ClientFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<ClientFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            primary_contact: {
                name: initialValues?.primary_contact?.name || "",
                email: initialValues?.primary_contact?.email || "",
                phone: initialValues?.primary_contact?.phone || "",
            },
            city: initialValues?.city || "",
            timezone: initialValues?.timezone || "UTC",
            billing_rate: initialValues?.billing_rate || 0,
            currency: initialValues?.currency || Currency.USD,
            internal_expense_inr: initialValues?.internal_expense_inr || 0,
            referral_source: initialValues?.referral_source || "",
            discovery_source: initialValues?.discovery_source || "",
            onboarding_date: initialValues?.onboarding_date ? initialValues.onboarding_date.split('T')[0] : new Date().toISOString().split('T')[0],
            is_active: initialValues?.is_active ?? true,
            communication_preference: initialValues?.communication_preference || 'email',
            portalAccess: {
                enabled: initialValues?.portalAccess?.enabled || false,
                primaryContactUserId: (() => {
                    const userId = initialValues?.portalAccess?.primaryContactUserId;
                    // Extract ID if it's a populated user object
                    if (userId && typeof userId === 'object') {
                        const u = userId as { _id?: string; id?: string };
                        return u._id || u.id || null;
                    }
                    return (userId as string) || null;
                })(),
            },
        },
    });

    useEffect(() => {
        if (!error || !onClearError) return;
        const subscription = watch(() => onClearError());
        return () => subscription.unsubscribe();
    }, [error, onClearError, watch]);

    const navigate = useNavigate();
    const { isSuperAdmin, hasPermission: canCreateUser } = usePermissions(PERMISSIONS.EMPLOYEE_CREATE);

    const fetchEmployees = async (pageNum: number, search: string, isLoadMore = false) => {
        try {
            setIsEmployeesLoading(true);
            const res = await userService.getAll({ 
                limit: 20, 
                page: pageNum, 
                search: search || undefined,
                isActive: true 
            });
            if (isLoadMore) {
                setEmployees(prev => [...prev, ...res.users]);
            } else {
                setEmployees(res.users);
            }
            setHasMoreEmployees(res.page < res.totalPages);
            setEmpPage(res.page);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        } finally {
            setIsEmployeesLoading(false);
        }
    };

    const fetchClientUsers = async (pageNum: number, search: string, isLoadMore = false) => {
        try {
            setIsClientUsersLoading(true);
            const res = await userService.getAll({ 
                limit: 20, 
                page: pageNum, 
                search: search || undefined,
                role: 'Client',
                isActive: true 
            });
            if (isLoadMore) {
                setClientUsers(prev => [...prev, ...res.users]);
            } else {
                setClientUsers(res.users);
            }
            setHasMoreClientUsers(res.page < res.totalPages);
            setClientUserPage(res.page);
        } catch (err) {
            console.error("Failed to fetch client users", err);
        } finally {
            setIsClientUsersLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchEmployees(1, "");
        fetchClientUsers(1, "");
    }, []);

    // Debounced search for employees
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees(1, searchEmp);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchEmp]);

    // Debounced search for client users
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClientUsers(1, searchClientUser);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchClientUser]);

    const nextStep = async () => {
        let fieldsToValidate: (keyof ClientFormData | string)[] = [];
        if (step === 0) fieldsToValidate = ['name', 'primary_contact', 'city', 'timezone'];
        if (step === 1) fieldsToValidate = ['billing_rate', 'currency', 'internal_expense_inr'];
        if (step === 2) fieldsToValidate = ['referral_source', 'onboarding_date', 'communication_preference'];

        const isValid = await trigger(fieldsToValidate as (keyof ClientFormData)[]);
        if (isValid) setStep(s => Math.min(s + 1, STEPS.length - 1));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const handleFinalSubmit = () => {
        if (portalAccessEnabled && !selectedClientUser) {
            toast.error("Please select a client account to enable portal access.");
            return;
        }

        handleSubmit(
            (data: ClientFormData) => {
                const submitData = {
                    ...data,
                    assigned_employees: selectedEmployees,
                    portalAccess: portalAccessEnabled
                        ? {
                            enabled: true,
                            primaryContactUserId: selectedClientUser,
                        }
                        : {
                            enabled: false,
                            primaryContactUserId: null,
                        },
                };

                onSubmit(submitData as ClientFormData & { assigned_employees: string[] });
            },
            (errors) => {
                console.log("FORM ERRORS", errors);
            }
        )();
    };

    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col h-full -mt-2">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-8 px-2">
                {STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = step === idx;
                    const isCompleted = step > idx;
                    return (
                        <div key={s.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-2 relative">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                                    isActive ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" :
                                        isCompleted ? "bg-success/10 border-success/30 text-success" :
                                            "bg-muted border-border text-foreground-tertiary"
                                )}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest absolute -bottom-6 w-max",
                                    isActive ? "text-primary" : "text-foreground-tertiary"
                                )}>
                                    {s.title}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={cn(
                                    "h-0.5 flex-1 mx-4 rounded-full transition-colors",
                                    isCompleted ? "bg-success/30" : "bg-border"
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="space-y-6 pt-6">
                <FormError message={error} />

                {step === 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Client Corporation Name"
                                    required
                                    placeholder="e.g. Cyberdyne Systems"
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    startAdornment={<Building2 className="w-4 h-4" />}
                                    maxLength={100}
                                />
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                                name="primary_contact.name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Primary Contact Name"
                                        required
                                        placeholder="e.g. John Doe"
                                        error={!!errors.primary_contact?.name}
                                        helperText={errors.primary_contact?.name?.message}
                                        startAdornment={<User className="w-4 h-4" />}
                                        maxLength={50}
                                    />
                                )}
                            />
                            <Controller
                                name="primary_contact.email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value.trim().toLowerCase())}
                                        label="Contact Email"
                                        required
                                        placeholder="john@example.com"
                                        error={!!errors.primary_contact?.email}
                                        helperText={errors.primary_contact?.email?.message}
                                        startAdornment={<Mail className="w-4 h-4" />}
                                        maxLength={50}
                                    />
                                )}
                            />
                            <Controller
                                name="primary_contact.phone"
                                control={control}
                                render={({ field }) => (
                                    <PhoneInput
                                        {...field}
                                        label="Contact Phone"
                                        required
                                        placeholder="000 000 0000"
                                        error={!!errors.primary_contact?.phone}
                                        helperText={errors.primary_contact?.phone?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="city"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Primary Location (City)"
                                        required
                                        placeholder="e.g. San Francisco"
                                        error={!!errors.city}
                                        helperText={errors.city?.message}
                                        startAdornment={<Globe className="w-4 h-4" />}
                                        maxLength={50}
                                    />
                                )}
                            />
                        </div>
                        <Controller
                            name="timezone"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Account Timezone"
                                    required
                                    placeholder="e.g. America/Los_Angeles"
                                    error={!!errors.timezone}
                                    helperText={errors.timezone?.message}
                                    startAdornment={<Clock className="w-4 h-4" />}
                                    maxLength={50}
                                />
                            )}
                        />
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3 mb-4">
                            <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-black uppercase text-primary tracking-widest">Confidential Billing Data</h4>
                                <p className="text-[10px] text-foreground-tertiary">
                                    {isSuperAdmin ? "Only visible to Head of Department and Finance teams." : "ACCESS RESTRICTED: Contact HD for modifications."}
                                </p>
                            </div>
                        </div>
                        {isSuperAdmin ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Controller
                                        name="billing_rate"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                label="Standard Billing Rate"
                                                required
                                                placeholder="0.00"
                                                error={!!errors.billing_rate}
                                                helperText={errors.billing_rate?.message}
                                                startAdornment={<DollarSign className="w-4 h-4" />}
                                                min={1}
                                                max={10000}
                                                onInput={(e) => {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val.length > 8) (e.target as HTMLInputElement).value = val.slice(0, 8);
                                                }}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="currency"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-foreground-tertiary uppercase tracking-widest px-1">
                                                    Billing Currency *
                                                </label>
                                                <select
                                                    {...field}
                                                    className={cn(
                                                        "w-full px-5 py-3 text-sm border rounded-2xl bg-surface transition-all duration-300 outline-none h-[48px]",
                                                        "focus:ring-4 focus:ring-primary/10 focus:border-primary",
                                                        errors.currency ? "border-error" : "border-border hover:border-primary/40"
                                                    )}
                                                >
                                                    <option value={Currency.USD}>USD - United States Dollar</option>
                                                    <option value={Currency.GBP}>GBP - British Pound Sterling</option>
                                                </select>
                                            </div>
                                        )}
                                    />
                                </div>
                                <Controller
                                    name="internal_expense_inr"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            label="Internal Expense (INR)"
                                            required
                                            placeholder="Monthly estimated cost in INR"
                                            error={!!errors.internal_expense_inr}
                                            helperText={errors.internal_expense_inr?.message}
                                            startAdornment={<div className="text-[10px] font-bold">₹</div>}
                                            min={1}
                                            max={1000000}
                                            onInput={(e) => {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val.length > 10) (e.target as HTMLInputElement).value = val.slice(0, 10);
                                            }}
                                        />
                                    )}
                                />
                            </>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2rem] bg-muted/20">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-foreground-tertiary" />
                                </div>
                                <p className="text-sm font-black text-foreground-tertiary uppercase tracking-widest text-center px-8">
                                    Financial parameters are locked for your access level
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Controller
                            name="referral_source"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Referral Source"
                                    placeholder="e.g. LinkedIn, Organic, Partner"
                                    error={!!errors.referral_source}
                                    helperText={errors.referral_source?.message}
                                    startAdornment={<TrendingUp className="w-4 h-4" />}
                                    maxLength={100}
                                />
                            )}
                        />
                        <Controller
                            name="discovery_source"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="How did you hear about us?"
                                    placeholder="e.g. Word of mouth, Conference, Cold outreach"
                                    error={!!errors.discovery_source}
                                    helperText={errors.discovery_source?.message}
                                    startAdornment={<Mail className="w-4 h-4" />}
                                    maxLength={100}
                                />
                            )}
                        />
                        <Controller
                            name="onboarding_date"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="date"
                                    label="Source of Truth (Onboarding Date)"
                                    required
                                    error={!!errors.onboarding_date}
                                    helperText={errors.onboarding_date?.message}
                                    startAdornment={<Calendar className="w-4 h-4" />}
                                />
                            )}
                        />
                        <div className="space-y-3 pt-2">
                            <label className="block text-[10px] font-black text-foreground-tertiary uppercase tracking-widest px-1">
                                Communication preference
                            </label>
                            <Controller
                                name="communication_preference"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'email', label: 'Email Only' },
                                            { value: 'whatsapp', label: 'WhatsApp Only' },
                                            { value: 'both', label: 'Both Channels' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => field.onChange(opt.value)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2",
                                                    field.value === opt.value
                                                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                                        : "bg-surface border-border text-foreground-tertiary hover:border-primary/40"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            />
                            <p className="text-[10px] text-foreground-tertiary px-1 italic">
                                Determines how the client receives critical absence alerts and updates.
                            </p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Employee Assignment Section */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-foreground-tertiary uppercase tracking-widest px-1">
                                Assign Employees to Account
                            </label>
                            <div className="relative mb-4">
                                <SearchInput
                                    value={searchEmp}
                                    onChange={setSearchEmp}
                                    searchKey="client-wizard-employee-search"
                                    placeholder="Search employees to assign..."
                                    wrapperClassName="mb-1"
                                />
                            </div>
                            <div 
                                className="border border-border rounded-2xl max-h-[250px] overflow-y-auto custom-scrollbar p-2 space-y-1"
                                onScroll={(e) => {
                                    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                                    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMoreEmployees && !isEmployeesLoading) {
                                        fetchEmployees(empPage + 1, searchEmp, true);
                                    }
                                }}
                            >
                                {employees.length === 0 && !isEmployeesLoading ? (
                                    <div className="py-8 text-center text-foreground-tertiary text-xs">
                                        No employees found matching.
                                    </div>
                                ) : (
                                    <>
                                        {employees.map(emp => (
                                            <div
                                                key={emp.id}
                                                onClick={() => toggleEmployee(emp.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                                    selectedEmployees.includes(emp.id)
                                                        ? "bg-primary/10 border border-primary/20 shadow-sm"
                                                        : "hover:bg-muted/50 border border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={emp.personalInfo.profilePicture}
                                                        name={`${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`}
                                                        size="sm"
                                                        className="rounded-lg shadow-sm"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black uppercase tracking-tight text-foreground">
                                                            {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-foreground-tertiary lowercase">
                                                            {emp.personalInfo.email}
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedEmployees.includes(emp.id) && (
                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {isEmployeesLoading && (
                                            <div className="py-4 text-center">
                                                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="px-2 flex items-center justify-between text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest">
                                <span>{selectedEmployees.length} Resources Selected</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedEmployees([])}
                                    className="text-primary hover:underline"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Portal Access Section */}
                        <div className="border-t border-border pt-6">
                            <div className="p-4 bg-success/5 rounded-2xl border border-success/10 flex items-start gap-3 mb-4">
                                <Globe className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-black uppercase text-success tracking-widest">Client Portal Access</h4>
                                    <p className="text-[10px] text-foreground-tertiary">
                                        Enable this client to access their assignment portal and team information.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Enable Portal Access Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/40 transition-colors">
                                    <div className="flex flex-col">
                                        <label className="text-[11px] font-black uppercase tracking-tight text-foreground cursor-pointer">
                                            Enable Portal Access
                                        </label>
                                        <p className="text-[10px] text-foreground-tertiary mt-1">
                                            Allow this client to login and view their assigned resources
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={portalAccessEnabled}
                                        onChange={(e) => {
                                            setPortalAccessEnabled(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedClientUser('');
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-primary accent-primary cursor-pointer"
                                    />
                                </div>

                                {portalAccessEnabled && (
                                    <div className={cn(
                                        "space-y-2 p-4 rounded-xl border transition-all",
                                        !selectedClientUser ? "bg-error/5 border-error/20 shadow-sm" : "bg-primary/5 border-primary/10"
                                    )}>
                                        <div className="flex items-center justify-between px-1">
                                            <label className="block text-[10px] font-black text-foreground-tertiary uppercase tracking-widest flex items-center gap-2">
                                                Select Client Account for Login
                                                {!selectedClientUser && <span className="text-error lowercase font-bold italic">(Required)</span>}
                                            </label>
                                            {canCreateUser && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/users/create')}
                                                    className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase hover:underline transition-all"
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                    Create New User
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative mb-2">
                                            <SearchInput
                                                value={searchClientUser}
                                                onChange={setSearchClientUser}
                                                searchKey="client-wizard-account-search"
                                                placeholder="Search users with Client role..."
                                                wrapperClassName="mb-0"
                                            />
                                        </div>
                                        {clientUsers.length === 0 ? (
                                            <div className="py-6 text-center">
                                                <p className="text-xs text-foreground-tertiary mb-2">No users with Client role found</p>
                                                <p className="text-[10px] text-foreground-tertiary/70">
                                                    Create a user account with Client role first to enable portal access
                                                </p>
                                            </div>
                                        ) : (
                                            <div
                                                className="border border-border rounded-xl max-h-[200px] overflow-y-auto custom-scrollbar p-2 space-y-1"
                                                onScroll={(e) => {
                                                    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                                                    if (scrollHeight - scrollTop <= clientHeight + 40 && hasMoreClientUsers && !isClientUsersLoading) {
                                                        fetchClientUsers(clientUserPage + 1, searchClientUser, true);
                                                    }
                                                }}
                                            >
                                                {clientUsers.length === 0 && !isClientUsersLoading ? (
                                                    <div className="py-6 text-center">
                                                        <p className="text-xs text-foreground-tertiary mb-2">No users with Client role found</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {clientUsers.map(user => (
                                                            <div
                                                                key={user.id}
                                                                onClick={() => setSelectedClientUser(user.id)}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                                                                    selectedClientUser === user.id
                                                                        ? "bg-primary/10 border-primary/20 shadow-sm"
                                                                        : "hover:bg-muted/50 border-transparent"
                                                                )}
                                                            >
                                                                <Avatar
                                                                    src={user.personalInfo.profilePicture}
                                                                    name={`${user.personalInfo.firstName} ${user.personalInfo.lastName}`}
                                                                    size="sm"
                                                                    className="rounded-lg shadow-sm"
                                                                />
                                                                <div className="flex-1 flex flex-col min-w-0">
                                                                    <span className="text-[10px] font-black uppercase tracking-tight text-foreground truncate">
                                                                        {user.personalInfo.firstName} {user.personalInfo.lastName}
                                                                    </span>
                                                                    <span className="text-[9px] text-foreground-tertiary lowercase truncate">
                                                                        {user.personalInfo.email}
                                                                    </span>
                                                                    <span className="text-[9px] text-foreground-tertiary/70">
                                                                        @{(user as unknown as { username?: string }).username}
                                                                    </span>
                                                                </div>
                                                                {selectedClientUser === user.id && (
                                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {isClientUsersLoading && (
                                                            <div className="py-4 text-center">
                                                                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {selectedClientUser && (
                                            <div className="mt-2 p-2 bg-success/10 rounded-lg border border-success/20 text-[9px] text-success">
                                                ✓ Account {selectedClientUser ? 'selected' : 'not selected'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={step === 0 ? onCancel : prevStep}
                            disabled={isLoading}
                        >
                            {step === 0 ? "Cancel" : "Back"}
                        </Button>
                        <div className="flex items-center gap-2">
                            {step < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    endIcon={<ChevronRight className="w-4 h-4" />}
                                >
                                    Continue
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleFinalSubmit}
                                    disabled={isLoading}
                                    startIcon={isLoading ? undefined : <Check className="w-4 h-4" />}
                                >
                                    {isLoading ? "Provisioning..." : initialValues?.id ? "Update Client" : "Finalize Onboarding"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientCreationWizard;
