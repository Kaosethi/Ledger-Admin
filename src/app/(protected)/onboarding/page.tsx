"use client";

import { useEffect, useState } from "react";
import OnboardingTab from "@/components/tabs/OnboardingTab";
import { Account } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();

  // Fetch data for onboarding
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Fetch existing accounts for reference
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Failed to fetch existing accounts. Some features may be limited.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handlers for onboarding operations
  const handleAccountAdd = (newAccount: Account) => {
    setAccounts((prev) => [newAccount, ...prev]);
    toast({
      title: "Account Created",
      description: `Account ${newAccount.displayId} for ${newAccount.childName} was successfully registered.`,
      variant: "default",
    });
  };

  const handleAccountError = (error: string) => {
    toast({
      title: "Registration Failed",
      description: error,
      variant: "destructive",
    });
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

  return (
    <OnboardingTab
      accounts={accounts}
      onAccountAdd={handleAccountAdd}
      onAccountError={handleAccountError}
      logAdminActivity={logAdminActivity}
    />
  );
}
