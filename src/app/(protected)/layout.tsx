"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab based on current pathname
  const getActiveTabId = (path: string) => {
    if (path.includes("/dashboard")) return "dashboard-tab";
    if (path.includes("/accounts")) return "accounts-tab";
    if (path.includes("/merchants")) return "merchants-tab";
    if (path.includes("/transactions")) return "transactions-tab";
    if (path.includes("/onboarding")) return "onboarding-tab";
    if (path.includes("/activity-log")) return "activity-log-tab";
    return "dashboard-tab"; // Default
  };

  const [activeTab, setActiveTab] = useState(getActiveTabId(pathname));

  // Effect to update active tab when path changes
  useEffect(() => {
    setActiveTab(getActiveTabId(pathname));
  }, [pathname]);

  // Handle tab navigation
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Navigate to the corresponding path
    switch (tabId) {
      case "dashboard-tab":
        router.push("/dashboard");
        break;
      case "accounts-tab":
        router.push("/accounts");
        break;
      case "merchants-tab":
        router.push("/merchants");
        break;
      case "transactions-tab":
        router.push("/transactions");
        break;
      case "onboarding-tab":
        router.push("/onboarding");
        break;
      case "activity-log-tab":
        router.push("/activity-log");
        break;
      default:
        router.push("/dashboard");
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        adminName={adminEmail || ""}
        onLogout={handleLogout}
      />
      <div className="mx-auto w-full max-w-screen-xl px-4 py-2">
        <main>{children}</main>
      </div>
    </div>
  );
}
