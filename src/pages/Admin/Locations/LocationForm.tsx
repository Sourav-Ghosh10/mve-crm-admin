import React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Building2, MapPin, Phone, Mail, Globe, Hash, Clock } from "lucide-react";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import type { OfficeLocation } from "../../../types/organization.types";
import { cn } from "../../../lib/utils";

const schema = yup.object({
    name: yup.string().required("Location name is required").trim().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    address: yup.object({
        street: yup.string().required("Street is required").trim().max(200, "Street cannot exceed 200 characters"),
        city: yup.string().required("City is required").trim().max(50, "City cannot exceed 50 characters"),
        state: yup.string().required("State is required").trim().max(50, "State cannot exceed 50 characters"),
        country: yup.string().required("Country is required").trim().max(50, "Country cannot exceed 50 characters").default("India"),
        zipCode: yup.string().required("ZIP Code is required").trim().max(10, "ZIP Code cannot exceed 10 characters"),
    }),
    contactInfo: yup.object({
        phone: yup.string().optional().max(15, "Phone cannot exceed 15 digits"),
        email: yup.string().email("Invalid email").optional().max(50, "Email cannot exceed 50 characters"),
    }),
    isHeadquarters: yup.boolean().default(false),
    isActive: yup.boolean().default(true),
    timezone: yup.string().required("Timezone is required").trim().max(50, "Timezone cannot exceed 50 characters").default("Asia/Kolkata"),
});

type LocationFormData = yup.InferType<typeof schema>;

import FormError from "../../../components/common/FormError/FormError";
import { ModalFooter } from "../../../components/common/Modal/Modal";

interface LocationFormProps {
    initialValues?: Partial<OfficeLocation>;
    onSubmit: (data: LocationFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | string[] | null;
}

const LocationForm: React.FC<LocationFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, formState: { errors } } = useForm<LocationFormData>({
        mode: "onChange",
        resolver: yupResolver(schema) as Resolver<LocationFormData>,
        defaultValues: {
            name: initialValues?.name || "",
            address: {
                street: initialValues?.address?.street || "",
                city: initialValues?.address?.city || "",
                state: initialValues?.address?.state || "",
                country: initialValues?.address?.country || "India",
                zipCode: initialValues?.address?.zipCode || "",
            },
            contactInfo: {
                phone: initialValues?.contactInfo?.phone || "",
                email: initialValues?.contactInfo?.email || "",
            },
            isHeadquarters: initialValues?.isHeadquarters || false,
            isActive: initialValues?.isActive ?? true,
            timezone: initialValues?.timezone || "Asia/Kolkata",
        },
    });

    return (
        <form id="location-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormError message={error} />
            <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-1">
                <div className="md:col-span-4">
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Location Name"
                                required
                                placeholder="e.g. Mumbai Technopark"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                startAdornment={<Building2 className="w-4 h-4" />}
                                maxLength={50}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-2 pt-6">
                    <Controller
                        name="isHeadquarters"
                        control={control}
                        render={({ field }) => (
                            <label className="flex items-center p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted transition-colors cursor-pointer group h-[52px]">
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="w-4 h-4 rounded-md border-2 border-border text-primary focus:ring-primary/20 transition-all"
                                />
                                <span className="ml-3 text-xs font-bold text-foreground-tertiary group-hover:text-primary uppercase tracking-widest transition-colors whitespace-nowrap">Headquarters</span>
                            </label>
                        )}
                    />
                </div>

                <div className="md:col-span-3">
                    <Controller
                        name="contactInfo.email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Email Address"
                                placeholder="hub@pulseops.com"
                                error={!!errors.contactInfo?.email}
                                helperText={errors.contactInfo?.email?.message}
                                startAdornment={<Mail className="w-4 h-4" />}
                                maxLength={50}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-3">
                    <Controller
                        name="contactInfo.phone"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Phone Number"
                                placeholder="+91 XXXXXXXXXX"
                                error={!!errors.contactInfo?.phone}
                                helperText={errors.contactInfo?.phone?.message}
                                startAdornment={<Phone className="w-4 h-4" />}
                                maxLength={15}
                                type="number"
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-3">
                    <Controller
                        name="timezone"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Timezone"
                                required
                                placeholder="Asia/Kolkata"
                                error={!!errors.timezone}
                                helperText={errors.timezone?.message}
                                startAdornment={<Clock className="w-4 h-4" />}
                                maxLength={50}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-3">
                    <Controller
                        name="address.street"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Street Address"
                                required
                                placeholder="e.g. 123 Tech Lane"
                                error={!!errors.address?.street}
                                helperText={errors.address?.street?.message}
                                startAdornment={<MapPin className="w-4 h-4" />}
                                maxLength={200}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-2">
                    <Controller
                        name="address.city"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="City"
                                required
                                placeholder="Mumbai"
                                error={!!errors.address?.city}
                                helperText={errors.address?.city?.message}
                                maxLength={50}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-2">
                    <Controller
                        name="address.state"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="State"
                                required
                                placeholder="Maharashtra"
                                error={!!errors.address?.state}
                                helperText={errors.address?.state?.message}
                                maxLength={50}
                            />
                        )}
                    />
                </div>
                <div className="md:col-span-2">
                    <Controller
                        name="address.zipCode"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="ZIP Code"
                                required
                                placeholder="400001"
                                error={!!errors.address?.zipCode}
                                helperText={errors.address?.zipCode?.message}
                                startAdornment={<Hash className="w-4 h-4" />}
                                maxLength={10}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-6">
                    <Controller
                        name="address.country"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Country"
                                required
                                placeholder="India"
                                error={!!errors.address?.country}
                                helperText={errors.address?.country?.message}
                                startAdornment={<Globe className="w-4 h-4" />}
                                maxLength={50}
                            />
                        )}
                    />
                </div>

                <div className="md:col-span-6">
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
            </div>

            <ModalFooter>
                <Button variant="secondaryOutline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" form="location-form" disabled={isLoading} className="w-full sm:w-auto">
                    {initialValues?._id ? "Save Changes" : "Create"}
                </Button>
            </ModalFooter>
        </form>
    );
};

export default LocationForm;
