// src/app/register/page.tsx
'use client'; // Mark as client component because it contains the form component and state

import React, { useState } from 'react'; // MODIFIED: Import useState
import RemoteRegistrationForm from '@/components/RemoteRegistrationForm';
import { translations, TranslationStrings } from '@/lib/translations'; // ADDED: Import translations

// ADDED: Define available languages type
type Language = 'en' | 'th';

export default function RegisterPage() {
    // ADDED: State for current language
    const [language, setLanguage] = useState<Language>('en');

    // ADDED: Function to handle language change
    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
    };

    // ADDED: Get translations for the current language
    const currentTranslations: TranslationStrings = translations[language];

    return (
        <div className="container mx-auto p-4 md:p-8">
            {/* ADDED: Language switcher */}
            <div className="flex justify-end mb-4 space-x-2">
                <button
                    onClick={() => handleLanguageChange('en')}
                    className={`px-3 py-1 rounded ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    {currentTranslations.switchToEnglish} {/* Use translation key */}
                </button>
                <button
                    onClick={() => handleLanguageChange('th')}
                    className={`px-3 py-1 rounded ${language === 'th' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    {currentTranslations.switchToThai} {/* Use translation key */}
                </button>
            </div>
            {/* END ADDED: Language switcher */}

            <h1 className="text-2xl font-semibold mb-6 text-center">
                 {/* MODIFIED: Use translated page title */}
                {currentTranslations.pageTitle}
            </h1>
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
                 {/* MODIFIED: Pass language and translations to the form component */}
                <RemoteRegistrationForm language={language} t={currentTranslations} />
            </div>
        </div>
    );
}