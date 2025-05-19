// src/app/(protected)/transactions/page.tsx (or similar path)
"use client";

import { useEffect, useState } from "react";
import TransactionsTab from "@/components/tabs/TransactionsTab";
// Ensure Transaction type from mockData expects Date objects for timestamp, createdAt, updatedAt
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
    const fetchAndTransformTransactions = async () => { // Renamed for clarity
      setTransactionsLoading(true); // Set loading true at the start of fetch
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          // VVVV ADD TRANSFORMATION HERE VVVV
          const transformedTransactions = data.map((tx: any) => ({
            ...tx,
            timestamp: new Date(tx.timestamp),
            createdAt: new Date(tx.createdAt),
            updatedAt: new Date(tx.updatedAt),
            amount: String(tx.amount), // Ensure amount is string
            // Ensure other fields match your Transaction type in lib/mockData
            // For example, if paymentId is crucial and might be missing:
            // paymentId: tx.paymentId || `fallback-pid-${tx.id}`, 
          }));
          setTransactions(transformedTransactions);
          // ^^^^ END TRANSFORMATION ^^^^
        } else {
          console.error("Failed to fetch transactions:", response.status, response.statusText);
          // Optionally set an error state here to display to the user
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        // Optionally set an error state here
      } finally {
        setTransactionsLoading(false);
      }
    };
    fetchAndTransformTransactions();
  }, []);

  // Fetch accounts
  useEffect(() => {
    setAccountsLoading(true);
    const fetchAccountsData = async () => {
      try {
        const response = await fetch("/api/accounts");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        } else {
          console.error("Failed to fetch accounts:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccountsData();
  }, []);

  // Fetch merchants
  useEffect(() => {
    setMerchantsLoading(true);
    const fetchMerchantsData = async () => {
      try {
        const response = await fetch("/api/merchants");
        if (response.ok) {
          const data = await response.json();
          setMerchants(data);
        } else {
          console.error("Failed to fetch merchants:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching merchants:", error);
      } finally {
        setMerchantsLoading(false);
      }
    };
    fetchMerchantsData();
  }, []);

  // Optional: Add a combined loading state if TransactionsTab shows a global loader
  // const isLoading = transactionsLoading || accountsLoading || merchantsLoading;

  // You can also add console logs here to verify the transactions prop before passing
  // console.log("[TransactionsPage] transactions before passing to TransactionsTab:", transactions);
  // if (transactions.length > 0) {
  //   console.log("[TransactionsPage] First transaction timestamp type:", typeof transactions[0].timestamp, transactions[0].timestamp instanceof Date);
  // }

  return (
    <TransactionsTab
      transactions={transactions} // This will now pass transactions with Date objects
      merchants={merchants}
      accounts={accounts}
      transactionsLoading={transactionsLoading}
      accountsLoading={accountsLoading}
      merchantsLoading={merchantsLoading}
    />
  );
}