"use client";

import { useEffect, useState } from "react";
import DashboardTab from "@/components/tabs/DashboardTab";

// Types for the data needed by DashboardTab
interface Account {
  id: string;
  childName: string;
  guardianName: string;
  balance: number;
  // Add any other fields needed by the component
}

interface Merchant {
  id: string;
  businessName: string;
  // Add any other fields needed by the component
}

interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  type: string;
  accountId: string;
  merchantId?: string;
  status: string;
  // Add any other fields needed by the component
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for the dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch accounts data
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }

        // Fetch merchants data
        const merchantsResponse = await fetch("/api/merchants");
        if (merchantsResponse.ok) {
          const merchantsData = await merchantsResponse.json();
          setMerchants(merchantsData);
        }

        // Fetch transactions data
        const transactionsResponse = await fetch("/api/transactions");
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading dashboard data...</div>;
  }

  return (
    <DashboardTab
      accounts={accounts}
      merchants={merchants}
      transactions={transactions}
    />
  );
}
