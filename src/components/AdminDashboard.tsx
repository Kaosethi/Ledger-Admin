// src/app/admin/AdminDashboard.tsx
'use client';

import React, { useState, useEffect } from "react";

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
} from "@/lib/mockData";

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
  const [activeTab, setActiveTab] = useState<string>("accounts-tab");

  const [appData, setAppData] = useState<AppData>(() => {
    console.log("AdminDashboard: Initializing state with mock data.");
    return {
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
      adminEmail: adminEmail || "Unknown Admin",
      action: action,
      targetType: targetType,
      targetId: targetId,
      details: details,
    };
    setAppData((prevData) => ({
      ...prevData,
      adminActivityLog: [newLog, ...prevData.adminActivityLog],
    }));
  };

  const handleLogout = () => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    onLogout();
  };

  // --- Data Update Handlers ---
  const handleAccountAdd = (newAccount: Account) => {
    setAppData((prevData) => ({
      ...prevData,
      // Add to the beginning of the list for visibility, or end if preferred
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

  // REMOVED: handlePendingRegistrationAdd (no longer needed as data is added directly to mock)

  // ADDED: Handler to update the entire list of pending registrations
  // This will be used by AccountsTab after approving/rejecting items
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
            accounts={appData.accounts} // Pass accounts for ID checking
            onAccountAdd={handleAccountAdd} // Pass add handler
            logAdminActivity={logAdminActivity}
          />
        );
      case "accounts-tab":
        // MODIFIED: Pass pending registrations and relevant handlers
        return (
          <AccountsTab
            accounts={appData.accounts}
            onAccountsUpdate={handleAccountsUpdate}
            logAdminActivity={logAdminActivity}
            allTransactions={appData.transactions}
            merchants={appData.merchants}
            pendingRegistrations={appData.pendingRegistrations} // ADDED PROP
            onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate} // ADDED PROP
            onAccountAdd={handleAccountAdd} // ADDED PROP (for approving)
          />
        );
      case "transactions-tab":
        return (
          <TransactionsTab
            transactions={appData.transactions}
            merchants={appData.merchants}
            // Pass accounts if needed by TransactionsTab for lookups
            // accounts={appData.accounts}
          />
        );
      case "merchants-tab":
        return (
          <MerchantsTab
            merchants={appData.merchants}
            transactions={appData.transactions} // Pass transactions if needed for merchant details
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
        adminName={adminEmail}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
         {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;