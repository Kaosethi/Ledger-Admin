// src/app/page.tsx
"use client"; // Keep this for client-side interactivity (useState, useEffect)

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

// Define the main page component
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Redirecting to dashboard...</div>
    </div>
  );
}
