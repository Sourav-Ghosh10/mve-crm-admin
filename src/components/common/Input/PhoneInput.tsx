import React, { useState, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { COUNTRY_CODES } from "../../../utils/countryCodes";

export interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value = "",
  onChange,
  error,
  helperText,
  required,
  placeholder = "Enter phone number",
  disabled,
  className,
}) => {
  // Parse initial value (expected format: "+91 9876543210" or just "9876543210")
  const [dialCode, setDialCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (value) {
      const parts = value.split(" ");
      if (parts.length >= 2 && parts[0].startsWith("+")) {
        setDialCode(parts[0]);
        setPhoneNumber(parts.slice(1).join(" "));
      } else if (value.startsWith("+")) {
        // Fallback if no space but starts with +
        // This is tricky without a full library, but we'll try to match against COUNTRY_CODES
        const matchingCode = COUNTRY_CODES.find(c => value.startsWith(c.dial_code));
        if (matchingCode) {
          setDialCode(matchingCode.dial_code);
          setPhoneNumber(value.substring(matchingCode.dial_code.length).trim());
        } else {
          setPhoneNumber(value);
        }
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handleDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDialCode = e.target.value;
    setDialCode(newDialCode);
    if (onChange) {
      onChange(`${newDialCode} ${phoneNumber}`.trim());
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value.replace(/\D/g, ""); // Only allow digits
    setPhoneNumber(newPhoneNumber);
    if (onChange) {
      onChange(`${dialCode} ${newPhoneNumber}`.trim());
    }
  };

  return (
    <div className={cn("mb-3 sm:mb-4", className)}>
      {label && (
        <div className="flex justify-between items-end mb-1.5 px-1">
          <label className="block text-[10px] sm:text-[11px] font-black text-foreground-tertiary uppercase tracking-widest">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative shrink-0 w-[100px] sm:w-[130px]">
          <select
            value={dialCode}
            onChange={handleDialCodeChange}
            disabled={disabled}
            className={cn(
              "w-full h-full appearance-none px-3 pr-8 py-2.5 sm:py-3.5 border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md outline-none text-xs sm:text-sm font-medium transition-all duration-300",
              "focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 focus:border-primary",
              error ? "border-error" : "border-border hover:border-primary/40",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {COUNTRY_CODES.map((country) => (
              <option key={`${country.code}-${country.dial_code}`} value={country.dial_code}>
                {country.flag} {country.dial_code} ({country.code})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-foreground-tertiary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 px-4 sm:px-5 py-2.5 sm:py-3.5 border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md transition-all duration-300 outline-none text-sm",
            "focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 focus:border-primary focus:shadow-lg sm:focus:shadow-xl",
            "placeholder:text-foreground-tertiary/50",
            error ? "border-error focus:ring-error" : "border-border hover:border-primary/40",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      {helperText && (
        <p className={cn("mt-1 sm:mt-1.5 text-[10px] sm:text-xs", error ? "text-error" : "text-foreground-secondary")}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
