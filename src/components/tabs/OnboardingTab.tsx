import React from 'react';
import type { Account } from '@/lib/mockData'; // Import types

// Define props expected by this tab
interface OnboardingTabProps {
  accounts: Account[]; // Example prop, adjust if not needed
  onAccountAdd: (newAccount: Account) => void;
  logAdminActivity: (action: string, targetType: string, targetId: string, details: string) => void;
}

// Use React.FC and the props interface
const OnboardingTab: React.FC<OnboardingTabProps> = ({ accounts, onAccountAdd, logAdminActivity }) => {
  // Example of using a prop (remove or implement)
  const handleAddDummyAccount = () => {
    const dummyAccount: Account = { id: `ACC-${Date.now()}`, name: "New User", email: "new@example.com", status: 'Pending'};
    onAccountAdd(dummyAccount);
    logAdminActivity("Add Account", "Account", dummyAccount.id, `Dummy account ${dummyAccount.name} added via onboarding.`);
  };

  return (
    <div>
      <h2>Onboarding Tab Content</h2>
      <p>Content for merchant/account onboarding goes here.</p>
      {/* Add onboarding forms/steps later */}
      <button onClick={handleAddDummyAccount} className="p-2 bg-blue-500 text-white rounded">Add Dummy Account</button>
    </div>
  );
};

export default OnboardingTab;