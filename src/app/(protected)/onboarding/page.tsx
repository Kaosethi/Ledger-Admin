"use client";

import { useEffect, useState } from "react";
import OnboardingTab from "@/components/tabs/OnboardingTab";
import { Account } from "@/lib/mockData";

export default function OnboardingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for onboarding
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch existing accounts for reference
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handlers for onboarding operations
  const handleAccountAdd = (newAccount: Account) => {
    setAccounts((prev) => [newAccount, ...prev]);
  };

  const logAdminActivity = (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => {
    console.log(`Admin activity: ${action}`, { targetType, targetId, details });
    // In a real app, this would call an API to log the activity
  };

  if (loading) {
    return <div className="text-center py-10">Loading onboarding data...</div>;
  }

  return (
    <OnboardingTab
      accounts={accounts}
      onAccountAdd={handleAccountAdd}
      logAdminActivity={logAdminActivity}
    />
  );
}
