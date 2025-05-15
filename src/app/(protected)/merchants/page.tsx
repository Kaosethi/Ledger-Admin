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
import {
  Merchant,
  Transaction,
  BackendMerchantStatus,
  Account,
} from "@/lib/mockData";

// Query client setup to manage cache
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider
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

const approveMerchant = async (id: string): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to approve merchant: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

const rejectMerchant = async ({
  id,
  declineReason,
}: {
  id: string;
  declineReason?: string;
}): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      declineReason: declineReason || "No reason provided",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to reject merchant: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

function MerchantsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  // Ref to track which component to notify about mutation completion
  const [closeModalCallback, setCloseModalCallback] = useState<
    (() => void) | null
  >(null);

  // Fetch merchants with React Query
  const {
    data: merchants = [],
    isLoading: merchantsLoading,
    error: merchantsError,
  } = useQuery({
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });

  // Fetch transactions with React Query
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  // Mutation for approving a merchant
  const approveMutation = useMutation({
    mutationFn: approveMerchant,
    onSuccess: () => {
      // Invalidate and refetch merchants after approval
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      // Close modal if there's a callback
      if (closeModalCallback) {
        closeModalCallback();
        setCloseModalCallback(null);
      }
    },
    onError: () => {
      // Close modal if there's a callback, even on error
      if (closeModalCallback) {
        closeModalCallback();
        setCloseModalCallback(null);
      }
    },
  });

  // Mutation for rejecting a merchant
  const rejectMutation = useMutation({
    mutationFn: rejectMerchant,
    onSuccess: () => {
      // Invalidate and refetch merchants after rejection
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      // Close modal if there's a callback
      if (closeModalCallback) {
        closeModalCallback();
        setCloseModalCallback(null);
      }
    },
    onError: () => {
      // Close modal if there's a callback, even on error
      if (closeModalCallback) {
        closeModalCallback();
        setCloseModalCallback(null);
      }
    },
  });

  // Custom handler for merchant updates that will be passed down to MerchantsTab
  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    // This will update the cached merchants data
    queryClient.setQueryData(["merchants"], updatedMerchants);
  };

  const logAdminActivity = (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => {
    console.log(`Admin activity logged (client-side): ${action}`, {
      targetType,
      targetId,
      details,
    });
    // Implement API call for logging if needed
  };

  // Handler for merchant approval with modal closing
  const handleApproveMerchant = (id: string, closeModal?: () => void) => {
    if (closeModal) {
      setCloseModalCallback(() => closeModal);
    }
    approveMutation.mutate(id);
  };

  // Handler for merchant rejection with modal closing
  const handleRejectMerchant = (
    id: string,
    reason?: string,
    closeModal?: () => void
  ) => {
    if (closeModal) {
      setCloseModalCallback(() => closeModal);
    }
    rejectMutation.mutate({ id, declineReason: reason });
  };

  // Show error if any query fails
  const queryError = merchantsError as Error | null;
  if (queryError || error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500 text-center">
          Error loading data: {queryError?.message || error}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <MerchantsTab
        merchants={merchants}
        transactions={transactions}
        onMerchantsUpdate={handleMerchantsUpdate}
        logAdminActivity={logAdminActivity}
        merchantsLoading={merchantsLoading || transactionsLoading}
        // Updated props to provide mutation functions to child components
        approveMerchant={handleApproveMerchant}
        rejectMerchant={handleRejectMerchant}
        // Provide mutation loading states to show loading indicators
        approvalLoading={approveMutation.isPending}
        rejectionLoading={rejectMutation.isPending}
      />
    </div>
  );
}
