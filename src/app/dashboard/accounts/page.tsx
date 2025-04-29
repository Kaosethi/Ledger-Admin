"use client";

import { useEffect, useState } from "react";
import AccountsTab from "@/components/tabs/AccountsTab";

// Types for the data needed by AccountsTab
interface Account {
  id: string;
  childName: string;
  guardianName: string;
  balance: number;
  status: string;
  lastActivity: string;
  createdAt: string;
  // Add any other fields needed by the component
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts data
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/accounts");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Handlers for account operations
  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    setAccounts(updatedAccounts);
  };

  const handleAccountAdd = (newAccount: Account) => {
    setAccounts((prev) => [newAccount, ...prev]);
  };

  if (loading) {
    return <div className="text-center py-10">Loading accounts data...</div>;
  }

  return (
    <AccountsTab
      accounts={accounts}
      onAccountsUpdate={handleAccountsUpdate}
      onAccountAdd={handleAccountAdd}
    />
  );
}
