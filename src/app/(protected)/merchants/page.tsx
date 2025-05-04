"use client";

import { useEffect, useState } from "react";
import MerchantsTab from "@/components/tabs/MerchantsTab";
import { Merchant, Transaction } from "@/lib/mockData";

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler for merchant updates
  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    setMerchants(updatedMerchants);
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
    <MerchantsTab
      merchants={merchants}
      transactions={transactions}
      onMerchantsUpdate={handleMerchantsUpdate}
      logAdminActivity={logAdminActivity}
      merchantsLoading={loading}
    />
  );
}
