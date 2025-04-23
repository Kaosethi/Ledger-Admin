// src/app/register/page.tsx
'use client'; // Mark as client component because it contains the form component

import React from 'react';
// import RemoteRegistrationForm from '@/components/RemoteRegistrationForm'; // Adjust path if needed
// import RemoteRegistrationForm from '../../components/RemoteRegistrationForm';
import RemoteRegistrationForm from '@/components/RemoteRegistrationForm';

export default function RegisterPage() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-semibold mb-6 text-center">
                Beneficiary Account Registration
            </h1>
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
                {/* ADDED: Render the new remote registration form component */}
                <RemoteRegistrationForm />
            </div>
        </div>
    );
}