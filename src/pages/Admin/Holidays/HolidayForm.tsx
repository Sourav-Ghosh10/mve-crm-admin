import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Calendar } from "lucide-react";
import Input from "../../../components/common/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import type { Holiday } from "../../../types/organization.types";
import { cn } from "../../../lib/utils";
import FormError from "../../../components/common/FormError/FormError";
import { ModalFooter } from "../../../components/common/Modal/Modal";

const schema = yup.object({
    name: yup.string()
        .required("Holiday name is required")
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .matches(/^[a-zA-Z0-9\s\-'&.]+$/, "Name contains invalid characters (Allow only letters, numbers, spaces, and & . - ')"),
    date: yup.string().required("Date is required"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    isRecurring: yup.boolean().default(false),
    isActive: yup.boolean().default(true),
});

type HolidayFormData = yup.InferType<typeof schema>;

interface HolidayFormProps {
    initialValues?: Partial<Holiday>;
    onSubmit: (data: HolidayFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const HolidayForm: React.FC<HolidayFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, formState: { errors } } = useForm<HolidayFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<HolidayFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            date: initialValues?.date ? initialValues.date.split('T')[0] : "",
            description: initialValues?.description || "",
            isRecurring: initialValues?.isRecurring ?? false,
            isActive: initialValues?.isActive ?? true,
        },
    });

    return (
        <form id="holiday-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormError message={error} />
            <div className="space-y-4">
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Holiday Name"
                            required
                            placeholder="e.g. Independence Day"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            startAdornment={<Calendar className="w-4 h-4" />}
                            className="bg-primary/5 focus:bg-white"
                            maxLength={50}
                        />
                    )}
                />
                <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            type="date"
                            label="Date"
                            required
                            error={!!errors.date}
                            helperText={errors.date?.message}
                            className="bg-primary/5 focus:bg-white"
                        />
                    )}
                />
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <TextArea
                            {...field}
                            label="Description"
                            rows={4}
                            placeholder="Briefly describe this holiday..."
                            error={!!errors.description}
                            helperText={errors.description?.message}
                            maxLength={500}
                        />
                    )}
                />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                <Controller
                    name="isRecurring"
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
                                Annual Recurring
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

            <ModalFooter>
                <Button variant="secondaryOutline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" form="holiday-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Holiday"}
                </Button>
            </ModalFooter>
        </form >
    );
};

export default HolidayForm;
