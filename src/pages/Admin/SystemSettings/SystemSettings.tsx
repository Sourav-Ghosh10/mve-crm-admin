import React, { useEffect, useState, useRef } from "react";
import { Mail, Plus, X, Save, ShieldCheck, Calendar, Info, FileImage, Upload, Banknote, Clock } from "lucide-react";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input/Input";
import systemSettingsService from "../../../services/systemSettingsService";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { getPayrollCycleInterval } from "../../../utils/payrollCycleUtils";
import { format } from "date-fns";

const SystemSettings: React.FC = () => {
    const [emails, setEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Payroll Cycle Settings State
    const [startDay, setStartDay] = useState(1);
    const [endDay, setEndDay] = useState(31);
    const [preset, setPreset] = useState("standard");
    const [isSavingPayroll, setIsSavingPayroll] = useState(false);

    const [payslipSignature, setPayslipSignature] = useState<string>("");
    const [isSavingSignature, setIsSavingSignature] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Currency Settings State
    const [currencyName, setCurrencyName] = useState("Rupees");
    const [currencySymbol, setCurrencySymbol] = useState("Rs.");
    const [isSavingCurrency, setIsSavingCurrency] = useState(false);

    // Saturday Settings
    const [isSaturdayHalfDay, setIsSaturdayHalfDay] = useState(false);
    const [isSavingSaturday, setIsSavingSaturday] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const allSettings = await systemSettingsService.getSettings();

            // 1. Leave Approval Emails
            const leaveEmailsSetting = allSettings.find((s: any) => s.key === "leave_notification_emails");
            if (leaveEmailsSetting && Array.isArray(leaveEmailsSetting.value)) {
                setEmails(leaveEmailsSetting.value);
            }

            // 2. Payroll Cycle Settings
            const payrollCycleSetting = allSettings.find((s: any) => s.key === "payroll_cycle_settings");
            if (payrollCycleSetting && payrollCycleSetting.value) {
                const val = payrollCycleSetting.value;
                const sd = Number(val.startDay || 1);
                const ed = Number(val.endDay || 31);
                setStartDay(sd);
                setEndDay(ed);

                // Set Preset
                if (sd === 1 && (ed === 30 || ed === 31)) {
                    setPreset("standard");
                } else {
                    setPreset("custom");
                }
            } else {
                setStartDay(1);
                setEndDay(31);
                setPreset("standard");
            }

            // 3. Payslip Signature
            const signatureSetting = allSettings.find((s: any) => s.key === "payslip_signature");
            if (signatureSetting && signatureSetting.value) {
                setPayslipSignature(signatureSetting.value);
            }

            // 4. Currency Settings
            const currencyNameSetting = allSettings.find((s: any) => s.key === "currency_name");
            if (currencyNameSetting) setCurrencyName(currencyNameSetting.value);
            
            const currencySymbolSetting = allSettings.find((s: any) => s.key === "currency_symbol");
            if (currencySymbolSetting) setCurrencySymbol(currencySymbolSetting.value);

            // 5. Saturday Setting
            const saturdaySetting = allSettings.find((s: any) => s.key === "saturday_half_day");
            if (saturdaySetting && saturdaySetting.value) {
                setIsSaturdayHalfDay(!!saturdaySetting.value.enabled);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEmail = () => {
        if (!newEmail) return;
        if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }
        if (emails.includes(newEmail)) {
            toast.error("Email already added");
            return;
        }
        setEmails([...emails, newEmail]);
        setNewEmail("");
    };

    const handleRemoveEmail = (email: string) => {
        setEmails(emails.filter((e) => e !== email));
    };

    const handleSaveEmails = async () => {
        try {
            setIsSaving(true);
            await systemSettingsService.updateSetting({
                key: "leave_notification_emails",
                value: emails,
                description: "Additional email addresses to receive leave application notifications"
            });
            toast.success("Notification settings saved successfully");
        } catch (error) {
            console.error("Error saving email settings:", error);
            toast.error("Failed to save notification settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePresetChange = (newPreset: string) => {
        setPreset(newPreset);
        if (newPreset === "standard") {
            setStartDay(1);
            setEndDay(31);
        }
    };

    const handleSavePayrollCycle = async () => {
        // Validation
        if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
            toast.error("Cycle days must be between 1 and 31");
            return;
        }

        try {
            setIsSavingPayroll(true);
            await systemSettingsService.updateSetting({
                key: "payroll_cycle_settings",
                value: { startDay, endDay },
                description: "Payroll Cycle settings for start and end day of salary computation"
            });
            toast.success("Payroll Cycle settings saved successfully");
        } catch (error) {
            console.error("Error saving payroll cycle settings:", error);
            toast.error("Failed to save payroll cycle settings");
        } finally {
            setIsSavingPayroll(false);
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image must be smaller than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPayslipSignature(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSignature = async () => {
        if (!payslipSignature) {
            toast.error("Please upload a signature first");
            return;
        }
        try {
            setIsSavingSignature(true);
            await systemSettingsService.updateSetting({
                key: "payslip_signature",
                value: payslipSignature,
                description: "Signature image for payslip generation (Base64)"
            });
            toast.success("Payslip signature saved successfully");
        } catch (error) {
            console.error("Error saving signature:", error);
            toast.error("Failed to save payslip signature");
        } finally {
            setIsSavingSignature(false);
        }
    };

    const handleSaveCurrency = async () => {
        try {
            setIsSavingCurrency(true);
            await systemSettingsService.updateSetting({
                key: "currency_name",
                value: currencyName,
                description: "Name of the currency (e.g. Rupees, Dollars, AUD)"
            });
            await systemSettingsService.updateSetting({
                key: "currency_symbol",
                value: currencySymbol,
                description: "Symbol of the currency (e.g. Rs., $, A$)"
            });
            toast.success("Currency settings saved successfully");
        } catch (error) {
            console.error("Error saving currency settings:", error);
            toast.error("Failed to save currency settings");
        } finally {
            setIsSavingCurrency(false);
        }
    };

    const handleSaveSaturday = async () => {
        try {
            setIsSavingSaturday(true);
            await systemSettingsService.updateSetting({
                key: "saturday_half_day",
                value: { enabled: isSaturdayHalfDay },
                description: "Globally apply half-day configuration for Saturdays"
            });
            toast.success("Saturday settings saved successfully");
        } catch (error) {
            console.error("Error saving Saturday settings:", error);
            toast.error("Failed to save Saturday settings");
        } finally {
            setIsSavingSaturday(false);
        }
    };

    // Live Date Preview for May 2026
    const previewDate = new Date(2026, 4, 15); // May 15, 2026
    const interval = getPayrollCycleInterval(previewDate, { startDay, endDay });
    const formattedStart = format(interval.startDate, "MMMM d, yyyy");
    const formattedEnd = format(interval.endDate, "MMMM d, yyyy");
    const start = new Date(interval.startDate.getFullYear(), interval.startDate.getMonth(), interval.startDate.getDate());
    const end = new Date(interval.endDate.getFullYear(), interval.endDate.getMonth(), interval.endDate.getDate());
    const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (isLoading) return <LoadingSpinner fullScreen />;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="mb-4">
                <h1 className="text-2xl font-black text-foreground tracking-tight mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                    System Settings
                </h1>
                <p className="text-sm font-medium text-foreground-tertiary">
                    Configure global application parameters, notification rules, and custom payroll computation intervals.
                </p>
            </div>

            {/* Card 1: Leave Approval Workflow */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Leave Approval Workflow
                    </h2>
                    <p className="text-sm text-foreground-tertiary mt-1">
                        Configure additional email addresses that should receive leave application notifications.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter email address (e.g. admin@company.com)"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                                startAdornment={<Mail className="w-4 h-4" />}
                            />
                        </div>
                        <Button onClick={handleAddEmail} variant="secondaryOutline" className="h-[42px] rounded-xl font-bold uppercase tracking-wider text-[10px]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Email
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                            Configured Email Addresses
                        </label>
                        {emails.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-foreground-tertiary text-xs font-semibold">
                                No additional email addresses configured.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {emails.map((email) => (
                                    <div
                                        key={email}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border group"
                                    >
                                        <span className="text-sm font-medium">{email}</span>
                                        <button
                                            onClick={() => handleRemoveEmail(email)}
                                            className="p-1 hover:bg-error/10 hover:text-error rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button
                        onClick={handleSaveEmails}
                        isLoading={isSaving}
                        className="min-w-[140px] rounded-xl font-bold uppercase tracking-wider text-[10px]"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                    </Button>
                </div>
            </div>

            {/* Card 2: Payroll Cycle Settings */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Payroll Cycle Settings
                    </h2>
                    <p className="text-sm text-foreground-tertiary mt-1">
                        Configure global parameters defining the start and end days for payroll, attendance, and salary cycles.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                            Select Payroll Cycle Option
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handlePresetChange("standard")}
                                className={`p-4 rounded-xl border text-center transition-all ${preset === "standard" ? "border-primary bg-primary/5 text-primary font-bold shadow-sm" : "border-border hover:bg-muted text-foreground-secondary"}`}
                            >
                                <span className="block text-xs uppercase tracking-wider font-black">1st to 30th/31st</span>
                                <span className="block text-[10px] text-foreground-tertiary mt-1 font-medium">Standard Calendar Month</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetChange("custom")}
                                className={`p-4 rounded-xl border text-center transition-all ${preset === "custom" ? "border-primary bg-primary/5 text-primary font-bold shadow-sm" : "border-border hover:bg-muted text-foreground-secondary"}`}
                            >
                                <span className="block text-xs uppercase tracking-wider font-black">Custom Cycle</span>
                                <span className="block text-[10px] text-foreground-tertiary mt-1 font-medium">Manually Configure Days</span>
                            </button>
                        </div>
                    </div>

                    {preset === "custom" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 border border-border/60 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                            <Input
                                label="Cycle Start Day"
                                type="number"
                                min={1}
                                max={31}
                                value={startDay}
                                onChange={(e) => setStartDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                                required
                            />
                            <Input
                                label="Cycle End Day"
                                type="number"
                                min={1}
                                max={31}
                                value={endDay}
                                onChange={(e) => setEndDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                                required
                            />
                        </div>
                    )}

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live Date Preview (Anchor: May 2026)</p>
                            <p className="text-xs font-semibold text-foreground-secondary leading-relaxed">
                                {`Your monthly salary/attendance computations for May 2026 will automatically span from `}
                                <span className="text-primary font-black">{formattedStart}</span>
                                {` to `}
                                <span className="text-primary font-black">{formattedEnd}</span>
                                {` (exactly `}
                                <span className="text-primary font-black">{totalDays} calendar days</span>
                                {`).`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button
                        onClick={handleSavePayrollCycle}
                        isLoading={isSavingPayroll}
                        className="min-w-[140px] rounded-xl font-bold uppercase tracking-wider text-[10px]"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Cycle
                    </Button>
                </div>
            </div>

            {/* Card 3: Payslip Signature Upload */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <FileImage className="w-5 h-5 text-primary" />
                        Payslip Signature
                    </h2>
                    <p className="text-sm text-foreground-tertiary mt-1">
                        Upload the authorized signature image to be displayed on generated employee payslips.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                        {payslipSignature ? (
                            <div className="relative w-full max-w-[300px] aspect-[3/1] bg-white rounded-lg p-4 border flex items-center justify-center shadow-sm">
                                <img src={payslipSignature} alt="Payslip Signature" className="max-h-full object-contain" />
                                <button
                                    onClick={() => setPayslipSignature("")}
                                    className="absolute -top-3 -right-3 p-1.5 bg-error text-white rounded-full hover:bg-error/90 transition-colors shadow-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-full">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Upload Signature Image</p>
                                    <p className="text-xs text-foreground-tertiary">PNG, JPG, or SVG (Max 2MB)</p>
                                </div>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="secondaryOutline"
                                    className="rounded-xl font-bold text-xs px-6 mt-2"
                                >
                                    Choose File
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleSignatureUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button
                        onClick={handleSaveSignature}
                        isLoading={isSavingSignature}
                        disabled={!payslipSignature}
                        className="min-w-[140px] rounded-xl font-bold uppercase tracking-wider text-[10px]"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Signature
                    </Button>
                </div>
            </div>

            {/* Card 5: Saturday Half-Day Settings */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Saturday Working Hours
                    </h2>
                    <p className="text-sm text-foreground-tertiary mt-1">
                        Configure if Saturdays should globally be treated as half-working days (5 hours).
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <label className="flex items-center cursor-pointer group py-2">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isSaturdayHalfDay}
                                onChange={(e) => setIsSaturdayHalfDay(e.target.checked)}
                            />
                            <div className={`w-10 h-5 bg-muted rounded-full transition-colors border border-border ${isSaturdayHalfDay ? "bg-primary/20 border-primary/40" : ""}`} />
                            <div className={`absolute left-1 top-1 w-3 h-3 bg-foreground-tertiary rounded-full transition-all ${isSaturdayHalfDay ? "translate-x-5 bg-primary" : ""}`} />
                        </div>
                        <span className={`ml-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isSaturdayHalfDay ? "text-primary" : "text-foreground-tertiary"}`}>
                            {isSaturdayHalfDay ? "Enabled (Half Day)" : "Disabled (Full Day / Off)"}
                        </span>
                    </label>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button
                        onClick={handleSaveSaturday}
                        isLoading={isSavingSaturday}
                        className="min-w-[140px] rounded-xl font-bold uppercase tracking-wider text-[10px]"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Setting
                    </Button>
                </div>
            </div>

            {/* Card 4: Currency Settings */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-primary" />
                        Currency Settings
                    </h2>
                    <p className="text-sm text-foreground-tertiary mt-1">
                        Configure the default currency name and symbol used across payslips.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Currency Name"
                            placeholder="e.g., Rupees, Dollars, AUD"
                            value={currencyName}
                            onChange={(e) => setCurrencyName(e.target.value)}
                        />
                        <Input
                            label="Currency Symbol"
                            placeholder="e.g., Rs., $, A$"
                            value={currencySymbol}
                            onChange={(e) => setCurrencySymbol(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button
                        onClick={handleSaveCurrency}
                        isLoading={isSavingCurrency}
                        className="min-w-[140px] rounded-xl font-bold uppercase tracking-wider text-[10px]"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Currency
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
