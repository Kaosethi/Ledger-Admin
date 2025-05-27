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
  Account,
  BackendMerchantStatus,
} from "@/lib/mockData"; // Added BackendMerchantStatus

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

const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch("/api/transactions");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transactions: ${response.status} ${response.statusText}`
    );
  }
  const responseData = await response.json();
  // The API returns { data, totalCount }, so we need to access the data property
  const transactions = responseData.data || responseData;
  return transactions.map((tx: any) => ({
    ...tx,
    timestamp: new Date(tx.timestamp),
    createdAt: new Date(tx.createdAt),
    updatedAt: new Date(tx.updatedAt),
    amount: String(tx.amount),
  }));
};

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

const suspendMerchant = async ({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/suspend`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || "No reason provided" }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to suspend merchant: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

// MODIFIED: reactivateMerchant async function to accept { id, status } and send status in body
const reactivateMerchant = async ({
  id,
  status,
}: {
  id: string;
  status: BackendMerchantStatus;
}): Promise<Merchant> => {
  const response = await fetch(`/api/merchants/${id}/reactive`, {
    // Correct endpoint
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }), // Send the target status in the body
  });
  if (!response.ok) {
    throw new Error(
      `Failed to set merchant to reactive status: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

function MerchantsPage() {
  const queryClientHook = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [closeModalCallback, setCloseModalCallback] = useState<
    (() => void) | null
  >(null);

  const {
    data: merchants = [],
    isLoading: merchantsLoading,
    error: merchantsError,
  } = useQuery<Merchant[], Error>({
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery<Transaction[], Error>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery<Account[], Error>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const commonMutationOptions = {
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ["merchants"] });
      if (closeModalCallback) {
        closeModalCallback();
        setCloseModalCallback(null);
      }
    },
    onError: () => {
      // Consider logging the error or showing a toast notification
      if (closeModalCallback) {
        closeModalCallback();
        setCloseModalCallback(null);
      }
    },
  };

  const approveMutation = useMutation({
    mutationFn: approveMerchant,
    ...commonMutationOptions,
  });
  const rejectMutation = useMutation({
    mutationFn: rejectMerchant,
    ...commonMutationOptions,
  });
  const suspendMutation = useMutation({
    mutationFn: suspendMerchant,
    ...commonMutationOptions,
  });
  // MODIFIED: reactivateMutation now uses the updated reactivateMerchant function
  const reactivateMutation = useMutation({
    mutationFn: reactivateMerchant, // This function now expects { id, status }
    ...commonMutationOptions,
  });

  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    queryClientHook.setQueryData(["merchants"], updatedMerchants);
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
  };

  const handleApproveMerchant = (id: string, closeModal?: () => void) => {
    if (closeModal) setCloseModalCallback(() => closeModal);
    approveMutation.mutate(id);
  };
  const handleRejectMerchant = (
    id: string,
    reason?: string,
    closeModal?: () => void
  ) => {
    if (closeModal) setCloseModalCallback(() => closeModal);
    rejectMutation.mutate({ id, declineReason: reason });
  };
  const handleSuspendMerchant = (
    id: string,
    reason?: string,
    closeModal?: () => void
  ) => {
    if (closeModal) setCloseModalCallback(() => closeModal);
    suspendMutation.mutate({ id, reason });
  };
  // MODIFIED: handleReactivateMerchant to pass the object { id, status }
  const handleReactivateMerchant = (
    args: { merchantId: string; status: BackendMerchantStatus },
    closeModal?: () => void
  ) => {
    if (closeModal) setCloseModalCallback(() => closeModal);
    // Pass the object with id (as merchantId) and status
    reactivateMutation.mutate({ id: args.merchantId, status: args.status });
  };

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

  const combinedLoadingState =
    merchantsLoading || transactionsLoading || accountsLoading;

  console.log(
    "[MerchantsPage] transactions data before passing to MerchantsTab:",
    transactions
  );
  if (transactions && transactions.length > 0) {
    console.log(
      "[MerchantsPage] First transaction in MerchantsPage:",
      transactions[0]
    );
    console.log(
      "[MerchantsPage] Timestamp type of first transaction in MerchantsPage:",
      typeof transactions[0].timestamp,
      transactions[0].timestamp instanceof Date
        ? "IS Date object"
        : "IS NOT Date object"
    );
    console.log(
      "[MerchantsPage] createdAt type of first transaction in MerchantsPage:",
      typeof transactions[0].createdAt,
      transactions[0].createdAt instanceof Date
        ? "IS Date object"
        : "IS NOT Date object"
    );
    console.log(
      "[MerchantsPage] updatedAt type of first transaction in MerchantsPage:",
      typeof transactions[0].updatedAt,
      transactions[0].updatedAt instanceof Date
        ? "IS Date object"
        : "IS NOT Date object"
    );
  }

  return (
    <div className="container mx-auto p-4">
      <MerchantsTab
        merchants={merchants}
        transactions={transactions}
        accounts={accounts}
        onMerchantsUpdate={handleMerchantsUpdate}
        logAdminActivity={logAdminActivity}
        merchantsLoading={combinedLoadingState}
        approveMerchant={handleApproveMerchant}
        rejectMerchant={handleRejectMerchant}
        suspendMerchant={handleSuspendMerchant}
        reactivateMerchant={handleReactivateMerchant} // This prop now expects args: { merchantId, status }
        approvalLoading={approveMutation.isPending}
        rejectionLoading={rejectMutation.isPending}
        suspensionLoading={suspendMutation.isPending}
        reactivationLoading={reactivateMutation.isPending}
      />
    </div>
  );
}
