// src/app/components/Navbar.tsx
import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  adminName: string;
  onLogout: () => void;
}

const tabs = [
  { id: 'dashboard-tab', label: 'Dashboard' },
  { id: 'onboarding-tab', label: 'Onboarding' },
  { id: 'accounts-tab', label: 'Accounts' },
  { id: 'transactions-tab', label: 'Transaction History' },
  { id: 'merchants-tab', label: 'Merchants' },
  { id: 'activity-log-tab', label: 'Activity Log' },
];

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, adminName, onLogout }) => {
  return (
    // Added classes from <nav> in Admin.txt
    <nav className="bg-white shadow-md mb-6 rounded-lg">
      {/* Top Section */}
      {/* Added classes from inner div */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Added classes from inner div */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">Aid Distribution System</h1>
          </div>
          {/* Added classes from inner div */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{adminName || 'Admin User'}</span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-700 hover:text-primary" // Added hover effect
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tabs */}
      {/* Added classes from wrapping divs */}
      <div className="border-t border-gray-200">
        <div className="px-2 sm:px-6 lg:px-8">
          <div className="flex flex-wrap -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                // Combined classes from button in Admin.txt + conditional logic
                className={`admin-tab-btn whitespace-nowrap py-4 px-1 mr-8 font-medium text-sm border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary' // Active state
                    // Inactive state + hover effects from Admin.txt
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;