import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Select from "../../../components/common/Select";
import { userService } from "../../../services/userService";
import type { User } from "../../../types/user.types";
import { Calendar, User as UserIcon, Clock, AlertTriangle } from "lucide-react";

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100)
});

type FormData = z.infer<typeof schema>;

interface GeneratePayslipFormProps {
  defaultEmployeeId?: string;
  defaultMonth?: number;
  defaultYear?: number;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | string[] | null;
}

const GeneratePayslipForm: React.FC<GeneratePayslipFormProps> = ({
  defaultEmployeeId,
  defaultMonth,
  defaultYear,
  onSubmit,
  onCancel,
  isLoading,
  error
}) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: defaultEmployeeId || "",
      month: defaultMonth || currentMonth,
      year: defaultYear || currentYear
    }
  });

  const onFormSubmit = (values: FormData) => {
    onSubmit(values);
  };

  const selectedMonth = watch("month");
  const selectedEmployeeId = watch("employeeId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        const empRes = await userService.getAll({ limit: 100, isActive: true });

        setEmployees(empRes.users);
      } catch (err) {
        console.error("Failed to fetch page data:", err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Accessing Employee Registry...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-top-2 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            {Array.isArray(error) ? (
              <ul className="list-disc list-inside">
                {error.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            ) : error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Select
            label="Select Employee"
            value={selectedEmployeeId}
            onChange={(val) => setValue("employeeId", val)}
            options={employees.map(e => ({
              value: e._id,
              label: `${e.personalInfo.firstName} ${e.personalInfo.lastName} (${e.employeeId})`
            }))}
            error={!!errors.employeeId}
            helperText={errors.employeeId?.message}
            startIcon={<UserIcon className="w-4 h-4" />}
            required
            searchable
          />
        </div>

        <Select
          label="Month"
          value={String(selectedMonth)}
          onChange={(val) => setValue("month", parseInt(val))}
          options={[
            { value: "1", label: "January" },
            { value: "2", label: "February" },
            { value: "3", label: "March" },
            { value: "4", label: "April" },
            { value: "5", label: "May" },
            { value: "6", label: "June" },
            { value: "7", label: "July" },
            { value: "8", label: "August" },
            { value: "9", label: "September" },
            { value: "10", label: "October" },
            { value: "11", label: "November" },
            { value: "12", label: "December" },
          ]}
          startIcon={<Calendar className="w-4 h-4" />}
          required
        />

        <Input
          label="Year"
          type="number"
          {...register("year", { valueAsNumber: true })}
          error={!!errors.year}
          helperText={errors.year?.message}
          startAdornment={<Calendar className="w-4 h-4" />}
          required
        />

      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">PRO-RATA CALCULATION NOTICE</p>
        <p className="text-[11px] font-medium text-foreground-secondary leading-relaxed">
          Generation derives payable days and LOP from attendance and approved leave, includes approved reimbursements, and applies PF, tax, and every active configured deduction from the employee's current salary configuration.
        </p>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading} type="button">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} startIcon={<Clock className="w-4 h-4" />}>
          Generate Draft
        </Button>
      </div>
    </form>
  );
};

export default GeneratePayslipForm;
