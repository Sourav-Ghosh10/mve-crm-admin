import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Briefcase } from "lucide-react";
import Input from "../../../components/common/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import type { Designation, DesignationInput } from "../../../types/organization.types";
import { cn } from "../../../lib/utils";


const schema = yup.object({
    title: yup.string().required("Archetype title is required").trim().min(2, "Title must be at least 2 characters").max(50, "Title cannot exceed 50 characters"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    isActive: yup.boolean().default(true),
});

import FormError from "../../../components/common/FormError/FormError";
import { ModalFooter } from "../../../components/common/Modal/Modal";

interface DesignationFormProps {
    initialValues?: Partial<Designation>;
    onSubmit: (data: DesignationInput) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const DesignationForm: React.FC<DesignationFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<DesignationInput>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<DesignationInput>,
        defaultValues: {
            title: initialValues?.title || "",
            description: initialValues?.description || "",
            isActive: initialValues?.isActive ?? true,
        },
    });

    React.useEffect(() => {
        reset({
            title: initialValues?.title || "",
            description: initialValues?.description || "",
            isActive: initialValues?.isActive ?? true,
        });
    }, [initialValues, reset]);

    return (
        <form id="designation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormError message={error} />
            <div className="">
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Designation Title"
                            required
                            placeholder="e.g. Senior Neural Architect"
                            error={!!errors.title}
                            helperText={errors.title?.message}
                            startAdornment={<Briefcase className="w-4 h-4" />}
                            maxLength={50}
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
                        placeholder="Detail the responsibilities of this role..."
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

            <ModalFooter>
                <Button variant="secondaryOutline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" form="designation-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Designation"}
                </Button>
            </ModalFooter>
        </form >
    );
};

export default DesignationForm;
