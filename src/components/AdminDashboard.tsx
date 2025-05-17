// src/components/AdminDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import DashboardTab from "@/components/tabs/DashboardTab";
import OnboardingTab from "@/components/tabs/OnboardingTab";
import AccountsTab from "@/components/tabs/AccountsTab";
import TransactionsTab from "@/components/tabs/TransactionsTab";
import MerchantsTab from "@/components/tabs/MerchantsTab";
import ActivityLogTab from "@/components/tabs/ActivityLogTab";

// Types from mockData (reflecting their actual definitions)
import mockDataInstance, {
  Account,         // Dates are string
  Merchant,        // Dates are string
  AdminLog,        // timestamp is string
  AppData,
  Transaction,     // timestamp, createdAt, updatedAt are Date
  PendingRegistration, // createdAt is string
  AdminUser,         // createdAt is string
} from "@/lib/mockData";
import { z } from "zod";
import { selectTransactionSchema } from "@/lib/db/schema";

// DrizzleTransaction expects Date objects for its timestamps
type DrizzleTransaction = z.infer<typeof selectTransactionSchema>;

interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
}

const ADMIN_EMAIL_STORAGE_KEY = "loggedInAdminEmail";
const STATUS_CHECK_INTERVAL_MS = 15 * 1000;

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  adminEmail,
}) => {
  const [activeTab, setActiveTab] = useState<string>("merchants-tab");
  const router = useRouter();

  const [appData, setAppData] = useState<AppData>(() => {
    return {
      admins: mockDataInstance.admins || [],
      accounts: mockDataInstance.accounts || [],
      merchants: mockDataInstance.merchants || [],
      transactions: mockDataInstance.transactions || [], // These have Date objects for timestamps
      adminActivityLog: mockDataInstance.adminActivityLog || [], // These have string timestamps
      pendingRegistrations: mockDataInstance.pendingRegistrations || [],
    };
  });

  // Convert Transaction (with Date objects) to DrizzleTransaction (also with Date objects)
   const convertToDrizzleTransactions = useCallback(
    (transactionsFromAppData: Transaction[]): DrizzleTransaction[] => { // Transaction[] from mockData has merchantId?: string | null
      return transactionsFromAppData.map((transaction) => {
        return {
          id: transaction.id,
          paymentId: transaction.paymentId,
          timestamp: transaction.timestamp, // Already a Date object
          amount: transaction.amount,       // Already a string
          type: transaction.type,
          accountId: transaction.accountId,
          // VVVV CORRECTED HERE VVVV
          merchantId: transaction.merchantId || "", // Ensure it's always a string
          // VVVV END CORRECTION VVVV
          status: transaction.status,
          declineReason: transaction.declineReason || null,
          pinVerified: transaction.pinVerified === null ? null : transaction.pinVerified,
          description: transaction.description || null,
          reference: transaction.reference || null,
          metadata: transaction.metadata || null, 
          createdAt: transaction.createdAt, // Already a Date object
          updatedAt: transaction.updatedAt, // Already a Date object
        };
      });
    },
    []
  );

  const logAdminActivity = useCallback(
    (
      action: string,
      targetType: string = "System",
      targetId: string = "-",
      details: string = ""
    ): void => {
      const newLog: AdminLog = { // AdminLog.timestamp expects a string
        id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(), // Correctly provides a string
        adminUsername: adminEmail || "Unknown Admin",
        action: action,
        targetId: targetId,
        targetType: targetType as AdminLog["targetType"],
        details: details,
      };
      setAppData((prevData) => ({
        ...prevData,
        adminActivityLog: [newLog, ...prevData.adminActivityLog].sort((a,b) => 
          // Sort by parsing string dates
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() 
        ),
      }));
    },
    [adminEmail]
  );

  // ... (rest of the functions: handleLogout, useEffect, handleAccountAdd, handleAccountsUpdate, etc. remain the same) ...
  const handleLogout = useCallback(() => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    try { localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY); } catch (e) { console.error(e); }
    onLogout();
    router.push("/");
  }, [logAdminActivity, onLogout, router]);

  useEffect(() => {
    // Status check logic can remain as is
    const checkAdminStatus = () => { /* ... */ };
    checkAdminStatus();
    const intervalId = setInterval(checkAdminStatus, STATUS_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
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

  const handlePendingRegistrationsUpdate = useCallback(
    (updatedList: PendingRegistration[]) => {
      setAppData((prevData) => ({ ...prevData, pendingRegistrations: updatedList }));
    },
    []
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard-tab":
        return ( <DashboardTab accounts={appData.accounts} merchants={appData.merchants} transactions={appData.transactions} /> );
      case "onboarding-tab":
        return ( <OnboardingTab accounts={appData.accounts} onAccountAdd={handleAccountAdd} logAdminActivity={logAdminActivity} /> );
      case "accounts-tab":
        return (
          <AccountsTab
            accounts={appData.accounts}
            onAccountsUpdate={handleAccountsUpdate}
            logAdminActivity={logAdminActivity}
            allTransactions={convertToDrizzleTransactions(appData.transactions)}
            merchants={appData.merchants}
            pendingRegistrations={appData.pendingRegistrations}
            onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate}
            onAccountAdd={handleAccountAdd}
          />
        );
      case "transactions-tab": // TransactionsTab will receive Transaction[] with Date objects for timestamps
        return ( <TransactionsTab transactions={appData.transactions} merchants={appData.merchants} accounts={appData.accounts} /> );
      case "merchants-tab":
        return ( <MerchantsTab merchants={appData.merchants} transactions={appData.transactions} accounts={appData.accounts} onMerchantsUpdate={handleMerchantsUpdate} logAdminActivity={logAdminActivity} /> );
      case "activity-log-tab": // ActivityLogTab will receive AdminLog[] with string timestamps
        return <ActivityLogTab logs={appData.adminActivityLog} />;
      default:
        return ( <div className="p-6 text-center text-gray-500"> Select a tab to view its content. </div> );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} adminName={adminEmail} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-100"> {renderTabContent()} </main>
    </div>
  );
};

export default AdminDashboard;