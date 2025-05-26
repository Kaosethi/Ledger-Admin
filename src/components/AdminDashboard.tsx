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
  Account,
  Merchant,
  AdminLog,
  AppData,
  Transaction, // This is the type used for transactionsFromAppData
  PendingRegistration,
  AdminUser,
} from "@/lib/mockData";
import { z } from "zod";
import { selectTransactionSchema } from "@/lib/db/schema";

// DrizzleTransaction expects Date objects for its timestamps AND a displayId
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
      transactions: mockDataInstance.transactions || [],
      adminActivityLog: mockDataInstance.adminActivityLog || [],
      pendingRegistrations: mockDataInstance.pendingRegistrations || [],
    };
  });

  const convertToDrizzleTransactions = useCallback(
    (transactionsFromAppData: Transaction[]): DrizzleTransaction[] => {
      return transactionsFromAppData.map((transaction) => {
        // Since 'Transaction' type from mockData does NOT have displayId,
        // we generate a placeholder directly.
        const generatedDisplayId = `TRX-MOCK-${transaction.id.substring(0, 6).toUpperCase()}`;

        return {
          id: transaction.id,
          displayId: generatedDisplayId, // <<< --- FIXED: Directly use generated placeholder ---
          paymentId: transaction.paymentId,
          timestamp: transaction.timestamp instanceof Date ? transaction.timestamp : new Date(transaction.timestamp),
          amount: String(transaction.amount || "0.00"), 
          type: transaction.type as DrizzleTransaction['type'], 
          accountId: transaction.accountId,
          merchantId: transaction.merchantId || null, 
          status: transaction.status as DrizzleTransaction['status'], 
          declineReason: transaction.declineReason || null,
          pinVerified: transaction.pinVerified === undefined || transaction.pinVerified === null ? null : Boolean(transaction.pinVerified),
          description: transaction.description || null,
          reference: transaction.reference || null,
          metadata: transaction.metadata || null, 
          createdAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt),
          updatedAt: transaction.updatedAt instanceof Date ? transaction.updatedAt : new Date(transaction.updatedAt),
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
      const newLog: AdminLog = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        adminUsername: adminEmail || "Unknown Admin",
        action: action,
        targetId: targetId,
        targetType: targetType as AdminLog["targetType"],
        details: details,
      };
      setAppData((prevData) => ({
        ...prevData,
        adminActivityLog: [newLog, ...prevData.adminActivityLog].sort((a,b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() 
        ),
      }));
    },
    [adminEmail]
  );

  const handleLogout = useCallback(() => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    try { localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY); } catch (e) { console.error(e); }
    onLogout();
    router.push("/");
  }, [logAdminActivity, onLogout, router]);

  useEffect(() => {
    const checkAdminStatus = () => { /* Your existing status check logic */ };
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
      case "transactions-tab": 
        return ( <TransactionsTab transactions={appData.transactions} merchants={appData.merchants} accounts={appData.accounts} /> );
      case "merchants-tab":
        return ( <MerchantsTab merchants={appData.merchants} transactions={appData.transactions} accounts={appData.accounts} onMerchantsUpdate={handleMerchantsUpdate} logAdminActivity={logAdminActivity} /> );
      case "activity-log-tab": 
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