import React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Select from "../../../components/common/Select/FormSelect";
import type { AllowanceDeductionMaster } from "../../../services/payrollService";

const schema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z.string().min(1, "Code is required").toUpperCase().trim(),
  type: z.enum(["ALLOWANCE", "DEDUCTION"]),
  calculationType: z.enum(["FIXED", "PERCENTAGE", "SLAB"]),
  percentageOf: z.enum(["CTC", "BASIC", "GROSS"]),
  value: z.number().min(0, "Value must be positive"),
  slabs: z.array(z.object({
    minAmount: z.number().min(0),
    maxAmount: z.number().min(0).nullable(),
    fixedAmount: z.number().min(0)
  })),
  isBalancing: z.boolean(),
  isTaxable: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number(),
});

type FormValues = z.infer<typeof schema>;

interface AllowanceDeductionFormProps {
  initialValues: Partial<AllowanceDeductionMaster>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | string[] | null;
}

const AllowanceDeductionForm: React.FC<AllowanceDeductionFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues.name || "",
      code: initialValues.code || "",
      type: (initialValues.type as any) || "ALLOWANCE",
      calculationType: (initialValues.calculationType as any) || "FIXED",
      percentageOf: (initialValues.percentageOf as any) || "CTC",
      value: initialValues.value || 0,
      isBalancing: initialValues.isBalancing ?? false,
      isTaxable: initialValues.isTaxable ?? false,
      isActive: initialValues.isActive ?? true,
      displayOrder: initialValues.displayOrder || 0,
      slabs: initialValues.slabs as any || [{ minAmount: 0, maxAmount: null, fixedAmount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slabs",
  });

  const calcType = watch("calculationType");

  const onFormSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pt-4">
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl">
          <p className="text-sm text-error font-medium">{Array.isArray(error) ? error[0] : error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Master Name"
          placeholder="e.g. Basic Salary, House Rent Allowance"
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <Input
          label="Code"
          placeholder="e.g. BASIC, HRA"
          {...register("code")}
          error={!!errors.code}
          helperText={errors.code?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              label="Type"
              options={[
                { value: "ALLOWANCE", label: "Allowance" },
                { value: "DEDUCTION", label: "Deduction" },
              ]}
              {...field}
              error={!!errors.type}
              helperText={errors.type?.message}
            />
          )}
        />
        <Controller
          name="calculationType"
          control={control}
          render={({ field }) => (
            <Select
              label="Calculation Method"
              options={[
                { value: "FIXED", label: "Fixed Amount" },
                { value: "PERCENTAGE", label: "Percentage Based" },
                { value: "SLAB", label: "Slab / Range Based" },
              ]}
              {...field}
              error={!!errors.calculationType}
              helperText={errors.calculationType?.message}
            />
          )}
        />
      </div>

      {(calcType === "PERCENTAGE" || calcType === "SLAB") && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <Controller
            name="percentageOf"
            control={control}
            render={({ field }) => (
              <Select
                label={calcType === "SLAB" ? "Slab Input Base" : "Percentage Of"}
                options={[
                  { value: "CTC", label: "Total Monthly CTC" },
                  { value: "BASIC", label: "Basic Salary" },
                  { value: "GROSS", label: "Gross Salary" },
                ]}
                {...field}
                error={!!errors.percentageOf}
                helperText={errors.percentageOf?.message}
              />
            )}
          />
        </div>
      )}

      {calcType === "SLAB" && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">Calculation Slabs</h4>
            <button
              type="button"
              onClick={() => append({ minAmount: 0, maxAmount: null, fixedAmount: 0 })}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Slab
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start animate-in zoom-in-95 duration-200">
                <div className="flex-1 w-full flex gap-2">
                  <Input
                    label="Min"
                    type="number"
                    placeholder="Min"
                    {...register(`slabs.${index}.minAmount` as const, { valueAsNumber: true })}
                    error={!!errors.slabs?.[index]?.minAmount}
                    helperText={errors.slabs?.[index]?.minAmount?.message}
                    className="flex-1"
                  />
                  <Input
                    label="Max"
                    type="number"
                    placeholder="Infinity"
                    {...register(`slabs.${index}.maxAmount` as const, {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                      valueAsNumber: true
                    })}
                    error={!!errors.slabs?.[index]?.maxAmount}
                    helperText={errors.slabs?.[index]?.maxAmount?.message}
                    className="flex-1"
                  />
                  <Input
                    label="Fixed (₹)"
                    type="number"
                    placeholder="Amount"
                    {...register(`slabs.${index}.fixedAmount` as const, { valueAsNumber: true })}
                    error={!!errors.slabs?.[index]?.fixedAmount}
                    helperText={errors.slabs?.[index]?.fixedAmount?.message}
                    className="flex-1"
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mt-7 p-2 text-foreground-tertiary hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {calcType !== "SLAB" && (
          <Input
            label="Value"
            type="number"
            placeholder={calcType === "PERCENTAGE" ? "e.g. 10 (%)" : "e.g. 500 (₹)"}
            {...register("value", { valueAsNumber: true })}
            error={!!errors.value}
            helperText={errors.value?.message}
          />
        )}
        <Input
          label="Display Order"
          type="number"
          placeholder="Priority in list"
          {...register("displayOrder", { valueAsNumber: true })}
          error={!!errors.displayOrder}
          helperText={errors.displayOrder?.message}
        />
      </div>

      <div className="flex flex-wrap items-start md:items-center gap-x-6 gap-y-4 py-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              {...register("isTaxable")}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-foreground-secondary group-hover:text-primary transition-colors">
            Is Taxable?
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              {...register("isActive")}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-foreground-secondary group-hover:text-primary transition-colors">
            Is Active?
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              {...register("isBalancing")}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest text-foreground-secondary group-hover:text-success transition-colors">
              Balancing Component?
            </span>
            <span className="text-[10px] font-medium text-foreground-tertiary">Absorbs CTC remainder</span>
          </div>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialValues._id ? "Update Master" : "Create Master"}
        </Button>
      </div>
    </form>
  );
};

export default AllowanceDeductionForm;
