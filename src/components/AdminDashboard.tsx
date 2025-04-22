// src/components/AdminDashboard.tsx
import React, { useState } from "react";

// Component Imports
import Navbar from "./Navbar";
import DashboardTab from "./tabs/DashboardTab";
import OnboardingTab from "./tabs/OnboardingTab";
import AccountsTab from "./tabs/AccountsTab";
import TransactionsTab from "./tabs/TransactionsTab";
import MerchantsTab from "./tabs/MerchantsTab";
import ActivityLogTab from "./tabs/ActivityLogTab";

// Data and Type Imports
import mockDataInstance, {
  Account,
  Merchant,
  AdminLog,
  AppData,
} from "../lib/mockData";

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
    };
  });

  // useEffect(() => { console.log("AdminDashboard: useEffect detected accounts change:", appData.accounts); }, [appData.accounts]);

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
      adminActivityLog: [...prevData.adminActivityLog, newLog],
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
      accounts: [...prevData.accounts, newAccount],
    }));
    console.log("AdminDashboard: handleAccountAdd called.");
  };
  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    console.log(
      "AdminDashboard: handleAccountsUpdate received:",
      updatedAccounts
    );
    setAppData((prevData) => {
      console.log("AdminDashboard: Updating accounts state inside setAppData.");
      return { ...prevData, accounts: updatedAccounts };
    });
  };
  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    setAppData((prevData) => ({ ...prevData, merchants: updatedMerchants }));
    console.log("AdminDashboard: handleMerchantsUpdate called.");
  };

  // --- Render Active Tab Content ---
  const renderTabContent = () => {
    // console.log("AdminDashboard: Rendering tab:", activeTab);
    // console.log("AdminDashboard: Rendering tab:", activeTab);
    switch (activeTab) {
      case "dashboard-tab":
        return (
          <DashboardTab
            accounts={appData.accounts}
            merchants={appData.merchants}
            transactions={appData.transactions}
          />
        );
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
        // MODIFIED: Pass transactions and merchants down to AccountsTab
        // MODIFIED: Pass transactions and merchants down to AccountsTab
        return (
          <AccountsTab
            accounts={appData.accounts}
            onAccountsUpdate={handleAccountsUpdate}
            logAdminActivity={logAdminActivity}
            allTransactions={appData.transactions} // ADDED PROP
            merchants={appData.merchants} // ADDED PROP
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
        return <ActivityLogTab logs={appData.adminActivityLog} />;
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            {" "}
            Select a tab from the navigation above.{" "}
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
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminName={adminEmail}
        onLogout={handleLogout}
      />
      <div className="mt-6">{renderTabContent()}</div>
    </>
  );
};

export default AdminDashboard;
