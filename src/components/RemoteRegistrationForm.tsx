// src/components/RemoteRegistrationForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import mockDataInstance, { PendingRegistration } from "@/lib/mockData";
import { TranslationStrings } from "@/lib/translations"; // ADDED: Import TranslationStrings type
import { Input } from "@/components/ui/input"; // Assuming Input is used, keep if so
import { Label } from "@/components/ui/label"; // ADDED: ShadCN Label
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"; // ADDED: ShadCN Select components

interface FormData {
  guardianName: string;
  guardianContact: string;
  address: string;
  childName: string;
}

// ADDED: Props interface to accept language and translations
interface RemoteRegistrationFormProps {
  language: "en" | "th";
  t: TranslationStrings; // t stands for translations
}

// MODIFIED: Update component signature to accept props
const RemoteRegistrationForm: React.FC<RemoteRegistrationFormProps> = ({
  language,
  t,
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    guardianName: "",
    guardianContact: "",
    address: "",
    childName: "",
  });
  // ADDED: State for Guardian's Date of Birth components
  const [guardianDobYear, setGuardianDobYear] = useState<string>("");
  const [guardianDobMonth, setGuardianDobMonth] = useState<string>("");
  const [guardianDobDay, setGuardianDobDay] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const processedValue = value; // Simplified, assuming specific handlers for complex inputs

    if (name === "pin") {
      if (/^\d*$/.test(processedValue) && processedValue.length <= 4) {
        setPin(processedValue);
      }
    } else if (name === "confirmPin") {
      if (/^\d*$/.test(processedValue) && processedValue.length <= 4) {
        setConfirmPin(processedValue);
      }
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: processedValue,
      }));
    }
    // Clear error on change for better UX
    if (submitError) {
      setSubmitError(null);
    }
  };

  // ADDED: useEffect to clear day if month/year changes and day becomes invalid
  useEffect(() => {
    if (guardianDobYear && guardianDobMonth && guardianDobDay) {
      const daysInMonth = new Date(
        Number(guardianDobYear),
        Number(guardianDobMonth),
        0
      ).getDate();
      if (Number(guardianDobDay) > daysInMonth) {
        setGuardianDobDay(""); // Reset day if it's no longer valid
      }
    }
  }, [guardianDobYear, guardianDobMonth, guardianDobDay]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Construct guardianDob from state
    const guardianDob =
      guardianDobYear && guardianDobMonth && guardianDobDay
        ? `${guardianDobYear}-${guardianDobMonth.padStart(
            2,
            "0"
          )}-${guardianDobDay.padStart(2, "0")}`
        : "";

    const requiredFields: {
      key: keyof FormData | "pin" | "confirmPin" | "guardianDob";
      label: string;
    }[] = [
      { key: "guardianName", label: t.guardianNameLabel },
      { key: "guardianContact", label: t.guardianContactLabel },
      { key: "address", label: t.addressLabel },
      { key: "childName", label: t.childNameLabel },
      { key: "pin", label: t.pinLabel },
      { key: "confirmPin", label: t.confirmPinLabel },
    ];

    // Custom validation for DOB selectors
    if (!guardianDobYear || !guardianDobMonth || !guardianDobDay) {
      setSubmitError(t.requiredField(t.guardianDobLabel));
      setIsSubmitting(false);
      // Potentially focus the first empty DOB select, or a general DOB area
      // document.getElementById('guardianDobYear')?.focus(); // Example
      return;
    }

    for (const field of requiredFields) {
      let value: string;
      if (field.key === "pin") {
        value = pin;
      } else if (field.key === "confirmPin") {
        value = confirmPin;
      } else if (field.key === "guardianDob") {
        // Check for the constructed guardianDob
        value = guardianDob;
      } else {
        value = formData[field.key as keyof FormData];
      }

      if (!value || (typeof value === "string" && value.trim() === "")) {
        setSubmitError(t.requiredField(field.label));
        setIsSubmitting(false);
        const inputElement = document.getElementById(field.key);
        if (inputElement) {
          inputElement.focus();
        }
        return;
      }
    }
    // --- END Required Field Validation ---

    // --- PIN Format/Match Validation (Existing) ---
    // MODIFIED: Use translated PIN validation messages
    if (pin.length !== 4) {
      setSubmitError(t.pinMustBe4Digits);
      setIsSubmitting(false);
      document.getElementById("pin")?.focus();
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      // Should be redundant due to input handling, but good safeguard
      setSubmitError(t.pinMustContainDigits);
      setIsSubmitting(false);
      document.getElementById("pin")?.focus();
      return;
    }
    if (pin !== confirmPin) {
      setSubmitError(t.pinsDoNotMatch);
      setIsSubmitting(false);
      document.getElementById("confirmPin")?.focus();
      return;
    }
    // --- END PIN Validation ---

    console.log("Form Data Submitted:", { ...formData, pin });

    try {
      // Prepare the data for API submission
      const registrationData = {
        ...formData,
        guardianDob,
        pin,
        submissionLanguage: language,
      };

      // Send the data to our API endpoint
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit registration");
      }

      const result = await response.json();
      console.log("Registration successful:", result);

      // Redirect to success page
      router.push("/register/success");
    } catch (error) {
      console.error("Submission failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : t.submissionFailedGeneric;
      setSubmitError(
        `${t.submissionFailedError} ${errorMessage}. Please try again later.`
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Guardian's Information Section */}
      <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* MODIFIED: Use translated section title */}
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {t.guardianInfoTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* MODIFIED: Use translated label */}
            <Label
              htmlFor="guardianName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.guardianNameLabel}{" "}
              <span className="text-red-500">{t.requiredIndicator}</span>
            </Label>
            <Input
              type="text"
              id="guardianName"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleChange}
              // Removed 'required' as we handle it in JS now
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              // MODIFIED: Use translated placeholder
              placeholder={t.guardianNamePlaceholder}
              aria-required="true" // Keep for accessibility
            />
          </div>
          {/* MODIFIED: Guardian's Date of Birth - Replaced with Select components */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {t.guardianDobLabel}{" "}
              <span className="text-red-500">{t.requiredIndicator}</span>
            </Label>
            <div className="flex gap-2">
              {/* Year Selector */}
              <Select
                value={guardianDobYear}
                onValueChange={setGuardianDobYear}
              >
                <SelectTrigger
                  id="guardianDobYear"
                  className="w-full sm:w-24"
                  aria-label={t.yearPlaceholder || "Year"}
                >
                  <SelectValue placeholder={t.yearPlaceholder || "Year"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 100 }, (_, i) => {
                    const currentYear = new Date().getFullYear();
                    // Guardian should be at least 18
                    const year = currentYear - 18 - i;
                    return (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {/* Month Selector */}
              <Select
                value={guardianDobMonth}
                onValueChange={setGuardianDobMonth}
              >
                <SelectTrigger
                  id="guardianDobMonth"
                  className="w-full sm:w-28"
                  aria-label={t.pinPlaceholder || "Month"}
                >
                  <SelectValue placeholder={t.pinPlaceholder || "Month"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2000, i, 1).toLocaleString(language, {
                        month: "short",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Day Selector */}
              <Select
                value={guardianDobDay}
                onValueChange={setGuardianDobDay}
                disabled={!guardianDobYear || !guardianDobMonth}
              >
                <SelectTrigger
                  id="guardianDobDay"
                  className="w-full sm:w-20"
                  aria-label={t.yearPlaceholder || "Day"}
                  disabled={!guardianDobYear || !guardianDobMonth}
                >
                  <SelectValue placeholder={t.yearPlaceholder || "Day"} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const daysInMonth =
                      guardianDobYear && guardianDobMonth
                        ? new Date(
                            Number(guardianDobYear),
                            Number(guardianDobMonth),
                            0
                          ).getDate()
                        : 31;
                    return Array.from({ length: daysInMonth }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            {/* MODIFIED: Use translated label */}
            <Label
              htmlFor="guardianContact"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.guardianContactLabel}{" "}
              <span className="text-red-500">{t.requiredIndicator}</span>
            </Label>
            <Input
              type="tel"
              id="guardianContact"
              name="guardianContact"
              value={formData.guardianContact}
              onChange={handleChange}
              pattern="[0-9\s\-\+]+"
              title="Please enter a valid phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              // MODIFIED: Use translated placeholder
              placeholder={t.guardianContactPlaceholder}
              aria-required="true"
            />
          </div>
          <div className="md:col-span-2">
            {/* MODIFIED: Use translated label */}
            <Label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.addressLabel}{" "}
              <span className="text-red-500">{t.requiredIndicator}</span>
            </Label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              // MODIFIED: Use translated placeholder
              placeholder={t.addressPlaceholder}
              aria-required="true"
            />
          </div>
        </div>
      </div>

      {/* Child's Information Section */}
      <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* MODIFIED: Use translated section title */}
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {t.childInfoTitle}
        </h2>
        <div>
          {/* MODIFIED: Use translated label */}
          <Label
            htmlFor="childName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t.childNameLabel}{" "}
            <span className="text-red-500">{t.requiredIndicator}</span>
          </Label>
          <Input
            type="text"
            id="childName"
            name="childName"
            value={formData.childName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            // MODIFIED: Use translated placeholder
            placeholder={t.childNamePlaceholder}
            aria-required="true"
          />
        </div>
      </div>

      {/* Account Security Section (PIN) */}
      <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* MODIFIED: Use translated section title */}
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {t.securityTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* MODIFIED: Use translated label */}
            <Label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.pinLabel}{" "}
              <span className="text-red-500">{t.requiredIndicator}</span>
            </Label>
            <Input
              type="password"
              id="pin"
              name="pin"
              value={pin}
              onChange={handleChange}
              maxLength={4}
              pattern="\d{4}"
              title="PIN must be exactly 4 digits" // Title attribute not easily translatable without more complex setup
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              // MODIFIED: Use translated placeholder
              placeholder={t.pinPlaceholder}
              autoComplete="new-password"
              aria-required="true"
            />
          </div>
          <div>
            {/* MODIFIED: Use translated label */}
            <Label
              htmlFor="confirmPin"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t.confirmPinLabel}{" "}
              <span className="text-red-500">{t.requiredIndicator}</span>
            </Label>
            <Input
              type="password"
              id="confirmPin"
              name="confirmPin"
              value={confirmPin}
              onChange={handleChange}
              maxLength={4}
              pattern="\d{4}"
              title="PIN must be exactly 4 digits" // Title attribute not easily translatable without more complex setup
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              // MODIFIED: Use translated placeholder
              placeholder={t.confirmPinPlaceholder}
              autoComplete="new-password"
              aria-required="true"
            />
          </div>
        </div>
      </div>

      {/* Submission Area */}
      <div className="flex flex-col items-center mt-8">
        {submitError && (
          <p className="text-red-600 mb-4 text-center font-medium" role="alert">
            {submitError}
          </p>
        )}{" "}
        {/* Added role="alert" */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {/* MODIFIED: Use translated button text */}
          {isSubmitting ? t.submittingButton : t.submitButton}
        </button>
        {/* MODIFIED: Use translated notice */}
        <p className="text-sm text-gray-500 mt-3 text-center">
          {t.submissionNotice}
        </p>
      </div>
    </form>
  );
};

export default RemoteRegistrationForm;
