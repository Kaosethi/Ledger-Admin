// src/app/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';

// Component Imports
import Navbar from './Navbar';
import DashboardTab from './tabs/DashboardTab';
import OnboardingTab from './tabs/OnboardingTab';
import AccountsTab from './tabs/AccountsTab'; // Make sure this path is correct
import TransactionsTab from './tabs/TransactionsTab';
import MerchantsTab from './tabs/MerchantsTab';
import ActivityLogTab from './tabs/ActivityLogTab';

// Data and Type Imports
import mockDataInstance from '@/lib/mockData';
import type { Account, Merchant, Transaction, AdminLog, AppData } from '@/lib/mockData';
import { formatDate, formatCurrency } from '@/lib/utils';

// --- Props Interface ---
interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
}

// --- Main Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, adminEmail }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard-tab');
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const initialData = JSON.parse(JSON.stringify(mockDataInstance));
      return {
        accounts: initialData.accounts || [],
        merchants: initialData.merchants || [],
        transactions: initialData.transactions || [],
        adminActivityLog: initialData.adminActivityLog || initialData.adminLogs || [],
      };
    } catch (e) {
      console.error("Failed to initialize appData from mockDataInstance:", e);
      return { accounts: [], merchants: [], transactions: [], adminActivityLog: [] };
    }
  });

  // --- Helper Functions ---
  const updateAppData = <K extends keyof AppData>(key: K, data: AppData[K]) => {
    setAppData(prevData => ({
      ...prevData,
      [key]: data,
    }));
    // Optional: Add a console log here to verify state updates
    // console.log(`AdminDashboard: Updated appData.${key}`, data);
  };

  const logAdminActivity = (
    action: string,
    targetType: string = 'System',
    targetId: string = '-',
    details: string = ''
  ): void => {
    const newLog: AdminLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'Unknown Admin',
      action: action,
      targetType: targetType,
      targetId: targetId,
      details: details
    };
    const updatedLogs = [...appData.adminActivityLog, newLog];
    updateAppData('adminActivityLog', updatedLogs);
     // Optional: Log the activity being added
     // console.log("AdminDashboard: Logged activity", newLog);
  };

  const handleLogout = () => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    onLogout();
  };

  // --- Data Update Handlers ---

  // Handler for adding a *single* account (likely from OnboardingTab)
  const handleAccountAdd = (newAccount: Account) => {
    const updatedAccounts = [...appData.accounts, newAccount];
    updateAppData('accounts', updatedAccounts);
    // Log activity *after* updating state
    logAdminActivity("Add Account", "Account", newAccount.id, `Added ${newAccount.name}`);
  };

  // Handler for updating the *entire* accounts array (used by AccountsTab)
  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    // You might add validation here if needed before updating state
    updateAppData('accounts', updatedAccounts);
    // Logging specific bulk actions should be done in the component triggering the update
    // *before* calling this function, passing relevant details to logAdminActivity.
    // Or, you could compare old/new arrays here for a generic "Updated Accounts" log,
    // but it's less informative than logging the specific bulk action.
     console.log("AdminDashboard: handleAccountsUpdate called, updating state."); // Add this log
  };

   // Handler for updating merchants
   const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    updateAppData('merchants', updatedMerchants);
    // Logging would typically occur in MerchantsTab before calling this
  };


  // --- Render Active Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard-tab':
        return <DashboardTab
                  accounts={appData.accounts}
                  merchants={appData.merchants}
                  transactions={appData.transactions}
               />;
      case 'onboarding-tab':
        return <OnboardingTab
                  // Pass relevant props like onAccountAdd and logAdminActivity
                  onAccountAdd={handleAccountAdd}
                  logAdminActivity={logAdminActivity}
               />;
      case 'accounts-tab':
        // MODIFIED: Pass handleAccountsUpdate and logAdminActivity as props
        return <AccountsTab
                  accounts={appData.accounts}
                  onAccountsUpdate={handleAccountsUpdate} // <-- PASS UPDATE HANDLER
                  logAdminActivity={logAdminActivity}     // <-- PASS LOGGING HANDLER
               />;
      case 'transactions-tab':
        return <TransactionsTab
                  transactions={appData.transactions}
                  merchants={appData.merchants}
                  // Add logAdminActivity if needed for actions within this tab
               />;
      case 'merchants-tab':
        return <MerchantsTab
                  merchants={appData.merchants}
                  transactions={appData.transactions}
                  onMerchantsUpdate={handleMerchantsUpdate} // <-- PASS UPDATE HANDLER
                  logAdminActivity={logAdminActivity}     // <-- PASS LOGGING HANDLER
               />;
      case 'activity-log-tab':
         return <ActivityLogTab
                   // Pass the logs directly
                   logs={appData.adminActivityLog}
                   // Pass other props if needed by ActivityLogTab
                />;
      default:
        return <div className="p-6 text-center text-gray-500">Select a tab from the navigation above.</div>;
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
      <div className="mt-6">
        {renderTabContent()}
      </div>
      {/* Other potential global modals */}
    </>
  );
};

export default AdminDashboard;