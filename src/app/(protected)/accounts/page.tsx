"use client";

import { useEffect, useState } from "react";
import AccountsTab from "@/components/tabs/AccountsTab";
import {
  Account,
  Transaction,
  Merchant,
  PendingRegistration,
} from "@/lib/mockData";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch accounts
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const data = await accountsResponse.json();
          setAccounts(data);
        }

        // Fetch transactions
        const transactionsResponse = await fetch("/api/transactions");
        if (transactionsResponse.ok) {
          const data = await transactionsResponse.json();
          setTransactions(data);
        }

        // Fetch merchants
        const merchantsResponse = await fetch("/api/merchants");
        if (merchantsResponse.ok) {
          const data = await merchantsResponse.json();
          setMerchants(data);
        }

        // Fetch pending registrations
        const registrationsResponse = await fetch("/api/registrations/pending");
        if (registrationsResponse.ok) {
          const data = await registrationsResponse.json();
          setPendingRegistrations(data);
        }
      } catch (error) {
        console.error("Error fetching accounts data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handlers for account operations
  const handleAccountsUpdate = (updatedAccounts: Account[]) => {
    setAccounts(updatedAccounts);
  };

  const handleAccountAdd = (newAccount: Account) => {
    setAccounts((prev) => [newAccount, ...prev]);
  };

  const handlePendingRegistrationsUpdate = (
    updatedList: PendingRegistration[]
  ) => {
    setPendingRegistrations(updatedList);
  };

  // Log admin activity
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
    <AccountsTab
      accounts={accounts}
      allTransactions={transactions}
      merchants={merchants}
      pendingRegistrations={pendingRegistrations}
      onAccountsUpdate={handleAccountsUpdate}
      onAccountAdd={handleAccountAdd}
      onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate}
      logAdminActivity={logAdminActivity}
      isLoading={loading}
    />
  );
}
