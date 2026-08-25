import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Select from "../../../components/common/Select";
import payrollService, {
  type AllowanceDeductionMaster,
  type SalaryConfig,
} from "../../../services/payrollService";
import { userService } from "../../../services/userService";
import type { User } from "../../../types/user.types";
import {
  CreditCard,
  Calendar,
  User as UserIcon,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "../../../lib/utils";

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  monthlyCTC: z.number().min(0, "Monthly CTC must be positive"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
  isActive: z.boolean().optional(),
  items: z.array(
    z.object({
      masterId: z.string().optional(),
      overrideValue: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
});

type FormData = z.infer<typeof schema>;

interface SalaryConfigFormProps {
  initialValues?: Partial<SalaryConfig>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | string[] | null;
}

const SalaryConfigForm: React.FC<SalaryConfigFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [masters, setMasters] = useState<AllowanceDeductionMaster[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId:
        typeof initialValues?.employeeId === "string"
          ? initialValues.employeeId
          : (initialValues?.employeeId as any)?._id || "",
      monthlyCTC: initialValues?.monthlyCTC || 0,
      effectiveFrom: initialValues?.effectiveFrom
        ? new Date(initialValues.effectiveFrom).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      isActive: initialValues?.isActive ?? true,
      items:
        initialValues?.items?.map((i) => ({
          masterId:
            typeof i.masterId === "string"
              ? i.masterId
              : (i.masterId as any)?._id,
          overrideValue: i.overrideValue,
          isActive: i.isActive,
        })) || [],
    },
  });

  const { append, update } = useFieldArray({
    control,
    name: "items",
  });

  // The modal remains mounted while a row is selected. Resetting here ensures
  // the form reflects the configuration chosen for editing rather than the
  // empty values from its initial render.
  useEffect(() => {
    reset({
      employeeId:
        typeof initialValues?.employeeId === "string"
          ? initialValues.employeeId
          : (initialValues?.employeeId as any)?._id || "",
      monthlyCTC: initialValues?.monthlyCTC || 0,
      effectiveFrom: initialValues?.effectiveFrom
        ? new Date(initialValues.effectiveFrom).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      isActive: initialValues?.isActive ?? true,
      items:
        initialValues?.items?.map((i) => ({
          masterId:
            typeof i.masterId === "string"
              ? i.masterId
              : (i.masterId as any)?._id,
          overrideValue: i.overrideValue,
          isActive: i.isActive,
        })) || [],
    });
  }, [initialValues, reset]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        const [empRes, masterRes] = await Promise.all([
          userService.getAll({ limit: 100, isActive: true }),
          payrollService.getMasters({ isActive: true, limit: 100 }),
        ]);
        setEmployees(empRes.users);
        setMasters(masterRes.data);

        // If creating new, pre-populate items with all masters (inactive by default or active if you prefer)
        if (!initialValues?._id && masterRes.data.length > 0) {
          const defaultItems = masterRes.data.map((m) => ({
            masterId: m._id,
            overrideValue: null,
            isActive: false,
          }));
          setValue("items", defaultItems);
        }
      } catch (err) {
        console.error("Failed to fetch form data:", err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [initialValues?._id, setValue]);

  const formItems = watch("items");

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
          Calibrating Parameters...
        </p>
      </div>
    );
  }

  const onFormSubmit = (values: FormData) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-top-2">
          {Array.isArray(error) ? (
            <ul className="list-disc list-inside">
              {error.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          ) : (
            error
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="employeeId"
          control={control}
          render={({ field }: { field: any }) => (
            <Select
              label="Employee"
              value={field.value}
              onChange={field.onChange}
              options={employees.map((e) => ({
                value: e._id,
                label: `${e.personalInfo.firstName} ${e.personalInfo.lastName} (${e.employeeId})`,
              }))}
              error={!!errors.employeeId}
              helperText={errors.employeeId?.message}
              startIcon={<UserIcon className="w-4 h-4" />}
              required
              searchable
            />
          )}
        />

        <Input
          label="Monthly (CTC)"
          type="number"
          placeholder="e.g. 60000"
          {...register("monthlyCTC", { valueAsNumber: true })}
          error={!!errors.monthlyCTC}
          helperText={errors.monthlyCTC?.message}
          startAdornment={<CreditCard className="w-4 h-4" />}
          required
        />

        <Input
          label="Effective From"
          type="date"
          {...register("effectiveFrom")}
          error={!!errors.effectiveFrom}
          helperText={errors.effectiveFrom?.message}
          startAdornment={<Calendar className="w-4 h-4" />}
          required
        />

        <div className="flex items-center gap-4 h-full pt-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register("isActive")}
              />
              <div className="w-10 h-6 bg-muted rounded-full peer peer-checked:bg-success transition-all duration-300 border border-border"></div>
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm"></div>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-foreground-tertiary group-hover:text-foreground transition-colors">
              Active Config
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-tertiary flex items-center gap-2">
            <Plus className="w-3 h-3 text-primary" /> Component Overrides
          </h3>
          <span className="text-[9px] font-bold text-foreground-tertiary uppercase bg-muted px-2 py-0.5 rounded-lg border border-border/50">
            {masters.length} Available
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {masters.map((master) => {
            const itemIndex = formItems.findIndex(
              (i) => i.masterId === master._id,
            );
            const isEnabled = itemIndex !== -1 && formItems[itemIndex].isActive;
            const overrideValue =
              itemIndex !== -1 ? formItems[itemIndex].overrideValue : null;

            return (
              <div
                key={master._id}
                className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4",
                  isEnabled
                    ? "bg-primary/5 border-primary/20 shadow-sm shadow-primary/5"
                    : "bg-surface/50 border-border/50 opacity-60 grayscale-[0.5]",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (itemIndex === -1) {
                      append({
                        masterId: master._id,
                        overrideValue: null,
                        isActive: true,
                      });
                    } else {
                      update(itemIndex, {
                        ...formItems[itemIndex],
                        isActive: !isEnabled,
                      });
                    }
                  }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isEnabled
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground-tertiary",
                  )}
                >
                  {isEnabled ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm tracking-tight text-foreground">
                    {master.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                        (master.type as string) === "ALLOWANCE"
                          ? "bg-success/5 text-success border-success/10"
                          : "bg-error/5 text-error border-error/10",
                      )}
                    >
                      {master.type as string}
                    </span>
                    <span className="text-[9px] font-bold text-foreground-tertiary uppercase">
                      Default:{" "}
                      {master.calculationType === "PERCENTAGE"
                        ? `${master.value}%`
                        : `₹${master.value}`}
                    </span>
                  </div>
                </div>

                {isEnabled && (
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-foreground-tertiary uppercase text-right">
                      Override
                      <br />
                      Value (₹)
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 h-10 px-3 rounded-xl border border-primary/20 bg-white text-sm font-black text-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      placeholder="Master"
                      value={overrideValue ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value);
                        update(itemIndex, {
                          ...formItems[itemIndex],
                          overrideValue: val,
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-8 border-t border-border/50">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          type="button"
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialValues?._id ? "Update Configuration" : "Save Configuration"}
        </Button>
      </div>
    </form>
  );
};

export default SalaryConfigForm;

