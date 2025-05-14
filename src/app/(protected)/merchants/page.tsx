// MerchantsPage.tsx (e.g., src/app/admin/merchants/page.tsx or similar)
"use client";

import { useEffect, useState } from "react";
import MerchantsTab from "@/components/tabs/MerchantsTab"; // Adjust path as needed

// MODIFIED: Import types from @/lib/mockData
// Ensure MockMerchant (or your equivalent API-aligned Merchant type), Transaction,
// and BackendMerchantStatus are EXPORTED from your src/lib/mockData.ts file.
import { Merchant, Transaction, BackendMerchantStatus, Account /*, other types as needed */ } from "@/lib/mockData";
export default function MerchantsPage() {
  // MODIFIED: Use the imported types for state
  const [merchants, setMerchants] = useState<Merchant[]>([]); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const merchantsResponse = await fetch("/api/merchants");
        if (!merchantsResponse.ok) {
          throw new Error(`Failed to fetch merchants: ${merchantsResponse.status} ${merchantsResponse.statusText}`);
        }
        // Ensure the JSON response matches the MockMerchant[] structure
        const merchantsData: Merchant[] = await merchantsResponse.json();
        setMerchants(merchantsData);

        // Assuming you fetch transactions
        const transactionsResponse = await fetch("/api/transactions"); // Adjust if needed
        if (!transactionsResponse.ok) {
          throw new Error(`Failed to fetch transactions: ${transactionsResponse.status} ${transactionsResponse.statusText}`);
        }
        // Ensure the JSON response matches the Transaction[] structure
        const transactionsData: Transaction[] = await transactionsResponse.json();
        setTransactions(transactionsData);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "An unknown error occurred while fetching data.");
        setMerchants([]);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => { // MODIFIED type
    setMerchants(updatedMerchants);
  };

  const logAdminActivity = (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => {
    console.log(`Admin activity logged (client-side): ${action}`, { targetType, targetId, details });
    // Implement API call for logging if needed
  };

  if (error && !loading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500 text-center">Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <MerchantsTab
        merchants={merchants} // merchants is MockMerchant[]
        transactions={transactions} // transactions is Transaction[]
        onMerchantsUpdate={handleMerchantsUpdate}
        logAdminActivity={logAdminActivity}
        merchantsLoading={loading}
      />
    </div>
  );
}