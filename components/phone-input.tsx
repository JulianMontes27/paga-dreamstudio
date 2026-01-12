"use client";

import React, { forwardRef, useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, disabled = false, placeholder = "Ingresa tu número" }, ref) => {
    const [countryCode, setCountryCode] = useState('+57'); // Colombia default

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const phoneNumber = e.target.value;
      // Only allow numbers
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      onChange(countryCode + cleanNumber);
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCode = e.target.value;
      setCountryCode(newCode);
      // Update the full phone number with new country code
      const phoneWithoutCode = value.replace(/^\+\d+/, '');
      onChange(newCode + phoneWithoutCode);
    };

    // Extract phone number without country code for display
    const phoneDisplay = value.replace(/^\+\d+/, '');

    return (
      <div className="w-full">
        <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <select
              value={countryCode}
              onChange={handleCountryChange}
              disabled={disabled}
              className="bg-transparent border-none outline-none text-sm cursor-pointer pr-2"
            >
              <option value="+57">🇨🇴 +57</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+52">🇲🇽 +52</option>
              <option value="+54">🇦🇷 +54</option>
              <option value="+56">🇨🇱 +56</option>
              <option value="+51">🇵🇪 +51</option>
            </select>
            <input
              ref={ref}
              type="tel"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              disabled={disabled}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
