import React, { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FileText, Tag, Hash, Calendar } from "lucide-react";
import Input from "../../../components/common/Input/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import FormSelect from "../../../components/common/Select/FormSelect";
import type { LeaveType, Department, Designation } from "../../../types/organization.types";
import { departmentService } from "../../../services/departmentService";
import { designationService } from "../../../services/designationService";
import { cn } from "../../../lib/utils";
import FormError from "../../../components/common/FormError/FormError";
import MultiSelectSearch from "../../../components/common/Search/MultiSelectSearch";
import { ModalFooter } from "../../../components/common/Modal/Modal";

const schema = yup.object({
    name: yup.string().required("Leave type name is required").trim().max(50, "Name cannot exceed 50 characters"),
    code: yup.string().required("Code is required").uppercase().trim().max(10, "Code cannot exceed 10 characters"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    isPaid: yup.boolean().default(true),
    defaultAmount: yup.number()
        .typeError("Allowance must be a number")
        .required("Allowance is required")
        .min(1, "Allowance must be at least 1")
        .test('max-allowance', 'Allowance limit exceeded', function (value) {
            const { resetFrequency } = this.parent;
            if (resetFrequency === 'monthly') {
                return value <= 31 || this.createError({ message: 'Monthly allowance cannot exceed 31 days' });
            }
            return value <= 365 || this.createError({ message: 'Annual allowance cannot exceed 365 days' });
        }),
    maxCarryForward: yup.number()
        .typeError("Amount must be a number")
        .optional()
        .min(0, "Carry forward cannot be negative")
        .max(365, "Carry forward cannot exceed 365 days")
        .default(0),
    resetFrequency: yup.string().oneOf(['monthly', 'yearly']).required("Reset frequency is required"),
    applicableDepartments: yup.array().of(yup.string().required()).min(1, "At least one department must be selected").required("Departments are required"),
    applicableDesignations: yup.array().of(yup.string().required()).min(1, "At least one designation must be selected").required("Designations are required"),
    isActive: yup.boolean().default(true),
    accrualType: yup.string().oneOf(['fixed', 'hourly']).default('fixed'),
    annualEntitlement: yup.number().transform((val, orig) => orig === '' ? 0 : val).optional(),
    workingHoursPerDay: yup.number().transform((val, orig) => orig === '' ? 8 : val).optional(),
    hourlyAccrualRate: yup.number().transform((val, orig) => orig === '' ? 0 : val).optional(),
});

type LeaveTypeFormData = yup.InferType<typeof schema>;

interface LeaveTypeFormProps {
    initialValues?: Partial<LeaveType>;
    onSubmit: (data: LeaveTypeFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const LeaveTypeForm: React.FC<LeaveTypeFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [loadingDesigs, setLoadingDesigs] = useState(false);

    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                setLoadingDepts(true);
                setLoadingDesigs(true);
                const [deptRes, desigRes] = await Promise.all([
                    departmentService.getAll({ limit: 100, isActive: true }),
                    designationService.getAll({ limit: 100, isActive: true })
                ]);
                setDepartments(deptRes.data);
                setDesignations(desigRes.data);
            } catch (err) {
                console.error("Failed to fetch filter data", err);
            } finally {
                setLoadingDepts(false);
                setLoadingDesigs(false);
            }
        };
        fetchFilterData();
    }, []);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<LeaveTypeFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<LeaveTypeFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            code: initialValues?.code || "",
            description: initialValues?.description || "",
            isPaid: initialValues?.isPaid ?? true,
            defaultAmount: (initialValues?.defaultAmount ?? 0),
            maxCarryForward: initialValues?.maxCarryForward || 0,
            resetFrequency: (initialValues?.resetFrequency || 'yearly') as 'monthly' | 'yearly',
            applicableDepartments: initialValues?.applicableDepartments || [],
            applicableDesignations: initialValues?.applicableDesignations || [],
            isActive: initialValues?.isActive ?? true,
            accrualType: (initialValues?.accrualType || 'fixed') as 'fixed' | 'hourly',
            annualEntitlement: initialValues?.annualEntitlement || 0,
            workingHoursPerDay: initialValues?.workingHoursPerDay || 8,
            hourlyAccrualRate: initialValues?.hourlyAccrualRate || 0,
        },
    });

    const resetFrequency = watch("resetFrequency");
    const accrualType = watch("accrualType");
    const annualEntitlement = watch("annualEntitlement") || 0;
    const workingHoursPerDay = watch("workingHoursPerDay") || 8;

    useEffect(() => {
        if (accrualType === 'hourly' && annualEntitlement > 0 && workingHoursPerDay > 0) {
            const rate = annualEntitlement / (260 * workingHoursPerDay);
            setValue('hourlyAccrualRate', parseFloat(rate.toFixed(4)));
        }
    }, [accrualType, annualEntitlement, workingHoursPerDay, setValue]);

    return (
        <form id="leave-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormError message={error} />

            <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-1">
                <div className="md:col-span-4">
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Leave Type Name"
                                required
                                placeholder="e.g. Sick Leave, Vacation"
                                error={!!errors.name}
                                helperText={errors.name?.message || "Common examples: Sick Leave, Vacation, Casual Leave."}
                                startAdornment={<FileText className="w-4 h-4" />}
                                maxLength={50}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-2">
                    <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Code"
                                required
                                placeholder="e.g. SL, VAC"
                                error={!!errors.code}
                                helperText={errors.code?.message || "Short unique identifier for the leave type."}
                                startAdornment={<Tag className="w-4 h-4" />}
                                maxLength={10}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-2">
                    <Controller
                        name="defaultAmount"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="number"
                                label={resetFrequency === 'monthly' ? "Monthly Allowance" : "Annual Allowance"}
                                required
                                placeholder="0"
                                error={!!errors.defaultAmount}
                                helperText={errors.defaultAmount?.message || `Total leave balance granted ${resetFrequency === 'monthly' ? 'monthly' : 'annually'}.`}
                                startAdornment={<Hash className="w-4 h-4" />}
                                disabled={!!initialValues?._id}
                                min={1}
                                max={resetFrequency === 'monthly' ? 31 : 365}
                                onInput={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val.length > 3) (e.target as HTMLInputElement).value = val.slice(0, 3);
                                }}
                            />
                        )}
                    />
                </div>
                
                <div className="md:col-span-2">
                    <Controller
                        name="accrualType"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Accrual Type"
                                required
                                value={field.value}
                                onChange={field.onChange}
                                options={[
                                    { value: 'fixed', label: 'Fixed (Default Amount)' },
                                    { value: 'hourly', label: 'Based on Hours Worked' }
                                ]}
                                error={!!errors.accrualType}
                                helperText={errors.accrualType?.message || "How leave is accrued."}
                            />
                        )}
                    />
                </div>

                {accrualType === 'hourly' && (
                    <>
                        <div className="md:col-span-2">
                            <Controller
                                name="annualEntitlement"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        label="Annual Entitlement (Days)"
                                        required
                                        placeholder="15"
                                        error={!!errors.annualEntitlement}
                                        helperText={errors.annualEntitlement?.message}
                                    />
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Controller
                                name="workingHoursPerDay"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        label="Working Hours Per Day"
                                        required
                                        placeholder="8"
                                        error={!!errors.workingHoursPerDay}
                                        helperText={errors.workingHoursPerDay?.message}
                                    />
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Controller
                                name="hourlyAccrualRate"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.0001"
                                        label="Hourly Accrual Rate"
                                        required
                                        placeholder="0.0072"
                                        error={!!errors.hourlyAccrualRate}
                                        helperText={errors.hourlyAccrualRate?.message || "Calculated automatically."}
                                    />
                                )}
                            />
                        </div>
                    </>
                )}

                <div className="md:col-span-2">
                    <Controller
                        name="maxCarryForward"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="number"
                                label="Max Carry Forward"
                                placeholder="0"
                                error={!!errors.maxCarryForward}
                                helperText={errors.maxCarryForward?.message || "Limit of unused leave days to carry into next year."}
                                startAdornment={<Hash className="w-4 h-4" />}
                                disabled={!!initialValues?._id}
                                min={0}
                                max={365}
                                onInput={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val.length > 3) (e.target as HTMLInputElement).value = val.slice(0, 3);
                                }}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-2">
                    <Controller
                        name="resetFrequency"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Reset Frequency"
                                required
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select Frequency"
                                options={[
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'yearly', label: 'Yearly' }
                                ]}
                                error={!!errors.resetFrequency}
                                helperText={errors.resetFrequency?.message || "How often the leave balance resets."}
                                startIcon={<Calendar className="w-4 h-4" />}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-3">
                    <Controller
                        name="applicableDepartments"
                        control={control}
                        render={({ field }) => (
                            <MultiSelectSearch
                                label="Applicable Departments"
                                required
                                options={departments.map(d => ({ value: d.name, label: d.name }))}
                                selectedValues={field.value}
                                onSelectionChange={field.onChange}
                                placeholder="Select departments..."
                                allowAll={true}
                                allowSearch={false}
                                isLoading={loadingDepts}
                                searchKey="leave-type-departments"
                                error={!!errors.applicableDepartments}
                                helperText={errors.applicableDepartments?.message || "Departments permitted to use this leave type."}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-3">
                    <Controller
                        name="applicableDesignations"
                        control={control}
                        render={({ field }) => (
                            <MultiSelectSearch
                                label="Applicable Designations"
                                required
                                options={designations.map(d => ({ value: d.name || d.title || '', label: d.name || d.title || '' }))}
                                selectedValues={field.value}
                                onSelectionChange={field.onChange}
                                placeholder="Select designations..."
                                allowAll={true}
                                allowSearch={false}
                                isLoading={loadingDesigs}
                                searchKey="leave-type-designations"
                                error={!!errors.applicableDesignations}
                                helperText={errors.applicableDesignations?.message || "Job roles eligible for this leave type."}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-6">
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextArea
                                {...field}
                                label="Description"
                                placeholder="Briefly describe this leave type..."
                                error={!!errors.description}
                                helperText={errors.description?.message}
                                rows={3}
                                maxLength={500}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-6 flex flex-wrap items-center gap-x-8 gap-y-3 pt-2">
                    <Controller
                        name="isPaid"
                        control={control}
                        render={({ field }) => (
                            <label className="flex items-center cursor-pointer group py-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                    <div className={cn(
                                        "w-10 h-5 bg-muted rounded-full transition-colors border border-border",
                                        field.value && "bg-primary/20 border-primary/40"
                                    )} />
                                    <div className={cn(
                                        "absolute left-1 top-1 w-3 h-3 bg-foreground-tertiary rounded-full transition-all",
                                        field.value && "translate-x-5 bg-primary"
                                    )} />
                                </div>
                                <span className={cn(
                                    "ml-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                                    field.value ? "text-primary" : "text-foreground-tertiary"
                                )}>
                                    Paid Leave
                                </span>
                            </label>
                        )}
                    />
                    <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                            <label className="flex items-center cursor-pointer group py-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                    <div className={cn(
                                        "w-10 h-5 bg-muted rounded-full transition-colors border border-border",
                                        field.value && "bg-primary/20 border-primary/40"
                                    )} />
                                    <div className={cn(
                                        "absolute left-1 top-1 w-3 h-3 bg-foreground-tertiary rounded-full transition-all",
                                        field.value && "translate-x-5 bg-primary"
                                    )} />
                                </div>
                                <span className={cn(
                                    "ml-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                                    field.value ? "text-primary" : "text-foreground-tertiary"
                                )}>
                                    {field.value ? "Active Status" : "Inactive Status"}
                                </span>
                            </label>
                        )}
                    />
                </div>
            </div>

            <ModalFooter>
                <Button variant="secondaryOutline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" form="leave-type-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Leave Type"}
                </Button>
            </ModalFooter>
        </form>
    );
};

export default LeaveTypeForm;
