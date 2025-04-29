"use client";

import { useEffect, useState } from "react";
import TransactionsTab from "@/components/tabs/TransactionsTab";

// Types for the data needed by TransactionsTab
interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  type: string;
  accountId: string;
  merchantId?: string;
  status: string;
  declineReason?: string;
  description?: string;
  // Add any other fields needed by the component
}

interface Account {
  id: string;
  childName: string;
  guardianName: string;
  // Add any other fields needed by the component
}

interface Merchant {
  id: string;
  businessName: string;
  // Add any other fields needed by the component
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions
        const transactionsResponse = await fetch("/api/transactions");
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        }

        // Fetch accounts for reference
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }

        // Fetch merchants for reference
        const merchantsResponse = await fetch("/api/merchants");
        if (merchantsResponse.ok) {
          const merchantsData = await merchantsResponse.json();
          setMerchants(merchantsData);
        }
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading transaction data...</div>;
  }

  return (
    <TransactionsTab
      transactions={transactions}
      accounts={accounts}
      merchants={merchants}
    />
  );
}
