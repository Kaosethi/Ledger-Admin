// src/components/RemoteRegistrationForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import mockDataInstance, { PendingRegistration } from '@/lib/mockData';

interface FormData {
    guardianName: string;
    guardianDob: string;
    guardianContact: string;
    address: string;
    childName: string;
}

const RemoteRegistrationForm: React.FC = () => {
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

        // --- ADDED: Required Field Validation ---
        const requiredFields: { key: keyof FormData | 'pin' | 'confirmPin'; label: string }[] = [
            { key: 'guardianName', label: "Guardian's Full Name" },
            { key: 'guardianDob', label: "Guardian's Date of Birth" },
            { key: 'guardianContact', label: "Guardian's Contact Number" },
            { key: 'address', label: 'Address' },
            { key: 'childName', label: "Child's Full Name" },
            { key: 'pin', label: 'PIN' },
            { key: 'confirmPin', label: 'Confirm PIN' },
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
                 setSubmitError(`${field.label} is required.`);
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
        if (pin.length !== 4) {
            setSubmitError("PIN must be exactly 4 digits.");
            setIsSubmitting(false);
            document.getElementById('pin')?.focus();
            return;
        }
        if (!/^\d{4}$/.test(pin)) { // Should be redundant due to input handling, but good safeguard
            setSubmitError("PIN must contain only digits.");
            setIsSubmitting(false);
            document.getElementById('pin')?.focus();
            return;
        }
        if (pin !== confirmPin) {
            setSubmitError("PINs do not match.");
            setIsSubmitting(false);
            document.getElementById('confirmPin')?.focus();
            return;
        }
        // --- END PIN Validation ---

        console.log("Form Data Submitted:", { ...formData, pin });

        try {
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
            };

            mockDataInstance.pendingRegistrations.push(newPendingRegistration);
            console.log("Added to mockDataInstance.pendingRegistrations:", newPendingRegistration);
            console.log("Current mockDataInstance.pendingRegistrations:", mockDataInstance.pendingRegistrations);

            router.push('/register/success');

        } catch (error) {
             console.error("Submission failed:", error);
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
             setSubmitError(`Submission failed: ${errorMessage}. Please try again later.`);
             setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Guardian's Information Section */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
                 <h2 className="text-xl font-semibold mb-4 text-gray-700">Guardian's Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-1">
                            Guardian's Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" id="guardianName" name="guardianName"
                            value={formData.guardianName} onChange={handleChange}
                            // Removed 'required' as we handle it in JS now
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter Guardian's Full Name"
                            aria-required="true" // Keep for accessibility
                        />
                    </div>
                    <div>
                        <label htmlFor="guardianDob" className="block text-sm font-medium text-gray-700 mb-1">
                            Guardian's Date of Birth <span className="text-red-500">*</span>
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
                        <label htmlFor="guardianContact" className="block text-sm font-medium text-gray-700 mb-1">
                            Guardian's Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel" id="guardianContact" name="guardianContact"
                            value={formData.guardianContact} onChange={handleChange}
                            pattern="[0-9\s\-\+]+" title="Please enter a valid phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter Contact Number"
                             aria-required="true"
                        />
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="address" name="address" rows={3}
                            value={formData.address} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter Full Address"
                            aria-required="true"
                        />
                    </div>
                </div>
            </div>

             {/* Child's Information Section */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Child's Information</h2>
                <div>
                    <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                        Child's Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text" id="childName" name="childName"
                        value={formData.childName} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter Child's Full Name"
                         aria-required="true"
                    />
                </div>
            </div>

            {/* Account Security Section (PIN) */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Account Security</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                            Create 4-Digit PIN <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password" id="pin" name="pin"
                            value={pin} onChange={handleChange}
                            maxLength={4} pattern="\d{4}"
                            title="PIN must be exactly 4 digits"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter 4-digit PIN" autoComplete="new-password"
                             aria-required="true"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm 4-Digit PIN <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password" id="confirmPin" name="confirmPin"
                            value={confirmPin} onChange={handleChange}
                            maxLength={4} pattern="\d{4}"
                            title="PIN must be exactly 4 digits"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Confirm 4-digit PIN" autoComplete="new-password"
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
                    {isSubmitting ? 'Submitting...' : 'Submit Registration Request'}
                </button>
                 <p className="text-sm text-gray-500 mt-3 text-center">
                    Your request will be reviewed by an administrator.
                </p>
            </div>
        </form>
    );
};

export default RemoteRegistrationForm;