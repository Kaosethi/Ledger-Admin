"use client";

import { useEffect, useState, useCallback } from "react";
import AccountsTab from "@/components/tabs/AccountsTab";
import {
  Account,
  Transaction,
  Merchant,
  PendingRegistration,
} from "@/lib/mockData";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  bulkApproveAccounts,
  bulkRejectAccounts,
  BulkApproveResult,
  BulkRejectResult,
} from "@/lib/api/accounts";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchInterval: 1000 * 30, // Refetch every 30 seconds
    },
  },
});

// Debounce helper function
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Wrap component with provider
export default function AccountsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountsContent />
    </QueryClientProvider>
  );
}

function AccountsContent() {
  // Input state for immediate UI feedback
  const [accountSearchInput, setAccountSearchInput] = useState("");
  const [pendingSearchInput, setPendingSearchInput] = useState("");
  const [accountsFilter, setAccountsFilter] = useState({
    status: "",
    search: "",
  });

  // Debounced values for API calls
  const debouncedAccountSearch = useDebounce(accountSearchInput, 500);
  const debouncedPendingSearch = useDebounce(pendingSearchInput, 500);

  // Apply debounced account search to filter
  useEffect(() => {
    setAccountsFilter((prev) => ({
      ...prev,
      search: debouncedAccountSearch,
    }));
  }, [debouncedAccountSearch]);

  // Fetch accounts with React Query
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isFetching: accountsFetching,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["accounts", accountsFilter.status, accountsFilter.search],
    queryFn: async () => {
      // Build query params for filtering
      const params = new URLSearchParams();
      if (accountsFilter.status) params.append("status", accountsFilter.status);
      if (accountsFilter.search) params.append("search", accountsFilter.search);

      const res = await fetch(`/api/accounts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch accounts");
      }
      return res.json();
    },
    placeholderData: keepPreviousData, // Keep previous data while loading new data
  });

  // Fetch pending registrations with React Query
  const {
    data: pendingRegistrations = [],
    isLoading: pendingLoading,
    isFetching: pendingFetching,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ["pendingRegistrations", debouncedPendingSearch],
    queryFn: async () => {
      // Build query params for filtering
      const params = new URLSearchParams();
      if (debouncedPendingSearch) {
        params.append("search", debouncedPendingSearch);
      }
      params.append("status", "Pending");

      const res = await fetch(`/api/accounts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch pending registrations");
      }
      return res.json();
    },
    placeholderData: keepPreviousData, // Keep previous data while loading new data
  });

  // Fetch transactions with React Query
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const responseData = await res.json();
      // The API returns { data, totalCount }, so we need to access the data property
      return responseData.data || responseData;
    },
  });

  // Fetch merchants with React Query
  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ["merchants"],
    queryFn: async () => {
      const res = await fetch("/api/merchants");
      if (!res.ok) {
        throw new Error("Failed to fetch merchants");
      }
      return res.json();
    },
  });

  // Create mutations for bulk operations
  const bulkApproveMutation = useMutation<BulkApproveResult, Error, string[]>({
    mutationFn: bulkApproveAccounts,
    onSuccess: (result) => {
      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });

      // If there were any failures, show alert
      if (result.failed && result.failed.length > 0) {
        alert(
          `${result.approved.length} accounts approved successfully. ${result.failed.length} failed.`
        );
      }
    },
  });

  const bulkRejectMutation = useMutation<BulkRejectResult, Error, string[]>({
    mutationFn: bulkRejectAccounts,
    onSuccess: (result) => {
      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });

      // If there were any failures, show alert
      if (result.failed && result.failed.length > 0) {
        alert(
          `${result.rejected.length} accounts rejected successfully. ${result.failed.length} failed.`
        );
      }
    },
  });

  // Use more granular loading states for better UX
  // Initial page load - show full page loading
  const initialLoading =
    (accountsLoading && !accountsFetching) ||
    (pendingLoading && !pendingFetching) ||
    transactionsLoading ||
    merchantsLoading;

  // Background refresh - don't show full loading skeletons
  const isRefreshing = {
    accounts: accountsFetching && !accountsLoading,
    pending: pendingFetching && !pendingLoading,
  };

  // Mutations loading
  const isMutating =
    bulkApproveMutation.isPending || bulkRejectMutation.isPending;

  // Handle account operations with react-query invalidation
  const handleAccountsUpdate = async (updatedAccounts: Account[]) => {
    // Optimistic update - immediately update UI
    queryClient.setQueryData(
      ["accounts", accountsFilter.status, accountsFilter.search],
      updatedAccounts
    );

    // Invalidate and refetch to ensure data consistency
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  const handleAccountAdd = async (newAccount: Account) => {
    // Optimistic update
    queryClient.setQueryData(
      ["accounts", accountsFilter.status, accountsFilter.search],
      (old: Account[] = []) => [newAccount, ...old]
    );

    // Invalidate and refetch
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  const handlePendingRegistrationsUpdate = async (
    updatedList: PendingRegistration[]
  ) => {
    // Optimistic update
    queryClient.setQueryData(
      ["pendingRegistrations", debouncedPendingSearch],
      updatedList
    );

    // Invalidate and refetch both pending and accounts
    await queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  // Handle bulk operations
  const handleBulkApprove = async (selectedIds: Set<string>) => {
    const idsArray = Array.from(selectedIds);
    if (!idsArray.length) return false;

    try {
      // Optimistic update - remove from pending list immediately
      queryClient.setQueryData(
        ["pendingRegistrations", debouncedPendingSearch],
        (old: PendingRegistration[] = []) =>
          old.filter((item) => !selectedIds.has(item.id))
      );

      // Execute bulk approve
      await bulkApproveMutation.mutateAsync(idsArray);

      return true;
    } catch (error) {
      console.error("Error in bulk approve:", error);
      return false;
    }
  };

  const handleBulkReject = async (selectedIds: Set<string>) => {
    const idsArray = Array.from(selectedIds);
    if (!idsArray.length) return false;

    try {
      // Optimistic update - remove from pending list immediately
      queryClient.setQueryData(
        ["pendingRegistrations", debouncedPendingSearch],
        (old: PendingRegistration[] = []) =>
          old.filter((item) => !selectedIds.has(item.id))
      );

      // Execute bulk reject
      await bulkRejectMutation.mutateAsync(idsArray);

      return true;
    } catch (error) {
      console.error("Error in bulk reject:", error);
      return false;
    }
  };

  // Handle account filtering (search and status)
  const handleAccountSearch = (searchTerm: string) => {
    setAccountSearchInput(searchTerm);
  };

  const handleAccountStatusFilter = (status: string) => {
    setAccountsFilter((prev) => ({
      ...prev,
      status: status,
    }));
  };

  // Handle pending registrations search
  const handlePendingRegistrationsSearch = (searchTerm: string) => {
    setPendingSearchInput(searchTerm);
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
    <AccountsTab
      accounts={accounts}
      allTransactions={transactions}
      merchants={merchants}
      pendingRegistrations={pendingRegistrations}
      onAccountsUpdate={handleAccountsUpdate}
      onAccountAdd={handleAccountAdd}
      onPendingRegistrationsUpdate={handlePendingRegistrationsUpdate}
      logAdminActivity={logAdminActivity}
      isLoading={initialLoading}
      isRefreshing={isRefreshing}
      isMutating={isMutating}
      onAccountSearch={handleAccountSearch}
      onAccountStatusFilter={handleAccountStatusFilter}
      accountsFilter={{
        status: accountsFilter.status,
        search: accountSearchInput, // Use the input state for immediate UI feedback
      }}
      onPendingRegistrationsSearch={handlePendingRegistrationsSearch}
      pendingRegistrationsSearch={pendingSearchInput} // Use the input state for immediate UI feedback
      onBulkApprove={handleBulkApprove}
      onBulkReject={handleBulkReject}
    />
  );
}
