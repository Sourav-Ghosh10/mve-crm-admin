import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Coffee, Tag, Clock } from "lucide-react";
import Input from "../../../components/common/Input/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import type { BreakType } from "../../../types/organization.types";
import { cn } from "../../../lib/utils";
import FormError from "../../../components/common/FormError/FormError";
import { ModalFooter } from "../../../components/common/Modal/Modal";

const schema = yup.object({
    name: yup.string().required("Break type name is required").trim().max(50, "Name cannot exceed 50 characters"),
    code: yup.string().required("Code is required").uppercase().trim().max(10, "Code cannot exceed 10 characters"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    maxDuration: yup.number()
        .typeError("Duration must be a number")
        .required("Duration is required")
        .min(1, "Duration must be at least 1 minute")
        .max(120, "Duration cannot exceed 120 minutes"),
    isPaid: yup.boolean().default(false),
    isActive: yup.boolean().default(true),
});

type BreakTypeFormData = yup.InferType<typeof schema>;

interface BreakTypeFormProps {
    initialValues?: Partial<BreakType>;
    onSubmit: (data: BreakTypeFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const BreakTypeForm: React.FC<BreakTypeFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, formState: { errors } } = useForm<BreakTypeFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<BreakTypeFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            code: initialValues?.code || "",
            description: initialValues?.description || "",
            maxDuration: initialValues?.maxDuration || 15,
            isPaid: initialValues?.isPaid ?? false,
            isActive: initialValues?.isActive ?? true,
        },
    });

    return (
        <form id="break-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormError message={error} />

            <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-1">
                <div className="md:col-span-4">
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Break Type Name"
                                required
                                placeholder="e.g. Lunch Break, Coffee Break"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                startAdornment={<Coffee className="w-4 h-4" />}
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
                                placeholder="e.g. LUNCH, COFFEE"
                                error={!!errors.code}
                                helperText={errors.code?.message}
                                startAdornment={<Tag className="w-4 h-4" />}
                                maxLength={10}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-3">
                    <Controller
                        name="maxDuration"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="number"
                                label="Max Duration (Minutes)"
                                required
                                placeholder="15"
                                error={!!errors.maxDuration}
                                helperText={errors.maxDuration?.message}
                                startAdornment={<Clock className="w-4 h-4" />}
                                min={1}
                                max={120}
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
                                placeholder="Briefly describe this break type..."
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
                                    {field.value ? "Paid Break" : "Unpaid Break"}
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
                <Button type="submit" form="break-type-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Break Type"}
                </Button>
            </ModalFooter>
        </form>
    );
};

export default BreakTypeForm;
