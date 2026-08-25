import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Shield, Check, ChevronDown, ChevronRight } from "lucide-react";
import Input from "../../../components/common/Input";
import TextArea from "../../../components/common/Input/TextArea";
import Button from "../../../components/common/Button";
import type { Role } from "../../../types/role.types";
import { cn } from "../../../lib/utils";
import { PERMISSION_GROUPS, ALL_PERMISSIONS, type PermissionValue } from "../../../config/permissions";

import FormError from "../../../components/common/FormError/FormError";
import { ModalFooter } from "../../../components/common/Modal/Modal";

const schema = yup.object({
    name: yup.string().required("Role name is required").trim().max(50, "Name cannot exceed 50 characters"),
    description: yup.string().optional().trim().max(500, "Description cannot exceed 500 characters"),
    permissions: yup.array().of(yup.string().required()).default([]),
    isActive: yup.boolean().default(true),
});

type RoleFormData = yup.InferType<typeof schema>;

interface RoleFormProps {
    initialValues?: Partial<Role>;
    onSubmit: (data: RoleFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const RoleForm: React.FC<RoleFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<RoleFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<RoleFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            description: initialValues?.description || "",
            permissions: initialValues?.permissions || [],
            isActive: initialValues?.isActive ?? true,
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const roleName = watch("name");
    const isClientRole = roleName?.toLowerCase() === "client";
    const currentPermissions = watch("permissions") || [];

    const displayGroups = React.useMemo(() => {
        if (!isClientRole) return PERMISSION_GROUPS;
        return PERMISSION_GROUPS.map(group => ({
            ...group,
            permissions: group.permissions.filter(p => 
                !p.id.includes('create') && 
                !p.id.includes('edit') && 
                !p.id.includes('delete') && 
                !p.id.includes('manage') &&
                !p.id.includes('approve') &&
                !p.id.includes('reject') &&
                !p.id.includes('pay')
            )
        })).filter(group => group.permissions.length > 0);
    }, [isClientRole]);

    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        PERMISSION_GROUPS.forEach((g) => { initial[g.label] = true; });
        return initial;
    });

    const toggleGroup = (label: string) => {
        setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const isGroupFullySelected = (groupPerms: { id: string }[]) =>
        groupPerms.every((p) => currentPermissions.includes(p.id));

    const isGroupPartiallySelected = (groupPerms: { id: string }[]) =>
        groupPerms.some((p) => currentPermissions.includes(p.id)) && !isGroupFullySelected(groupPerms);

    const toggleGroupAll = (groupPerms: { id: string }[]) => {
        const allIds = groupPerms.map((p) => p.id);
        if (isGroupFullySelected(groupPerms)) {
            // Deselect all in group
            setValue(
                "permissions",
                currentPermissions.filter((id) => !allIds.includes(id)),
                { shouldDirty: true }
            );
        } else {
            // Select all in group
            const merged = Array.from(new Set([...currentPermissions, ...allIds]));
            setValue("permissions", merged, { shouldDirty: true });
        }
    };

    const toggleAll = () => {
        const allDisplayIds = displayGroups.flatMap(g => g.permissions.map(p => p.id));
        const allSelected = allDisplayIds.every(id => currentPermissions.includes(id));

        if (allSelected) {
            setValue("permissions", currentPermissions.filter(id => !allDisplayIds.includes(id as PermissionValue)), { shouldDirty: true });
        } else {
            setValue("permissions", Array.from(new Set([...currentPermissions, ...(allDisplayIds as string[])])), { shouldDirty: true });
        }
    };

    return (
        <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <FormError message={error} />
            <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-1">
                    <div className="md:col-span-4">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Role Name"
                                    required
                                    placeholder="e.g. Regional Manager"
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    startAdornment={<Shield className="w-4 h-4" />}
                                    compact
                                    maxLength={50}
                                />
                            )}
                        />
                    </div>
                    <div className="md:col-span-2 pt-5">
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center cursor-pointer group py-1 w-fit h-[44px]">
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

                    <div className="md:col-span-6">
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextArea
                                    {...field}
                                    label="Description"
                                    rows={3}
                                    placeholder="Briefly describe the responsibilities of this role..."
                                    error={!!errors.description}
                                    helperText={errors.description?.message}
                                    compact
                                    maxLength={500}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="block text-[10px] font-black text-foreground-tertiary uppercase tracking-widest">
                                Module Permissions
                            </label>
                            <button
                                type="button"
                                onClick={toggleAll}
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all",
                                    currentPermissions.length === ALL_PERMISSIONS.length
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-muted/50 text-foreground-tertiary border-border/50 hover:border-primary/30 hover:text-primary"
                                )}
                            >
                                {currentPermissions.length === ALL_PERMISSIONS.length ? "Deselect All" : "Select All"}
                            </button>
                        </div>

                        <div className="text-[10px] font-bold text-foreground-tertiary px-1">
                            {displayGroups.flatMap(g => g.permissions).filter(p => currentPermissions.includes(p.id)).length} of {displayGroups.flatMap(g => g.permissions).length} permissions available for this role
                        </div>

                        <Controller
                            name="permissions"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                    {displayGroups.map((group) => {
                                        const isExpanded = expandedGroups[group.label];
                                        const isFull = isGroupFullySelected(group.permissions);
                                        const isPartial = isGroupPartiallySelected(group.permissions);

                                        return (
                                            <div
                                                key={group.label}
                                                className="rounded-2xl border border-border/50 overflow-hidden bg-surface/30"
                                            >
                                                {/* Group Header */}
                                                <div className="flex items-center gap-3 px-3 py-2 bg-muted/30">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroupAll(group.permissions)}
                                                        className={cn(
                                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                            isFull
                                                                ? "bg-primary border-primary"
                                                                : isPartial
                                                                    ? "bg-primary/40 border-primary/60"
                                                                    : "bg-white border-border hover:border-primary/40"
                                                        )}
                                                    >
                                                        {(isFull || isPartial) && (
                                                            <Check className={cn("w-3 h-3", isFull ? "text-white" : "text-white")} />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(group.label)}
                                                        className="flex items-center gap-2 flex-1 text-left"
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                                            {group.label}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-foreground-tertiary bg-muted px-2 py-0.5 rounded-lg">
                                                            {group.permissions.filter((p) => field.value?.includes(p.id)).length}/{group.permissions.length}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(group.label)}
                                                        className="text-foreground-tertiary"
                                                    >
                                                        {isExpanded
                                                            ? <ChevronDown className="w-4 h-4" />
                                                            : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                {/* Permission Checkboxes */}
                                                {isExpanded && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3">
                                                        {group.permissions.map((perm) => {
                                                            const isChecked = field.value?.includes(perm.id);
                                                            return (
                                                                <button
                                                                    key={perm.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = field.value || [];
                                                                        const next = isChecked
                                                                            ? current.filter((id) => id !== perm.id)
                                                                            : [...current, perm.id];
                                                                        field.onChange(next);
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-200 text-left",
                                                                        isChecked
                                                                            ? "bg-primary/5 border-primary/30 shadow-sm"
                                                                            : "bg-surface/50 border-transparent hover:border-primary/20 hover:bg-primary/5"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                                        isChecked
                                                                            ? "bg-primary border-primary"
                                                                            : "bg-white border-border"
                                                                    )}>
                                                                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-xs font-semibold transition-colors",
                                                                        isChecked ? "text-primary" : "text-foreground-secondary"
                                                                    )}>
                                                                        {perm.label}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        />
                    </div>


            </div>

            <ModalFooter>
                <Button variant="secondaryOutline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" form="role-form" isLoading={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create Role"}
                </Button>
            </ModalFooter>
        </form>
    );
};

export default RoleForm;
