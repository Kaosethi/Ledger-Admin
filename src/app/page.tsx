// src/app/page.tsx
"use client"; // Keep this for client-side interactivity (useState, useEffect)

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define the main page component
export default function Test() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Add a small delay to prevent redirect race conditions
    const timer = setTimeout(() => {
      // Redirect to the dashboard
      router.push("/dashboard");
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-red-500 text-white p-10 text-3xl">
      If this is red, Tailwind is working!
    </div>
  );
}
