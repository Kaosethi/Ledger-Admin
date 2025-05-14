// src/components/AdminDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Component Imports
import Navbar from "@/components/Navbar"; // Corrected path if it's in src/app/components
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
  AdminUser,
} from "@/lib/mockData"; // Ensure Merchant here is the API-aligned type

// --- Props Interface ---
interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
}

const ADMIN_EMAIL_STORAGE_KEY = "loggedInAdminEmail";
const STATUS_CHECK_INTERVAL_MS = 15 * 1000;

// --- Main Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  adminEmail,
}) => {
  const [activeTab, setActiveTab] = useState<string>("accounts-tab");
  const router = useRouter();

  const [appData, setAppData] = useState<AppData>(() => {
    console.log("AdminDashboard: Initializing state with mock data.");
    return {
      admins: mockDataInstance.admins || [],
      accounts: mockDataInstance.accounts || [],
      merchants: mockDataInstance.merchants || [],
      transactions: mockDataInstance.transactions || [],
      adminActivityLog: mockDataInstance.adminActivityLog || [],
      pendingRegistrations: mockDataInstance.pendingRegistrations || [],
    };
  });

  const logAdminActivity = useCallback((
    action: string,
    targetType: string = "System",
    targetId: string = "-",
    details: string = ""
  ): void => {
    const newLog: AdminLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      adminUsername: adminEmail || "Unknown Admin",
      action: action,
      targetId: targetId,
      targetType: targetType as AdminLog['targetType'],
      details: details,
    };
    setAppData((prevData) => ({
      ...prevData,
      adminActivityLog: [newLog, ...prevData.adminActivityLog],
    }));
  }, [adminEmail]);

  const handleLogout = useCallback(() => {
    logAdminActivity("Logout", "System", "-", "Admin logged out."); 
    try {
      localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
      console.log("Admin email removed from localStorage.");
    } catch (storageError) {
      console.error("Failed to remove admin email from localStorage:", storageError);
    }
    onLogout();
    router.push("/"); 
  }, [logAdminActivity, onLogout, router]);


  useEffect(() => {
    console.log("AdminDashboard: Setting up periodic status check interval.");
    const checkAdminStatus = () => {
      try {
        const currentAdminEmail = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
        if (!currentAdminEmail) {
          return;
        }
        const adminUser = appData.admins.find((admin) => admin.email === currentAdminEmail);
        if (!adminUser) {
          console.warn(`Status Check: Logged in admin (${currentAdminEmail}) not found. Forcing logout.`);
          handleLogout();
        } else if (!adminUser.isActive) {
          console.log(`Status Check: Admin (${currentAdminEmail}) is inactive. Forcing logout.`);
          logAdminActivity("Forced Logout", "System", adminUser.id, "Admin account became inactive.");
          alert("Your admin account has become inactive. You will be logged out.");
          handleLogout();
        }
      } catch (error) {
        console.error("Error during admin status check:", error);
      }
    };
    checkAdminStatus();
    const intervalId = setInterval(checkAdminStatus, STATUS_CHECK_INTERVAL_MS);
    return () => {
      console.log("AdminDashboard: Clearing status check interval.");
      clearInterval(intervalId);
    };
  }, [appData.admins, handleLogout, logAdminActivity]);

  const handleAccountAdd = useCallback((newAccount: Account) => {
    setAppData((prevData) => ({ ...prevData, accounts: [newAccount, ...prevData.accounts] }));
  }, []);

  const handleAccountsUpdate = useCallback((updatedAccounts: Account[]) => {
    setAppData((prevData) => ({ ...prevData, accounts: updatedAccounts }));
  }, []);

  const handleMerchantsUpdate = useCallback((updatedMerchants: Merchant[]) => {
    setAppData((prevData) => ({ ...prevData, merchants: updatedMerchants }));
  }, []);

  const handlePendingRegistrationsUpdate = useCallback((updatedList: PendingRegistration[]) => {
    setAppData((prevData) => ({ ...prevData, pendingRegistrations: updatedList }));
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard-tab": return <DashboardTab accounts={appData.accounts} merchants={appData.merchants} transactions={appData.transactions} />;
      case "onboarding-tab": return <OnboardingTab accounts={appData.accounts} onAccountAdd={handleAccountAdd} logAdminActivity={logAdminActivity} />;
      case "accounts-tab": return <AccountsTab accounts={appData.accounts} onAccountsUpdate={handleAccountsUpdate} logAdminActivity={logAdminActivity} allTransactions={appData.transactions} merchants={appData.merchants} pendingRegistrations={appData.pendingRegistrations} onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate} onAccountAdd={handleAccountAdd} />;
      case "transactions-tab": return <TransactionsTab transactions={appData.transactions} merchants={appData.merchants} accounts={appData.accounts} />;
      case "merchants-tab": return <MerchantsTab merchants={appData.merchants} transactions={appData.transactions} onMerchantsUpdate={handleMerchantsUpdate} logAdminActivity={logAdminActivity} />;
      case "activity-log-tab": return <ActivityLogTab logs={appData.adminActivityLog} />;
      default: return <div className="p-6 text-center text-gray-500">Select a tab to view its content.</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab} // Corrected: Pass state setter to matching prop name
        onLogout={handleLogout}
        adminName={adminEmail}    // Corrected: Pass adminEmail to adminName prop
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-100">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;