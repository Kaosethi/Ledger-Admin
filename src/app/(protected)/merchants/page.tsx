"use client";

import { useState } from "react"; // Keep existing imports
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient, // Keep QueryClient if used for instantiation
  QueryClientProvider,
} from "@tanstack/react-query";
import MerchantsTab from "@/components/tabs/MerchantsTab";
// Import Account type
import { Merchant, Transaction, Account } from "@/lib/mockData"; 

// Query client setup to manage cache - This is your original setup
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider - Your original wrapper
export default function MerchantsPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <MerchantsPage />
    </QueryClientProvider>
  );
}

// API functions to use with React Query
const fetchMerchants = async (): Promise<Merchant[]> => {
  const response = await fetch("/api/merchants");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch merchants: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch("/api/transactions");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transactions: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

// <<<< ADD API FUNCTION TO FETCH ACCOUNTS (Minimal Change) >>>>
const fetchAccounts = async (): Promise<Account[]> => {
  const response = await fetch("/api/accounts"); // Assuming this endpoint exists
  if (!response.ok) {
    throw new Error(
      `Failed to fetch accounts: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};


// --- Mutation API functions (approveMerchant, rejectMerchant, etc.) - Kept as in your original ---
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
  const response = await fetch(`/api/merchants/${id}/reactivate`, { // Corrected from /reactive
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) { throw new Error(`Failed to reactivate merchant: ${response.status} ${response.statusText}`); }
  return response.json();
};

// Your original MerchantsPage component structure
function MerchantsPage() {
  const queryClientHook = useQueryClient(); // Use the hook as you had it
  const [error, setError] = useState<string | null>(null); 
  const [closeModalCallback, setCloseModalCallback] = useState<(() => void) | null>(null);

  const {
    data: merchants = [],
    isLoading: merchantsLoading,
    error: merchantsError,
  } = useQuery<Merchant[], Error>({ // Added explicit typing for better safety
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });

  const { 
    data: transactions = [], 
    isLoading: transactionsLoading,
    error: transactionsError, // Add error handling for transactions
  } = useQuery<Transaction[], Error>({ // Added explicit typing
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  // <<<< ADD useQuery TO FETCH ACCOUNTS (Minimal Change) >>>>
  const { 
    data: accounts = [], 
    isLoading: accountsLoading, // New loading state
    error: accountsError,       // New error state
  } = useQuery<Account[], Error>({ // Added explicit typing
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  // --- Mutations (approveMutation, rejectMutation, etc.) - Kept as in your original ---
  const approveMutation = useMutation({ mutationFn: approveMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } /* Consider toast.error here */ }});
  const rejectMutation = useMutation({ mutationFn: rejectMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } /* Consider toast.error here */ }});
  const suspendMutation = useMutation({ mutationFn: suspendMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } /* Consider toast.error here */ }});
  const reactivateMutation = useMutation({ mutationFn: reactivateMerchant, onSuccess: () => { queryClientHook.invalidateQueries({ queryKey: ["merchants"] }); if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); }}, onError: () => { if (closeModalCallback) { closeModalCallback(); setCloseModalCallback(null); } /* Consider toast.error here */ }});

  // Custom handler for merchant updates - Kept as in your original
  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    queryClientHook.setQueryData(["merchants"], updatedMerchants);
  };

  // logAdminActivity - Kept as in your original
  const logAdminActivity = ( action: string, targetType?: string, targetId?: string, details?: string ) => {
    console.log(`Admin activity logged (client-side): ${action}`, { targetType, targetId, details });
  };

  // --- Mutation Handlers (handleApproveMerchant, etc.) - Kept as in your original ---
  const handleApproveMerchant = (id: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); approveMutation.mutate(id); };
  const handleRejectMerchant = (id: string, reason?: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); rejectMutation.mutate({ id, declineReason: reason }); };
  const handleSuspendMerchant = (id: string, reason?: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); suspendMutation.mutate({ id, reason }); };
  const handleReactivateMerchant = (id: string, closeModal?: () => void) => { if (closeModal) setCloseModalCallback(() => closeModal); reactivateMutation.mutate(id); };

  // Show error if any query fails - Updated to include accountsError
  const queryError = merchantsError || transactionsError || accountsError; 
  // Your local 'error' state is separate, you might want to combine or handle separately
  if (queryError || error) { 
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500 text-center">
          Error loading data: {queryError?.message || error}
        </p>
      </div>
    );
  }

  // Updated combined loading state
  const combinedLoadingState = merchantsLoading || transactionsLoading || accountsLoading;

  return (
    <div className="container mx-auto p-4">
      <MerchantsTab
        merchants={merchants}
        transactions={transactions}
        accounts={accounts} // <<<< PASSING accounts HERE (Minimal Change)
        onMerchantsUpdate={handleMerchantsUpdate}
        logAdminActivity={logAdminActivity}
        // Use combined loading state or individual ones if MerchantsTab is updated to handle them
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