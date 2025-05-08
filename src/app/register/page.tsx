// src/app/register/page.tsx
"use client"; // Mark as client component because it contains the form component and state

import React, { useState } from "react"; // MODIFIED: Import useState
import RemoteRegistrationForm from "@/components/RemoteRegistrationForm";
import { translations, TranslationStrings } from "@/lib/translations"; // ADDED: Import translations
import { Button } from "@/components/ui/button"; // ADDED: Import ShadCN Button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // ADDED: Import ShadCN Card components
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // OPTIONAL: For a dropdown language switcher

// ADDED: Define available languages type
type Language = "en" | "th";

export default function RegisterPage() {
  // ADDED: State for current language
  const [language, setLanguage] = useState<Language>("en");

  // ADDED: Function to handle language change
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // ADDED: Get translations for the current language
  const currentTranslations: TranslationStrings = translations[language];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="w-full shadow-lg">
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl sm:text-2xl font-semibold">
                {currentTranslations.pageTitle}
              </CardTitle>

              <div className="flex space-x-2 self-end sm:self-auto">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("en")}
                  size="sm"
                >
                  {currentTranslations.switchToEnglish}
                </Button>
                <Button
                  variant={language === "th" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("th")}
                  size="sm"
                >
                  {currentTranslations.switchToThai}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <RemoteRegistrationForm
              language={language}
              t={currentTranslations}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
