import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from '../../components/common/Modal/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input/Input';
import FormSelect from '../../components/common/Select/FormSelect';
import type { ShiftData } from '../../types/schedule.types';
import type { User as UserType } from '../../types/user.types';
import type { OfficeLocation } from '../../types/organization.types';
import FormError from '../../components/common/FormError/FormError';
import { getErrorMessage } from '../../utils/errorHandling';
import { User, Calendar, Clock, MapPin, CheckCircle2, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import TextArea from '../../components/common/Input/TextArea';

export interface ShiftEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ShiftFormData, appliedFields?: string[]) => Promise<void>;
    shift?: ShiftData | null;
    editingTimeIndex?: number | null;
    prefilledEmployeeId?: string;
    prefilledEmployeeName?: string;
    prefilledDate?: Date;
    employees: UserType[];
    locations: OfficeLocation[];
    existingShifts?: ShiftData[];
    isBulkMode?: boolean;
    selectedEmployeeIds?: string[];
}

export interface ShiftFormData {
    employeeId: string;
    date: string;
    shiftType: 'day' | 'off';
    startTime?: string;
    endTime?: string;
    location?: string;
    notes?: string;
}

const ShiftEditor: React.FC<ShiftEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    shift,
    editingTimeIndex,
    prefilledEmployeeId,
    prefilledEmployeeName,
    prefilledDate,
    employees,
    locations,
    existingShifts = [],
    isBulkMode = false,
    selectedEmployeeIds = [],
}) => {
    const [formData, setFormData] = useState<ShiftFormData>({
        employeeId: '',
        date: '',
        shiftType: 'day',
        startTime: '09:00',
        endTime: '17:00',
        location: '',
        notes: '',
    });

    const [appliedFields, setAppliedFields] = useState<string[]>(['date', 'shiftType', 'startTime', 'endTime', 'location', 'notes']);
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (shift) {
                const startArray = Array.isArray(shift.startTime) ? shift.startTime : [shift.startTime];
                const endArray = Array.isArray(shift.endTime) ? shift.endTime : [shift.endTime];
                const idx = editingTimeIndex !== null && editingTimeIndex !== undefined ? editingTimeIndex : 0;

                let dateStr = shift.date || '';
                if (dateStr.includes('T')) {
                    dateStr = dateStr.split('T')[0];
                }

                setFormData({
                    employeeId: prefilledEmployeeId || shift.employeeId,
                    date: dateStr,
                    shiftType: shift.shiftType === 'off' ? 'off' : 'day',
                    startTime: (startArray[idx] as string) || '09:00',
                    endTime: (endArray[idx] as string) || '17:00',
                    location: shift.location || '',
                    notes: shift.notes || '',
                });
            } else {
                setFormData({
                    employeeId: prefilledEmployeeId || '',
                    date: prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '',
                    shiftType: 'day',
                    startTime: '09:00',
                    endTime: '17:00',
                    location: locations[0]?.name || '',
                    notes: '',
                });
            }
            setErrors({});
            // reset applied fields on open
            setAppliedFields(['date', 'shiftType', 'startTime', 'endTime', 'location', 'notes']);
        }
    }, [isOpen, shift, editingTimeIndex, prefilledEmployeeId, prefilledEmployeeName, prefilledDate, locations]);

    const validate = (): boolean => {
        const newErrors: Record<string, string | string[]> = {};

        if (!isBulkMode && !formData.employeeId) {
            newErrors.employeeId = 'Employee is required';
        }

        if ((!isBulkMode || appliedFields.includes('date')) && !formData.date) {
            newErrors.date = 'Date is required';
        }

        if ((!isBulkMode || appliedFields.includes('shiftType')) && formData.shiftType !== 'off') {
            if (appliedFields.includes('startTime') && !formData.startTime) {
                newErrors.startTime = 'Start time is required';
            }
            if (appliedFields.includes('endTime') && !formData.endTime) {
                newErrors.endTime = 'End time is required';
            }
            if (formData.startTime === formData.endTime) {
                newErrors.endTime = 'End time cannot be same as start time';
            }

            // Overlap validation
            if (!isBulkMode && formData.startTime && formData.endTime && existingShifts.length > 0) {
                const dayShift = existingShifts[0];
                const startTimes = Array.isArray(dayShift.startTime) ? dayShift.startTime : [dayShift.startTime].filter(Boolean);
                const endTimes = Array.isArray(dayShift.endTime) ? dayShift.endTime : [dayShift.endTime].filter(Boolean);

                const currentStart = formData.startTime;
                let currentEnd = formData.endTime;
                if (currentEnd < currentStart) {
                    // Normalize for comparison
                    const [h, m] = currentEnd.split(':').map(Number);
                    currentEnd = `${h + 24}:${m.toString().padStart(2, '0')}`;
                }

                for (let i = 0; i < startTimes.length; i++) {
                    // Skip the slot we are currently editing
                    if (shift && editingTimeIndex === i) continue;

                    const otherStart = startTimes[i] as string;
                    let otherEnd = endTimes[i] as string;
                    if (otherEnd < otherStart) {
                        const [h, m] = otherEnd.split(':').map(Number);
                        otherEnd = `${h + 24}:${m.toString().padStart(2, '0')}`;
                    }

                    if (currentStart < otherEnd && currentEnd > otherStart) {
                        newErrors.endTime = `This time slot overlaps with an existing shift (${startTimes[i]} - ${endTimes[i]})`;
                        break;
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setIsSaving(true);
            await onSave(formData, isBulkMode ? appliedFields : undefined);
            onClose();
        } catch (error) {
            console.error('Failed to save shift:', error);
            const errorMessage = getErrorMessage(error, 'Failed to save shift. Please try again.');
            setErrors({ submit: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof ShiftFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const toggleField = (field: string) => {
        setAppliedFields(prev =>
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    const selectedEmployeeNames = React.useMemo(() => {
        return employees
            .filter(emp => selectedEmployeeIds.includes(emp._id) || selectedEmployeeIds.includes(emp.id))
            .map(emp => `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`);
    }, [employees, selectedEmployeeIds]);

    const employeeOptions = React.useMemo(() => {
        const result = employees.map(emp => ({
            value: emp._id,
            label: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        }));

        if (prefilledEmployeeId && prefilledEmployeeName) {
            const exists = result.some(opt => opt.value === prefilledEmployeeId);
            if (!exists) {
                result.push({
                    value: prefilledEmployeeId,
                    label: prefilledEmployeeName,
                });
            }
        }
        return result;
    }, [employees, prefilledEmployeeId, prefilledEmployeeName]);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={isBulkMode ? 'Flexible Bulk Edit' : (shift ? 'Modify Shift' : 'Create New Shift')}
            maxWidth="md"
            // className="rounded-[2.5rem]"
            actions={
                <>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full sm:w-auto rounded-2xl"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={isSaving}
                        className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20"
                        startIcon={isBulkMode ? <CheckCircle2 className="w-4 h-4" /> : undefined}
                    >
                        {isBulkMode ? `Update ${selectedEmployeeIds.length} Schedules` : (shift ? 'Save Changes' : 'Draft Shift')}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Bulk Context Display */}
                {isBulkMode && (
                    <div className="bg-primary/5 rounded-[2rem] p-5 border border-primary/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-primary uppercase tracking-tight">Bulk Editing Workforce</h4>
                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Select which fields to overwrite</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedEmployeeNames.slice(0, 10).map((name, i) => (
                                <span key={i} className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold text-foreground-secondary border border-primary/5 shadow-sm">
                                    {name}
                                </span>
                            ))}
                            {selectedEmployeeNames.length > 10 && (
                                <span className="px-3 py-1 bg-primary/10 rounded-lg text-[10px] font-black text-primary border border-primary/10">
                                    + {selectedEmployeeNames.length - 10} others
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <FormError message={errors.submit} />

                {/* Employee Selection (Individual Mode Only) */}
                {!isBulkMode && (
                    <div className="group transition-all">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-2 px-1">
                            <User className="w-3 h-3 text-primary" />
                            Employee
                        </label>
                        <FormSelect
                            value={formData.employeeId}
                            onChange={(val) => handleChange('employeeId', val)}
                            options={employeeOptions}
                            required
                            placeholder="Select Employee"
                            className="w-full"
                            disabled={!!shift || !!prefilledEmployeeId}
                        />
                        {errors.employeeId && (
                            <p className="text-xs text-red-500 mt-2 px-1 font-bold">{errors.employeeId}</p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Field */}
                    <div className={cn("relative p-4 rounded-2xl border transition-all",
                        isBulkMode && (appliedFields.includes('date') ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border/40 opacity-60"))}>
                        {isBulkMode && (
                            <input
                                type="checkbox"
                                checked={appliedFields.includes('date')}
                                onChange={() => toggleField('date')}
                                className="absolute top-4 right-4 w-4 h-4 rounded border-primary text-primary focus:ring-primary/20"
                            />
                        )}
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-3">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            Date Selection
                        </label>
                        <Input
                            type="date"
                            value={formData.date}
                            required
                            onChange={(e) => handleChange('date', e.target.value)}
                            disabled={(isBulkMode && !appliedFields.includes('date')) || !!shift}
                            className="bg-surface border-border/40"
                        />
                        {errors.date && (
                            <p className="text-xs text-red-500 mt-2 px-1 font-bold">{errors.date}</p>
                        )}
                    </div>

                    {/* Shift Type Field */}
                    <div className={cn("relative p-4 rounded-2xl border transition-all",
                        isBulkMode && (appliedFields.includes('shiftType') ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border/40 opacity-60"))}>
                        {isBulkMode && (
                            <input
                                type="checkbox"
                                checked={appliedFields.includes('shiftType')}
                                onChange={() => toggleField('shiftType')}
                                className="absolute top-4 right-4 w-4 h-4 rounded border-primary text-primary focus:ring-primary/20"
                            />
                        )}
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-3">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Shift Mode
                        </label>
                        <FormSelect
                            value={formData.shiftType}
                            onChange={(val) => handleChange('shiftType', val as 'day' | 'off')}
                            required
                            options={[
                                { value: 'day', label: 'Work Shift' },
                                { value: 'off', label: 'Off Duty' },
                            ]}
                            disabled={isBulkMode && !appliedFields.includes('shiftType')}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Time Fields */}
                {formData.shiftType !== 'off' && (
                    <div className={cn("relative p-6 rounded-[1.5rem] border transition-all",
                        isBulkMode && ((appliedFields.includes('startTime') || appliedFields.includes('endTime')) ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border/40 opacity-60"))}>
                        {isBulkMode && (
                            <div className="absolute top-4 right-4 flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-foreground-tertiary uppercase">Start</span>
                                    <input type="checkbox" checked={appliedFields.includes('startTime')} onChange={() => toggleField('startTime')} className="w-3 h-3 rounded text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-foreground-tertiary uppercase">End</span>
                                    <input type="checkbox" checked={appliedFields.includes('endTime')} onChange={() => toggleField('endTime')} className="w-3 h-3 rounded text-primary" />
                                </div>
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-4">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Shift Timing
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    required
                                    onChange={(e) => handleChange('startTime', e.target.value)}
                                    disabled={isBulkMode && !appliedFields.includes('startTime')}
                                />
                                {errors.startTime && (
                                    <p className="text-xs text-red-500 mt-2 px-1 font-bold">{errors.startTime}</p>
                                )}
                            </div>
                            <div>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    required
                                    onChange={(e) => handleChange('endTime', e.target.value)}
                                    disabled={isBulkMode && !appliedFields.includes('endTime')}
                                />
                                {errors.endTime && (
                                    <p className="text-xs text-red-500 mt-2 px-1 font-bold">{errors.endTime}</p>
                                )}
                            </div>
                        </div>
                        {formData.startTime && formData.endTime && formData.endTime < formData.startTime && (
                            <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-primary/10 border border-primary/20 rounded-xl animate-in slide-in-from-top-1 duration-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-tight">Overnight Shift (Ends Next Day)</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Location & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={cn("relative p-4 rounded-2xl border transition-all",
                        isBulkMode && (appliedFields.includes('location') ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border/40 opacity-60"))}>
                        {isBulkMode && (
                            <input type="checkbox" checked={appliedFields.includes('location')} onChange={() => toggleField('location')} className="absolute top-4 right-4 w-4 h-4 rounded text-primary" />
                        )}
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary tracking-widest mb-3">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            Work Location
                        </label>
                        <FormSelect
                            value={formData.location}
                            onChange={(val) => handleChange('location', val)}
                            options={locations.map(loc => ({ value: loc.name, label: loc.name }))}
                            disabled={isBulkMode && !appliedFields.includes('location')}
                            className="w-full"
                        />
                    </div>

                    <div className={cn("relative p-4 rounded-2xl border transition-all",
                        isBulkMode && (appliedFields.includes('notes') ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border/40 opacity-60"))}>
                        {isBulkMode && (
                            <input type="checkbox" checked={appliedFields.includes('notes')} onChange={() => toggleField('notes')} className="absolute top-4 right-4 w-4 h-4 rounded text-primary" />
                        )}
                        <TextArea
                            label="Internal Notes"
                            placeholder="Add brief details..."
                            value={formData.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            disabled={isBulkMode && !appliedFields.includes('notes')}
                            maxLength={500}
                            rows={1}
                            className="bg-surface"
                            error={!!errors.notes}
                            helperText={errors.notes as string}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShiftEditor;

