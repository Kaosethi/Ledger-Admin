"use client";

import { useEffect, useState } from "react";
import TransactionsTab from "@/components/tabs/TransactionsTab";
import type { Transaction, Account, Merchant } from "@/lib/mockData";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [merchantsLoading, setMerchantsLoading] = useState(true);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setTransactionsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Fetch accounts
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
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch merchants
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch("/api/merchants");
        if (response.ok) {
          const data = await response.json();
          setMerchants(data);
        }
      } catch (error) {
        console.error("Error fetching merchants:", error);
      } finally {
        setMerchantsLoading(false);
      }
    };
    fetchMerchants();
  }, []);

  return (
    <TransactionsTab
      transactions={transactions}
      merchants={merchants}
      accounts={accounts}
      transactionsLoading={transactionsLoading}
      accountsLoading={accountsLoading}
      merchantsLoading={merchantsLoading}
    />
  );
}
