// src/components/RemoteRegistrationForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import mockDataInstance, { PendingRegistration } from '@/lib/mockData';
import { TranslationStrings } from '@/lib/translations'; // ADDED: Import TranslationStrings type

interface FormData {
    guardianName: string;
    guardianDob: string;
    guardianContact: string;
    address: string;
    childName: string;
}

// ADDED: Props interface to accept language and translations
interface RemoteRegistrationFormProps {
    language: 'en' | 'th';
    t: TranslationStrings; // t stands for translations
}

// MODIFIED: Update component signature to accept props
const RemoteRegistrationForm: React.FC<RemoteRegistrationFormProps> = ({ language, t }) => {
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        guardianName: '',
        guardianDob: '',
        guardianContact: '',
        address: '',
        childName: '',
    });
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Simple trim for text inputs on change for better UX, but primary validation is on submit
        const processedValue = e.target.type === 'textarea' || e.target.type === 'text' || e.target.type === 'tel' ? value : value;


        if (name === 'pin') {
             if (/^\d*$/.test(processedValue) && processedValue.length <= 4) {
                setPin(processedValue);
            }
        } else if (name === 'confirmPin') {
             if (/^\d*$/.test(processedValue) && processedValue.length <= 4) {
                setConfirmPin(processedValue);
            }
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: processedValue,
            }));
        }
         // Clear error on change for better UX
         if (submitError) {
            setSubmitError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        // MODIFIED: Use translated labels for required field validation
        const requiredFields: { key: keyof FormData | 'pin' | 'confirmPin'; label: string }[] = [
            { key: 'guardianName', label: t.guardianNameLabel },
            { key: 'guardianDob', label: t.guardianDobLabel },
            { key: 'guardianContact', label: t.guardianContactLabel },
            { key: 'address', label: t.addressLabel },
            { key: 'childName', label: t.childNameLabel },
            { key: 'pin', label: t.pinLabel },
            { key: 'confirmPin', label: t.confirmPinLabel },
        ];

        for (const field of requiredFields) {
            let value: string;
            if (field.key === 'pin') {
                value = pin;
            } else if (field.key === 'confirmPin') {
                value = confirmPin;
            } else {
                // Assert field.key is a key of FormData
                value = formData[field.key as keyof FormData];
            }

            // Check if value is empty or just whitespace (for string fields)
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                 // MODIFIED: Use translated error message function
                 setSubmitError(t.requiredField(field.label));
                 setIsSubmitting(false);
                 // Focus the first invalid field for better UX
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
            document.getElementById('pin')?.focus();
            return;
        }
        if (!/^\d{4}$/.test(pin)) { // Should be redundant due to input handling, but good safeguard
            setSubmitError(t.pinMustContainDigits);
            setIsSubmitting(false);
            document.getElementById('pin')?.focus();
            return;
        }
        if (pin !== confirmPin) {
            setSubmitError(t.pinsDoNotMatch);
            setIsSubmitting(false);
            document.getElementById('confirmPin')?.focus();
            return;
        }
        // --- END PIN Validation ---

        console.log("Form Data Submitted:", { ...formData, pin });

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Trim string values before saving
            const trimmedFormData = {
                guardianName: formData.guardianName.trim(),
                guardianDob: formData.guardianDob, // Date is not trimmed
                guardianContact: formData.guardianContact.trim(),
                address: formData.address.trim(),
                childName: formData.childName.trim(),
            };

            const newPendingRegistration: PendingRegistration = {
                id: `PEN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                ...trimmedFormData, // Use trimmed data
                pin: pin, // PIN is already validated
                submittedAt: new Date().toISOString(),
                status: 'Pending',
                // ADDED: Store the language used for submission
                submissionLanguage: language,
            };

            // Directly modify the imported instance (for mock setup)
            mockDataInstance.pendingRegistrations.push(newPendingRegistration);
            console.log("Added to mockDataInstance.pendingRegistrations:", newPendingRegistration);
            console.log("Current mockDataInstance.pendingRegistrations:", mockDataInstance.pendingRegistrations);

            // Redirect to success page
            router.push('/register/success');

        } catch (error) {
             console.error("Submission failed:", error);
             const errorMessage = error instanceof Error ? error.message : t.submissionFailedGeneric; // MODIFIED: Use translated generic error
             // MODIFIED: Use translated error prefix
             setSubmitError(`${t.submissionFailedError} ${errorMessage}. Please try again later.`); // Added generic advice back
             setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Guardian's Information Section */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
                 {/* MODIFIED: Use translated section title */}
                 <h2 className="text-xl font-semibold mb-4 text-gray-700">{t.guardianInfoTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         {/* MODIFIED: Use translated label */}
                        <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.guardianNameLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                        </label>
                        <input
                            type="text" id="guardianName" name="guardianName"
                            value={formData.guardianName} onChange={handleChange}
                            // Removed 'required' as we handle it in JS now
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            // MODIFIED: Use translated placeholder
                            placeholder={t.guardianNamePlaceholder}
                            aria-required="true" // Keep for accessibility
                        />
                    </div>
                    <div>
                         {/* MODIFIED: Use translated label */}
                        <label htmlFor="guardianDob" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.guardianDobLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                        </label>
                        <input
                            type="date" id="guardianDob" name="guardianDob"
                            value={formData.guardianDob} onChange={handleChange}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            aria-required="true"
                        />
                    </div>
                     <div>
                         {/* MODIFIED: Use translated label */}
                        <label htmlFor="guardianContact" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.guardianContactLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                        </label>
                        <input
                            type="tel" id="guardianContact" name="guardianContact"
                            value={formData.guardianContact} onChange={handleChange}
                            pattern="[0-9\s\-\+]+" title="Please enter a valid phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            // MODIFIED: Use translated placeholder
                            placeholder={t.guardianContactPlaceholder}
                             aria-required="true"
                        />
                    </div>
                     <div className="md:col-span-2">
                         {/* MODIFIED: Use translated label */}
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.addressLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                        </label>
                        <textarea
                            id="address" name="address" rows={3}
                            value={formData.address} onChange={handleChange}
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
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t.childInfoTitle}</h2>
                <div>
                     {/* MODIFIED: Use translated label */}
                    <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                        {t.childNameLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                    </label>
                    <input
                        type="text" id="childName" name="childName"
                        value={formData.childName} onChange={handleChange}
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
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t.securityTitle}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         {/* MODIFIED: Use translated label */}
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.pinLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                        </label>
                        <input
                            type="password" id="pin" name="pin"
                            value={pin} onChange={handleChange}
                            maxLength={4} pattern="\d{4}"
                            title="PIN must be exactly 4 digits" // Title attribute not easily translatable without more complex setup
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            // MODIFIED: Use translated placeholder
                            placeholder={t.pinPlaceholder} autoComplete="new-password"
                             aria-required="true"
                        />
                    </div>
                    <div>
                         {/* MODIFIED: Use translated label */}
                        <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.confirmPinLabel} <span className="text-red-500">{t.requiredIndicator}</span>
                        </label>
                        <input
                            type="password" id="confirmPin" name="confirmPin"
                            value={confirmPin} onChange={handleChange}
                            maxLength={4} pattern="\d{4}"
                            title="PIN must be exactly 4 digits" // Title attribute not easily translatable without more complex setup
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            // MODIFIED: Use translated placeholder
                            placeholder={t.confirmPinPlaceholder} autoComplete="new-password"
                             aria-required="true"
                        />
                    </div>
                 </div>
            </div>


            {/* Submission Area */}
            <div className="flex flex-col items-center mt-8">
                 {submitError && <p className="text-red-600 mb-4 text-center font-medium" role="alert">{submitError}</p>} {/* Added role="alert" */}

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