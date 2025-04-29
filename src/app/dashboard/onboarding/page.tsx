'use client';

import { useEffect, useState } from 'react';
import OnboardingTab from '@/components/tabs/OnboardingTab';

// Types for the data needed by OnboardingTab
interface Account {
  id: string;
  childName: string;
  guardianName: string;
  // Add any other fields needed by the component
}

interface PendingRegistration {
  id: string;
  childName: string;
  guardianName: string;
  guardianContact: string;
  status: string;
  submittedAt: string;
  // Add any other fields needed by the component
}

export default function OnboardingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for onboarding
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch existing accounts for reference
        const accountsResponse = await fetch('/api/accounts');
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }

        // Fetch pending registrations
        // Note: You may need to create this API endpoint
        const pendingResponse = await fetch('/api/registrations/pending');
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingRegistrations(pendingData);
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handlers for onboarding operations
  const handleAccountAdd = (newAccount: Account) => {
    setAccounts(prev => [newAccount, ...prev]);
  };

  const handlePendingRegistrationsUpdate = (updatedList: PendingRegistration[]) => {
    setPendingRegistrations(updatedList);
  };

  if (loading) {
    return <div className="text-center py-10">Loading onboarding data...</div>;
  }

  return (
    <OnboardingTab
      accounts={accounts}
      pendingRegistrations={pendingRegistrations}
      onAccountAdd={handleAccountAdd}
      onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate}
    />
  );
} 