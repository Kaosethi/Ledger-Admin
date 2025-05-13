"use client";

import { useEffect, useState } from "react";
import DashboardTab from "@/components/tabs/DashboardTab";
import { Account, Merchant, Transaction } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

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
        console.error("Error fetching accounts data:", error);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch merchants data
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch("/api/merchants");
        if (response.ok) {
          const data = await response.json();
          setMerchants(data);
        }
      } catch (error) {
        console.error("Error fetching merchants data:", error);
      } finally {
        setMerchantsLoading(false);
      }
    };
    fetchMerchants();
  }, []);

  // Fetch transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching transactions data:", error);
      } finally {
        setTransactionsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Render dashboard with per-section skeletons
  return (
    <DashboardTab
      accounts={accounts}
      merchants={merchants}
      transactions={transactions}
      accountsLoading={accountsLoading}
      merchantsLoading={merchantsLoading}
      transactionsLoading={transactionsLoading}
    />
  );
}
