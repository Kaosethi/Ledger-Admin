"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import MerchantsTab from "@/components/tabs/MerchantsTab";
// Import Account type from lib/mockData.ts
// Transaction type from lib/mockData.ts should define timestamp, createdAt, updatedAt as Date
import { Merchant, Transaction, Account } from "@/lib/mockData"; 

const queryClientInstance = new QueryClient();

export default function MerchantsPageWrapper() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <MerchantsPage />
    </QueryClientProvider>
  );
}

const fetchMerchants = async (): Promise<Merchant[]> => {
  const response = await fetch("/api/merchants");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch merchants: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

// VVVV MODIFIED THIS FUNCTION VVVV
const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch("/api/transactions");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transactions: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  // Transform date strings from API to Date objects to match Transaction type from lib/mockData.ts
  return data.map((tx: any) => ({ 
    ...tx,
    timestamp: new Date(tx.timestamp), // Convert string to Date
    createdAt: new Date(tx.createdAt), // Convert string to Date
    updatedAt: new Date(tx.updatedAt), // Convert string to Date
    amount: String(tx.amount), // Ensure amount is string as per rich Transaction type
    // Other fields like paymentId, pinVerified, metadata, reference should be present
    // if your API returns them and lib/mockData.ts Transaction type includes them.
  }));
};
// VVVV END MODIFICATION VVVV

const fetchAccounts = async (): Promise<Account[]> => {
  const response = await fetch("/api/accounts");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch accounts: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

const approveMerchant = async (id: string): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) { throw new Error(`Failed to approve merchant: ${response.status} ${response.statusText}`); }
  return response.json();
};

const rejectMerchant = async ({ id, declineReason }: { id: string; declineReason?: string; }): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ declineReason: declineReason || "No reason provided" }),
  });
  if (!response.ok) { throw new Error(`Failed to reject merchant: ${response.status} ${response.statusText}`); }
  return response.json();
};

const suspendMerchant = async ({ id, reason }: { id: string; reason?: string; }): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/suspend`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || "No reason provided" }),
  });
  if (!response.ok) { throw new Error(`Failed to suspend merchant: ${response.status} ${response.statusText}`); }
  return response.json();
};

const reactivateMerchant = async (id: string): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/reactivate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) { throw new Error(`Failed to reactivate merchant: ${response.status} ${response.statusText}`); }
  return response.json();
};

function MerchantsPage() {
  const queryClientHook = useQueryClient();
  const [error, setError] = useState<string | null>(null); 
  const [closeModalCallback, setCloseModalCallback] = useState<(() => void) | null>(null);

  const {
    data: merchants = [],
    isLoading: merchantsLoading,
    error: merchantsError,
  } = useQuery<Merchant[], Error>({
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });

  // useQuery now expects fetchTransactions to return Transaction[] with Date objects
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery<Transaction[], Error>({ 
    queryKey: ["transactions"],
    queryFn: fetchTransactions, // This function now transforms dates
  });

  const { 
    data: accounts = [], 
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery<Account[], Error>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const approveMutation = useMutation({ mutationFn: approveMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } }});
  const rejectMutation = useMutation({ mutationFn: rejectMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } }});
  const suspendMutation = useMutation({ mutationFn: suspendMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } }});
  const reactivateMutation = useMutation({ mutationFn: reactivateMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } }});

  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    queryClientHook.setQueryData(["merchants"], updatedMerchants);
  };

  const logAdminActivity = ( action: string, targetType?: string, targetId?: string, details?: string ) => {
    console.log(`Admin activity logged (client-side): ${action}`, { targetType, targetId, details });
  };

  const handleApproveMerchant = (id: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); approveMutation.mutate(id); };
  const handleRejectMerchant = (id: string, reason?: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); rejectMutation.mutate({ id, declineReason: reason }); };
  const handleSuspendMerchant = (id: string, reason?: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); suspendMutation.mutate({ id, reason }); };
  const handleReactivateMerchant = (id: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); reactivateMutation.mutate(id); };

  const queryError = merchantsError || transactionsError || accountsError; 
  if (queryError || error) { 
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500 text-center">
          Error loading data: {queryError?.message || error}
        </p>
      </div>
    );
  }

  const combinedLoadingState = merchantsLoading || transactionsLoading || accountsLoading;

  return (
    <div className="container mx-auto p-4">
      <MerchantsTab
        merchants={merchants}
        transactions={transactions} // These transactions now have Date objects for timestamps
        accounts={accounts} 
        onMerchantsUpdate={handleMerchantsUpdate}
        logAdminActivity={logAdminActivity}
        merchantsLoading={combinedLoadingState} 
        
        approveMerchant={handleApproveMerchant}
        rejectMerchant={handleRejectMerchant}
        suspendMerchant={handleSuspendMerchant}
        reactivateMerchant={handleReactivateMerchant}
        
        approvalLoading={approveMutation.isPending}
        rejectionLoading={rejectMutation.isPending}
        suspensionLoading={suspendMutation.isPending}
        reactivationLoading={reactivateMutation.isPending}
      />
    </div>
  );
}