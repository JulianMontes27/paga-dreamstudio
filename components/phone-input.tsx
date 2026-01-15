"use client";

import React, { forwardRef } from "react";
import PhoneInputWithCountry from "react-phone-number-input";
import type { E164Number } from "libphonenumber-js/core";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const InputComponent = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input {...props} ref={ref} />);
InputComponent.displayName = "PhoneInputComponent";

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({
    value,
    onChange,
    error,
    disabled = false,
    placeholder = "Ingresa tu número",
  }) => {
    return (
      <div className="w-full">
        <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5 p-4">
          <PhoneInputWithCountry
            international
            defaultCountry="CO"
            value={value as E164Number | undefined}
            onChange={(val) => onChange(val || "")}
            disabled={disabled}
            placeholder={placeholder}
            inputComponent={InputComponent}
          />
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

        <style jsx global suppressHydrationWarning>{`
          /* Override default PhoneInput styles */
          .PhoneInput {
            display: flex;
            align-items: center;
          }

          /* Country selector */
          .PhoneInputCountry {
            position: relative;
            align-self: stretch;
            display: flex;
            align-items: center;
            margin-right: 1rem;
          }

          .PhoneInputCountry:focus,
          .PhoneInputCountry:focus-visible,
          .PhoneInputCountry:focus-within {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Flag */
          .PhoneInputCountryIcon {
            width: 1.25rem;
            height: 1.25rem;
            border: none;
            outline: none;
          }

          .PhoneInputCountryIcon--border {
            box-shadow: none;
            background-color: transparent;
            border: none;
          }

          .PhoneInputCountryIconImg {
            display: block;
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
          }

          /* Country select - hide text, only show on hover/click */
          .PhoneInputCountrySelect {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            z-index: 1;
            border: 0;
            opacity: 0;
            cursor: pointer;
            outline: none;
          }

          .PhoneInputCountrySelect:focus,
          .PhoneInputCountrySelect:focus-visible,
          .PhoneInputCountrySelect:active {
            outline: none !important;
            box-shadow: none !important;
          }

          .PhoneInputCountrySelect:focus + .PhoneInputCountryIcon,
          .PhoneInputCountrySelect:focus-visible + .PhoneInputCountryIcon {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }

          .PhoneInputCountryIcon:focus,
          .PhoneInputCountryIcon:focus-visible {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Arrow indicator */
          .PhoneInputCountrySelectArrow {
            display: block;
            content: "";
            width: 0.3rem;
            height: 0.3rem;
            margin-left: 0.5rem;
            border-style: solid;
            border-color: hsl(var(--muted-foreground));
            border-top-width: 0;
            border-bottom-width: 1px;
            border-left-width: 0;
            border-right-width: 1px;
            transform: rotate(45deg);
            opacity: 0.5;
          }

          /* Input field */
          .PhoneInputInput {
            flex: 1;
            min-width: 0;
            background: transparent;
            border: none;
            outline: none;
            font-size: 0.875rem;
            color: hsl(var(--foreground));
          }

          .PhoneInputInput::placeholder {
            color: hsl(var(--muted-foreground));
            opacity: 0.6;
          }

          .PhoneInputInput:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Dark mode */
          .dark .PhoneInputCountrySelect option {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
          }
        `}</style>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
