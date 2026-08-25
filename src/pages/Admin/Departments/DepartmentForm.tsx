import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { GitBranch } from "lucide-react";
import Input from "../../../components/common/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import type { Department } from "../../../types/organization.types";
import { cn } from "../../../lib/utils";

import FormError from "../../../components/common/FormError/FormError";
import { ModalFooter } from "../../../components/common/Modal/Modal";

const schema = yup.object({
    name: yup.string().required("Department name is required").trim().max(50, "Name cannot exceed 50 characters"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    isActive: yup.boolean().default(true),
});

type DepartmentFormData = yup.InferType<typeof schema>;

interface DepartmentFormProps {
    initialValues?: Partial<Department>;
    onSubmit: (data: DepartmentFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, formState: { errors } } = useForm<DepartmentFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<DepartmentFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            description: initialValues?.description || "",
            isActive: initialValues?.isActive ?? true,
        },
    });

    return (
        <form id="department-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormError message={error} />
            <div className="space-y-4">
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Department Name"
                            required
                            placeholder="e.g. Neural Engineering"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            startAdornment={<GitBranch className="w-4 h-4" />}
                            className="bg-primary/5 focus:bg-white"
                            maxLength={50}
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
                            placeholder="Briefly describe the purpose of this department..."
                            error={!!errors.description}
                            helperText={errors.description?.message}
                            maxLength={500}
                        />
                    )}
                />
                <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                        <label className="flex items-center cursor-pointer group py-2 w-fit">
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
                <Button type="submit" form="department-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Department"}
                </Button>
            </ModalFooter>
        </form>
    );
};

export default DepartmentForm;
