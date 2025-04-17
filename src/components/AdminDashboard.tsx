// src/app/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';

// Component Imports
import Navbar from './Navbar'; // Assuming src/app/components/Navbar.tsx
import DashboardTab from './tabs/DashboardTab';
import OnboardingTab from './tabs/OnboardingTab';
import AccountsTab from './tabs/AccountsTab';
import TransactionsTab from './tabs/TransactionsTab';
import MerchantsTab from './tabs/MerchantsTab';
import ActivityLogTab from './tabs/ActivityLogTab';

// Data and Type Imports
import mockDataInstance from '@/lib/mockData'; // Import the instance
// Import ALL needed types, including AppData if defined in mockData.ts
import type { Account, Merchant, Transaction, AdminLog, AppData } from '@/lib/mockData';
// Import utility functions if used
import { formatDate, formatCurrency } from '@/lib/utils';

// --- Props Interface ---
interface AdminDashboardProps {
  onLogout: () => void; // Function to call when logout happens (passed from page.tsx)
  adminEmail: string;  // Logged-in admin's email (passed from page.tsx)
}

// --- Main Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, adminEmail }) => {
  // State for the currently active tab ID
  const [activeTab, setActiveTab] = useState<string>('dashboard-tab'); // Default tab

  // State to hold ALL application data (accounts, merchants, etc.)
  // Initialize safely from the imported mock data instance
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      // Basic deep copy for mock data; consider Immer or structuredClone for complex state
      const initialData = JSON.parse(JSON.stringify(mockDataInstance));
      // Ensure all keys expected by AppData exist, provide defaults if missing in mock data
      return {
        accounts: initialData.accounts || [],
        merchants: initialData.merchants || [],
        transactions: initialData.transactions || [],
        // Ensure key matches AppData definition (e.g., adminActivityLog vs adminLogs)
        adminActivityLog: initialData.adminActivityLog || initialData.adminLogs || [],
      };
    } catch (e) {
      console.error("Failed to initialize appData from mockDataInstance:", e);
      // Provide a safe empty structure if mock data fails
      return { accounts: [], merchants: [], transactions: [], adminActivityLog: [] };
    }
  });

  // --- Helper Functions ---

  // Generic function to update a specific part of the app data state
  const updateAppData = <K extends keyof AppData>(key: K, data: AppData[K]) => {
    setAppData(prevData => ({
      ...prevData,
      [key]: data,
    }));
  };

  // Function to add a new log entry to the state
  const logAdminActivity = (
    action: string,
    targetType: string = 'System', // Default targetType
    targetId: string = '-',     // Default targetId
    details: string = ''        // Default details
  ): void => { // Explicit return type void
    const newLog: AdminLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Unique ID
      timestamp: new Date().toISOString(),
      adminEmail: adminEmail || 'Unknown Admin', // Use logged-in admin email
      action: action,
      targetType: targetType,
      targetId: targetId,
      details: details
    };
    // Create a new array with the new log added
    // Ensure the key here matches the state property name ('adminActivityLog')
    const updatedLogs = [...appData.adminActivityLog, newLog];
    // Update the state
    updateAppData('adminActivityLog', updatedLogs);
  };

  // Handler passed to Navbar for logout action
  const handleLogout = () => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    onLogout(); // Call the function passed from the parent (page.tsx)
  };

  // --- Example Handlers for Tabs (Implement actual logic) ---

  const handleAccountAdd = (newAccount: Account) => {
    // Add validation if needed
    const updatedAccounts = [...appData.accounts, newAccount];
    updateAppData('accounts', updatedAccounts);
    // Logging is likely already done within the OnboardingTab where the action originates
  };

  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    // Add validation if needed
    updateAppData('accounts', updatedAccounts);
    // Logging is likely done within AccountsTab where the action originates
  };

   const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    // Add validation if needed
    updateAppData('merchants', updatedMerchants);
    // Logging is likely done within MerchantsTab where the action originates
  };


  // --- Render Active Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard-tab':
        return <DashboardTab
                  accounts={appData.accounts}
                  merchants={appData.merchants}
                  transactions={appData.transactions}
                  // Pass date filter state/handlers if managed here
               />;
      case 'onboarding-tab':
        return <OnboardingTab
                  // Pass necessary props based on OnboardingTab's interface
                  // Example:
                  // onAccountAdd={handleAccountAdd}
                  // logAdminActivity={logAdminActivity}
               />;
      case 'accounts-tab':
        return <AccountsTab
                  accounts={appData.accounts}
                  // Pass necessary props based on AccountsTab's interface
                  // Example:
                  // onAccountsUpdate={handleAccountsUpdate}
                  // logAdminActivity={logAdminActivity}
                  // openAccountModal={(id) => console.log("Open modal for", id)} // Placeholder
               />;
      case 'transactions-tab':
        return <TransactionsTab
                  transactions={appData.transactions}
                  merchants={appData.merchants} // Needed for filter dropdown
                  // Pass necessary props based on TransactionsTab's interface
                  // Example:
                  // openTransactionModal={(id) => console.log("Open modal for", id)} // Placeholder
               />;
      case 'merchants-tab':
        return <MerchantsTab
                  merchants={appData.merchants}
                  transactions={appData.transactions} // Needed for counts
                   // Pass necessary props based on MerchantsTab's interface
                   // Example:
                  // onMerchantsUpdate={handleMerchantsUpdate}
                  // logAdminActivity={logAdminActivity}
                  // openMerchantModal={(id) => console.log("Open modal for", id)} // Placeholder
               />;
      case 'activity-log-tab':
        // Implement session grouping logic here or pass raw logs
        // const sessions = groupLogsBySession(appData.adminActivityLog); // Example
        return <ActivityLogTab
                  sessions={[]} // Replace with grouped sessions or pass raw logs: logs={appData.adminActivityLog}
                  // Pass necessary props based on ActivityLogTab's interface
                  // Example:
                  // openLogDetailsModal={(id) => console.log("Open modal for", id)} // Placeholder
               />;
      default:
        // Fallback content if no tab matches
        return <div className="p-6 text-center text-gray-500">Select a tab from the navigation above.</div>;
    }
  };

  // --- Component Render ---
  return (
    // Use a fragment or a main div if needed for overall dashboard layout/padding
    <>
      {/* Render Navbar, passing state and handlers */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab} // Pass the state setter function
        adminName={adminEmail}    // Pass the admin's email for display
        onLogout={handleLogout}   // Pass the logout handler
      />

      {/* Render the content area for the active tab */}
      {/* Added margin-top like in Admin.txt structure */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Modals would be rendered here, conditionally based on state */}
      {/* Example:
        {isAccountModalOpen && <AccountDetailsModal accountId={selectedAccountId} onClose={() => setIsAccountModalOpen(false)} />}
      */}
    </>
  );
};

export default AdminDashboard;