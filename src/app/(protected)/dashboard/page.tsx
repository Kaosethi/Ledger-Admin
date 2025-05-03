"use client";

import { useEffect, useState } from "react";
import DashboardTab from "@/components/tabs/DashboardTab";
import { Account, Merchant, Transaction } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";

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
    // Skeleton Loading State
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        {/* Skeleton Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl shadow-md p-6 border border-gray-200"
            >
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>

        {/* Skeleton Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart Skeleton */}
          <div className="lg:col-span-2 bg-gray-100 rounded-xl shadow-md p-6 border border-gray-200">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-72 w-full" />{" "}
            {/* Approximate height of the chart area */}
          </div>
          {/* Pie Chart Skeleton */}
          <div className="bg-gray-100 rounded-xl shadow-md p-6 border border-gray-200 flex flex-col items-center">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-72 w-72 rounded-full" />{" "}
            {/* Approximate size of the pie chart */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardTab
      accounts={accounts}
      merchants={merchants}
      transactions={transactions}
    />
  );
}
