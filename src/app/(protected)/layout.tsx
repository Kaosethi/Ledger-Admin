"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Effect to check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (data.authenticated) {
          setAdminEmail(data.user.email);
        } else {
          // Not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, redirect to login
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to login page
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Navigation tabs with active state based on current path
  const tabs = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Accounts", path: "/accounts" },
    { name: "Merchants", path: "/merchants" },
    { name: "Transactions", path: "/transactions" },
    { name: "Onboarding", path: "/onboarding" },
    { name: "Activity Log", path: "/activity-log" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar adminEmail={adminEmail || ""} onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-screen-xl px-4 py-2">
        {/* Tab Navigation */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                href={tab.path}
                className={`
                  px-3 py-2 text-sm font-medium border-b-2 -mb-px
                  ${
                    pathname === tab.path
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
                aria-current={pathname === tab.path ? "page" : undefined}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
