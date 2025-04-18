// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from "react";

// Component Imports
import Navbar from "./Navbar";
import DashboardTab from "./tabs/DashboardTab";
import OnboardingTab from "./tabs/OnboardingTab";
import AccountsTab from "./tabs/AccountsTab"; // Make sure this path is correct
import TransactionsTab from "./tabs/TransactionsTab";
import MerchantsTab from "./tabs/MerchantsTab";
import ActivityLogTab from "./tabs/ActivityLogTab";

// Data and Type Imports
// Use a placeholder if mockDataInstance is complex or causes issues during setup
// import mockDataInstance from '@/lib/mockData'; // Uncomment when ready

// Import types from the central mockData file to ensure consistency
import type { Account, Merchant, Transaction, AdminLog } from "../lib/mockData";

export interface AppData {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
  adminActivityLog: AdminLog[];
}

// --- Props Interface ---
interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
}

// --- Main Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  adminEmail,
}) => {
  const [activeTab, setActiveTab] = useState<string>("dashboard-tab");
  // Initialize with empty data structure
  const [appData, setAppData] = useState<AppData>({
    accounts: [],
    merchants: [],
    transactions: [],
    adminActivityLog: [],
  });

  // --- Load Mock Data on Mount (Example) ---
  useEffect(() => {
    // Simulate loading initial data - replace with actual fetching if needed
    // If using mockDataInstance, ensure it's properly structured
    // const initialData = mockDataInstance; // Example: load from imported object
    // setAppData({
    //     accounts: initialData?.accounts || [],
    //     merchants: initialData?.merchants || [],
    //     transactions: initialData?.transactions || [],
    //     adminActivityLog: initialData?.adminActivityLog || initialData?.adminLogs || []
    // });
    // Example initial log
    logAdminActivity("System Start", "System", "-", "Admin dashboard loaded.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // --- Helper Functions ---
  const updateAppData = <K extends keyof AppData>(key: K, data: AppData[K]) => {
    setAppData((prevData) => ({
      ...prevData,
      [key]: data,
    }));
    // console.log(`AdminDashboard: Updated appData.${key}`); // Uncomment for debugging
  };

  const logAdminActivity = (
    action: string,
    targetType: string = "System",
    targetId: string = "-",
    details: string = ""
  ): void => {
    const newLog: AdminLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || "Unknown Admin",
      action: action,
      targetType: targetType,
      targetId: targetId,
      details: details,
    };
    // Use functional update to ensure we have the latest logs
    setAppData((prevData) => ({
      ...prevData,
      adminActivityLog: [...prevData.adminActivityLog, newLog],
    }));
    // console.log("AdminDashboard: Logged activity", newLog); // Uncomment for debugging
  };

  const handleLogout = () => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    onLogout();
  };

  // --- Data Update Handlers ---

  // Handler for adding a *single* account (used by OnboardingTab)
  const handleAccountAdd = (newAccount: Account) => {
    const updatedAccounts = [...appData.accounts, newAccount];
    updateAppData("accounts", updatedAccounts);
    // Logging is handled within OnboardingTab *before* calling this now,
    // providing more specific context (like initial balance).
    // If you prefer logging here, uncomment the line below:
    // logAdminActivity("Add Account", "Account", newAccount.id, `Added ${newAccount.name}`);
  };

  // Handler for updating the *entire* accounts array (used by AccountsTab)
  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    updateAppData("accounts", updatedAccounts);
    // Logging specific bulk actions is done in AccountsTab *before* calling this.
    console.log(
      "AdminDashboard: handleAccountsUpdate called, updating accounts state."
    ); // Keep for debugging if needed
  };

  // Handler for updating merchants
  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    updateAppData("merchants", updatedMerchants);
    // Logging would typically occur in MerchantsTab before calling this
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
        // MODIFIED: Pass the 'accounts' array for ID uniqueness check
        return (
          <OnboardingTab
            accounts={appData.accounts} // <-- ADDED: Pass current accounts
            onAccountAdd={handleAccountAdd} // Pass the add handler
            logAdminActivity={logAdminActivity} // Pass the logging function
          />
        );
      case "accounts-tab":
        return (
          <AccountsTab
            accounts={appData.accounts}
            onAccountsUpdate={handleAccountsUpdate} // Pass bulk update handler
            logAdminActivity={logAdminActivity} // Pass the logging function
          />
        );
      case "transactions-tab":
        return (
          <TransactionsTab
            transactions={appData.transactions}
            merchants={appData.merchants}
            // logAdminActivity={logAdminActivity} // Pass if needed
          />
        );
      case "merchants-tab":
        return (
          <MerchantsTab
            merchants={appData.merchants}
            transactions={appData.transactions}
            onMerchantsUpdate={handleMerchantsUpdate} // Pass update handler
            logAdminActivity={logAdminActivity} // Pass the logging function
          />
        );
      case "activity-log-tab":
        return (
          <ActivityLogTab
            logs={appData.adminActivityLog} // Pass the logs directly
          />
        );
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
    <>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminName={adminEmail}
        onLogout={handleLogout}
      />
      <div className="mt-6">{renderTabContent()}</div>
      {/* Other potential global modals */}
    </>
  );
};

export default AdminDashboard;
