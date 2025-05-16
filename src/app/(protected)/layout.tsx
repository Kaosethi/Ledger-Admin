"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab based on current pathname
  const getActiveTabId = (path: string | null) => {
    if (!path) return "dashboard-tab"; // Default if path is null
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
  React.useEffect(() => {
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

  // Always render the layout (auth is handled by middleware)
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        adminName={""} // Optionally, fetch admin name elsewhere if needed
      />
      <div className="mx-auto w-full max-w-screen-xl px-4 py-2">
        <main>{children}</main>
      </div>
    </div>
  );
}
