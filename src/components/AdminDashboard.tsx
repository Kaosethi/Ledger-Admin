// src/components/AdminDashboard.tsx
// MODIFIED: Added useEffect for periodic status check, modified handleLogout
'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ADDED: Import useRouter

// Component Imports
import Navbar from "@/components/Navbar";
import DashboardTab from "@/components/tabs/DashboardTab";
import OnboardingTab from "@/components/tabs/OnboardingTab";
import AccountsTab from "@/components/tabs/AccountsTab";
import TransactionsTab from "@/components/tabs/TransactionsTab";
import MerchantsTab from "@/components/tabs/MerchantsTab";
import ActivityLogTab from "@/components/tabs/ActivityLogTab";

// Data and Type Imports
import mockDataInstance, {
  Account,
  Merchant,
  AdminLog,
  AppData,
  Transaction,
  PendingRegistration,
  AdminUser // ADDED: Import AdminUser type
} from "@/lib/mockData";

// --- Props Interface ---
interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
}

// ADDED: Constant for localStorage key (must match Login.tsx)
const ADMIN_EMAIL_STORAGE_KEY = "loggedInAdminEmail";
// ADDED: Interval time for status check (e.g., 15 seconds)
const STATUS_CHECK_INTERVAL_MS = 15 * 1000;

// --- Main Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  adminEmail,
}) => {
  const [activeTab, setActiveTab] = useState<string>("accounts-tab");
  const router = useRouter(); // ADDED: Initialize router

  const [appData, setAppData] = useState<AppData>(() => {
    console.log("AdminDashboard: Initializing state with mock data.");
    // IMPORTANT: Use a deep copy of mock data if you intend to modify it
    // without affecting the original import across sessions/reloads.
    // For now, direct assignment might be okay for mock purposes, but be aware.
    return {
      // NOTE: We need the 'admins' array here too for the status check
      admins: mockDataInstance.admins || [],
      accounts: mockDataInstance.accounts || [],
      merchants: mockDataInstance.merchants || [],
      transactions: mockDataInstance.transactions || [],
      adminActivityLog: mockDataInstance.adminActivityLog || [],
      pendingRegistrations: mockDataInstance.pendingRegistrations || [],
    };
  });

  // --- Helper Functions ---
  const logAdminActivity = (
    action: string,
    targetType: string = "System",
    targetId: string = "-",
    details: string = ""
  ): void => {
    const newLog: AdminLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      // MODIFIED: Use adminEmail prop passed down
      adminUsername: adminEmail || "Unknown Admin",
      action: action,
      // targetType: targetType, // If adding targetType back to AdminLog interface
      targetId: targetId,
      details: details,
    };
    setAppData((prevData) => ({
      ...prevData,
      adminActivityLog: [newLog, ...prevData.adminActivityLog],
    }));
  };

  // MODIFIED: handleLogout to clear localStorage and redirect
  const handleLogout = () => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    try {
      localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY); // Clear stored admin email
      console.log("Admin email removed from localStorage.");
    } catch (storageError) {
      console.error("Failed to remove admin email from localStorage:", storageError);
    }
    onLogout(); // Call the original onLogout passed from parent (clears parent state)
    router.push('/'); // Redirect to login page
  };


  // --- ADDED: Periodic Admin Status Check ---
  useEffect(() => {
    console.log("AdminDashboard: Setting up periodic status check interval.");

    const checkAdminStatus = () => {
      try {
        const currentAdminEmail = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
        if (!currentAdminEmail) {
          console.log("Status Check: No admin email found in localStorage. Potential logout needed.");
          // Consider forcing logout if no email is found while dashboard is active
          // handleLogout();
          return;
        }

        // Find the admin in the current state's admin list
        // IMPORTANT: This relies on `appData.admins` being available and up-to-date.
        // In a real app, you'd likely make an API call here to get the *current* status.
        const adminUser = appData.admins.find(admin => admin.email === currentAdminEmail);

        if (!adminUser) {
          console.warn(`Status Check: Logged in admin (${currentAdminEmail}) not found in mock data. Forcing logout.`);
          handleLogout();
        } else if (!adminUser.isActive) {
          console.log(`Status Check: Admin (${currentAdminEmail}) is inactive. Forcing logout.`);
          // Log before logging out completely
          logAdminActivity("Forced Logout", "System", adminUser.id, "Admin account became inactive.");
          alert("Your admin account has become inactive. You will be logged out."); // Optional user feedback
          handleLogout();
        } else {
          // console.log(`Status Check: Admin (${currentAdminEmail}) is active.`); // Optional: log for debugging
        }
      } catch (error) {
        console.error("Error during admin status check:", error);
        // Decide if an error here should trigger a logout or just be logged
      }
    };

    // Run the check immediately on mount
    checkAdminStatus();

    // Set up the interval
    const intervalId = setInterval(checkAdminStatus, STATUS_CHECK_INTERVAL_MS);

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      console.log("AdminDashboard: Clearing status check interval.");
      clearInterval(intervalId);
    };
    // Dependencies: Include `appData.admins` and `handleLogout`
    // `handleLogout` uses `logAdminActivity`, `onLogout`, `router`
    // `logAdminActivity` uses `adminEmail`, `setAppData`
    // Need to ensure `handleLogout` is stable or memoized if dependencies grow complex.
    // For now, listing direct dependencies. Re-eval if behavior is unexpected.
  }, [appData.admins, adminEmail, onLogout, router]); // ADDED: Dependencies for useEffect
  // --- END: Periodic Admin Status Check ---


  // --- Data Update Handlers ---
  const handleAccountAdd = (newAccount: Account) => {
    setAppData((prevData) => ({
      ...prevData,
      accounts: [newAccount, ...prevData.accounts],
    }));
    console.log("AdminDashboard: handleAccountAdd called.");
  };

  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    console.log("AdminDashboard: handleAccountsUpdate received:", updatedAccounts);
    setAppData((prevData) => ({ ...prevData, accounts: updatedAccounts }));
  };

  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    setAppData((prevData) => ({ ...prevData, merchants: updatedMerchants }));
    console.log("AdminDashboard: handleMerchantsUpdate called.");
  };

  const handlePendingRegistrationsUpdate = (updatedList: PendingRegistration[]) => {
    console.log("AdminDashboard: handlePendingRegistrationsUpdate received:", updatedList);
    setAppData(prevData => ({
        ...prevData,
        pendingRegistrations: updatedList,
    }));
  };


  // --- Render Active Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard-tab":
        return (
          <DashboardTab
            accounts={appData.accounts}
            merchants={appData.merchants}
            transactions={appData.transactions}
          />
        );
      case "onboarding-tab":
        return (
          <OnboardingTab
            accounts={appData.accounts}
            onAccountAdd={handleAccountAdd}
            logAdminActivity={logAdminActivity}
          />
        );
      case "accounts-tab":
        return (
          <AccountsTab
            accounts={appData.accounts}
            onAccountsUpdate={handleAccountsUpdate}
            logAdminActivity={logAdminActivity}
            allTransactions={appData.transactions}
            merchants={appData.merchants}
            pendingRegistrations={appData.pendingRegistrations}
            onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate}
            onAccountAdd={handleAccountAdd}
          />
        );
      case "transactions-tab":
        return (
          <TransactionsTab
            transactions={appData.transactions}
            merchants={appData.merchants}
          />
        );
      case "merchants-tab":
        return (
          <MerchantsTab
            merchants={appData.merchants}
            transactions={appData.transactions}
            onMerchantsUpdate={handleMerchantsUpdate}
            logAdminActivity={logAdminActivity}
          />
        );
      case "activity-log-tab":
        return <ActivityLogTab logs={appData.adminActivityLog} />;
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            Select a tab from the navigation above.
          </div>
        );
    }
  };

  // --- Component Render ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminName={adminEmail} // Pass the email to Navbar for display
        onLogout={handleLogout} // Pass the enhanced logout handler
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
         {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;