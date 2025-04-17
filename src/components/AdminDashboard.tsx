// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar'; // Assumes src/app/components/Navbar.tsx exists and exports default
import DashboardTab from './tabs/DashboardTab';
import OnboardingTab from './tabs/OnboardingTab';
import AccountsTab from './tabs/AccountsTab';
import TransactionsTab from './tabs/TransactionsTab';
import MerchantsTab from './tabs/MerchantsTab';
import ActivityLogTab from './tabs/ActivityLogTab';
import mockDataInstance from '@/lib/mockData';
// Ensure ALL needed types are imported
import type { Account, Merchant, Transaction, AdminLog, AppData } from '@/lib/mockData'; // AppData potentially defined here too?

// Define component props
interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
}

// AppData type definition - MOVED TO mockData.ts for better organization is recommended
// If not moved, keep it here. If moved, remove this and import it from '@/lib/mockData'
/*
export interface AppData {
    accounts: Account[];
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
}
*/

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, adminEmail }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard-tab');
  const [appData, setAppData] = useState<AppData>(() => {
      // Use mockDataInstance directly if it's structured like AppData, otherwise adapt
       // Using JSON.parse/stringify for deep copy is fine for simple mock data
      try {
          // Make sure mockDataInstance actually HAS all keys of AppData
          const initialData = JSON.parse(JSON.stringify(mockDataInstance));
          // Ensure all required keys exist, provide defaults if necessary
          return {
              accounts: initialData.accounts || [],
              merchants: initialData.merchants || [],
              transactions: initialData.transactions || [],
              adminActivityLog: initialData.adminLogs || [], // Make sure key matches mockData
          };
      } catch (e) {
          console.error("Failed to parse mock data:", e);
          // Provide a safe default structure if parsing fails
          return {
              accounts: [],
              merchants: [],
              transactions: [],
              adminActivityLog: [],
          };
      }
  });

  const updateAppData = <K extends keyof AppData>(key: K, data: AppData[K]) => {
    setAppData(prevData => ({
      ...prevData,
      [key]: data,
    }));
  };

   // Function to add a new log entry - FIXED
   const logAdminActivity = (
       action: string,          // Added explicit type
       targetType: string,      // Added explicit type
       targetId: string,        // Added explicit type
       details: string          // Added explicit type
     ) => {
       const newLog: AdminLog = {
         // FIX: Use 'id' consistent with other interfaces (assuming AdminLog has 'id')
         id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
         timestamp: new Date().toISOString(),
         // FIX: Use 'adminEmail' consistent with interface (assuming AdminLog has 'adminEmail')
         adminEmail: adminEmail || 'Unknown Admin', // Use the prop directly
         action: action,
         // --- Add these to AdminLog interface in mockData.ts if needed ---
         targetType: targetType,
         targetId: targetId,
         // --- End Add ---
         details: details
       };
       const updatedLogs = [...appData.adminActivityLog, newLog];
       updateAppData('adminActivityLog', updatedLogs);
     };

    useEffect(() => {
        const recentLogs = appData.adminActivityLog.slice(-5);
        // FIX: Check against 'adminEmail' property
        const hasRecentLogin = recentLogs.some(log => log.action === "Login" && log.adminEmail === adminEmail);
        if (!hasRecentLogin) {
           // Login logging commented out as per original code's reasoning
        }
        // Dependency array is okay for now, but might need adjustment if logAdminActivity was used here
    }, [adminEmail, appData.adminActivityLog]); // Added dependency

  const handleLogout = () => {
    logAdminActivity("Logout", "System", "-", "Admin logged out.");
    onLogout();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard-tab':
        // Ensure DashboardTab accepts or ignores these props
        return <DashboardTab
                    accounts={appData.accounts}
                    merchants={appData.merchants}
                    transactions={appData.transactions}
                 />;
      case 'onboarding-tab':
         // Ensure OnboardingTab accepts these props
        return <OnboardingTab
                    accounts={appData.accounts}
                    // FIX: Add type to inline function parameter
                    onAccountAdd={(newAccount: Account) => updateAppData('accounts', [...appData.accounts, newAccount])}
                    logAdminActivity={logAdminActivity}
                />;
      case 'accounts-tab':
        // Ensure AccountsTab accepts these props
        return <AccountsTab
                    accounts={appData.accounts}
                    // FIX: Add type to inline function parameter
                    onAccountsUpdate={(updatedAccounts: Account[]) => updateAppData('accounts', updatedAccounts)}
                    logAdminActivity={logAdminActivity}
                 />;
      case 'transactions-tab':
        // Ensure TransactionsTab accepts these props
        return <TransactionsTab
                    transactions={appData.transactions}
                    merchants={appData.merchants}
                 />;
      case 'merchants-tab':
        // Ensure MerchantsTab accepts these props
        return <MerchantsTab
                    merchants={appData.merchants}
                    transactions={appData.transactions}
                    // FIX: Add type to inline function parameter
                    onMerchantsUpdate={(updatedMerchants: Merchant[]) => updateAppData('merchants', updatedMerchants)}
                    logAdminActivity={logAdminActivity}
                 />;
      case 'activity-log-tab':
        // Ensure ActivityLogTab accepts this prop
        return <ActivityLogTab logs={appData.adminActivityLog} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div>
      {/* Ensure Navbar accepts these props */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminName={adminEmail} // Ensure Navbar expects 'adminName' not 'adminEmail' if used for display
        onLogout={handleLogout}
      />
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;