import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Tag, Hash } from "lucide-react";
import Input from "../../../components/common/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import { cn } from "../../../lib/utils";
import FormError from "../../../components/common/FormError/FormError";
import type { ReimbursementType } from "../../../types/reimbursement.types";
import { ModalFooter } from "../../../components/common/Modal/Modal";

const schema = yup.object({
    name: yup.string().required("Reimbursement type name is required").trim().max(50, "Name cannot exceed 50 characters"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    maxAmount: yup.number()
        .typeError("Amount must be a number")
        .transform((value, originalValue) => (originalValue === "" ? undefined : value))
        .optional()
        .min(0, "Amount must be positive")
        .max(1000000, "Amount cannot exceed 1,000,000"),
    requiresReceipt: yup.boolean().default(true),
    isActive: yup.boolean().default(true),
});

type ReimbursementTypeFormData = yup.InferType<typeof schema>;

interface ReimbursementTypeFormProps {
    initialValues?: Partial<ReimbursementType>;
    onSubmit: (data: ReimbursementTypeFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const ReimbursementTypeForm: React.FC<ReimbursementTypeFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, formState: { errors } } = useForm<ReimbursementTypeFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<ReimbursementTypeFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            description: initialValues?.description || "",
            maxAmount: initialValues?.maxAmount,
            requiresReceipt: initialValues?.requiresReceipt ?? true,
            isActive: initialValues?.isActive ?? true,
        },
    });

    return (
        <form id="reimbursement-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormError message={error} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Type Name"
                            required
                            placeholder="e.g. Travel, Meals"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            startAdornment={<Tag className="w-4 h-4" />}
                            className="bg-primary/5 focus:bg-white"
                            maxLength={50}
                        />
                    )}
                />
                <Controller
                    name="maxAmount"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            type="number"
                            label="Max Amount (Optional)"
                            placeholder="e.g. 500.00"
                            error={!!errors.maxAmount}
                            helperText={errors.maxAmount?.message}
                            startAdornment={<Hash className="w-4 h-4" />}
                            className="bg-primary/5 focus:bg-white"
                            min={0}
                            max={1000000}
                            onInput={(e) => {
                                const val = (e.target as HTMLInputElement).value;
                                if (val.length > 10) (e.target as HTMLInputElement).value = val.slice(0, 10);
                            }}
                        />
                    )}
                />
            </div>

            <Controller
                name="description"
                control={control}
                render={({ field }) => (
                    <TextArea
                        {...field}
                        label="Description"
                        rows={3}
                        placeholder="Briefly describe this reimbursement type..."
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        maxLength={500}
                    />
                )}
            />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                <Controller
                    name="requiresReceipt"
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
                            <div className="ml-3 flex flex-col">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                                    field.value ? "text-primary" : "text-foreground-tertiary"
                                )}>
                                    Requires Receipt
                                </span>
                            </div>
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

            <ModalFooter>
                <Button variant="secondaryOutline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" form="reimbursement-type-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Type"}
                </Button>
            </ModalFooter>
        </form>
    );
};

export default ReimbursementTypeForm;
