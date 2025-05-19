// src/components/tabs/TransactionsTab.tsx
"use client";
import React, { useState, useMemo } from "react";
// This import MUST resolve to the "rich" Transaction type from lib/mockData.ts
// that includes paymentId, createdAt, updatedAt, timestamp:Date, amount:string etc.
import type { Transaction, Merchant, Account } from "@/lib/mockData";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
    formatCurrency, 
    formatDateTime,
    renderStatusBadge,
    tuncateUUID,
    cn 
} from "@/lib/utils";
import TransactionDetailModal from "../modals/TransactionDetailModal";
import {
  DownloadIcon, // For Export button
  ChevronLeftIcon, 
  ChevronRightIcon,
  XIcon,
  CalendarIcon,
} from "lucide-react";
import { format as formatDateFns } from "date-fns";
import { unparse } from "papaparse"; // For CSV export

const ITEMS_PER_PAGE = 10;

interface TransactionsTabProps {
  transactions: Transaction[];
  merchants: Merchant[];
  accounts: Account[];
  transactionsLoading?: boolean;
  accountsLoading?: boolean;
  merchantsLoading?: boolean;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  merchants = [],
  accounts = [],
  transactionsLoading = false,
}) => {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [filterAccountId, setFilterAccountId] = useState<string>("");
  const [filterMerchantName, setFilterMerchantName] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentId, setFilterPaymentId] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);

  const clearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFilterAccountId("");
    setFilterMerchantName("");
    setFilterStatus("all");
    setFilterPaymentId("");
    setCurrentPage(1);
  };

  const filteredTransactions = useMemo(() => {
    console.log("[TransactionsTab] Recalculating filteredTransactions. From:", fromDate, "To:", toDate);

    return transactions.filter((tx, index) => { 
      if (index < 5 || (fromDate || toDate)) { 
        console.log(`[TransactionsTab] Filtering tx ID: ${tx.id}, Timestamp:`, tx.timestamp, "(Type:", typeof tx.timestamp, tx.timestamp instanceof Date ? "is Date" : "is NOT Date", ")");
      }

      const txDate = tx.timestamp; 

      if (!(txDate instanceof Date) || isNaN(txDate.getTime())) {
        if (index < 5 || (fromDate || toDate)) {
            console.warn(`[TransactionsTab] Invalid or missing txDate for tx ID: ${tx.id}. Skipping date filter for this tx.`);
        }
      }

      let shouldKeep = true;

      if (fromDate && txDate instanceof Date && !isNaN(txDate.getTime())) {
        const startOfDayFromDate = new Date(fromDate);
        startOfDayFromDate.setHours(0, 0, 0, 0);
        if (txDate < startOfDayFromDate) {
            if (index < 5 || (fromDate || toDate)) console.log(`[TransactionsTab] Tx ${tx.id} REJECTED by fromDate. txDate: ${txDate.toISOString()}, startOfDayFromDate: ${startOfDayFromDate.toISOString()}`);
            shouldKeep = false;
        }
      }
      
      if (shouldKeep && toDate && txDate instanceof Date && !isNaN(txDate.getTime())) {
        const endOfDayToDate = new Date(toDate);
        endOfDayToDate.setHours(23, 59, 59, 999);
        if (txDate > endOfDayToDate) {
            if (index < 5 || (fromDate || toDate)) console.log(`[TransactionsTab] Tx ${tx.id} REJECTED by toDate. txDate: ${txDate.toISOString()}, endOfDayToDate: ${endOfDayToDate.toISOString()}`);
            shouldKeep = false;
        }
      }

      if (!shouldKeep) return false;

      if (filterAccountId.trim() !== "") {
        const account = accounts.find(acc => acc.id === tx.accountId);
        if (!account?.displayId?.toLowerCase().includes(filterAccountId.trim().toLowerCase()) &&
            !tx.accountId.toLowerCase().includes(filterAccountId.trim().toLowerCase())) {
          return false;
        }
      }
      if (filterMerchantName.trim() !== "") {
        const merchant = merchants.find(m => m.id === tx.merchantId);
        if (!merchant?.businessName?.toLowerCase().includes(filterMerchantName.trim().toLowerCase())) {
          return false;
        }
      }
      if (filterStatus !== "all" && tx.status !== filterStatus) {
        return false;
      }
      if (filterPaymentId.trim() !== "" && tx.paymentId && !tx.paymentId.toLowerCase().includes(filterPaymentId.trim().toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [
    transactions, 
    fromDate, 
    toDate, 
    filterAccountId, 
    filterMerchantName, 
    filterStatus, 
    filterPaymentId, 
    accounts, 
    merchants
  ]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const transactionsToDisplay = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const handleViewDetailsClick = (transaction: Transaction) => {
    setSelectedTransactionForDetail(transaction);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => setSelectedTransactionForDetail(null), 300); 
  };
  
  const transactionStatuses: Transaction['status'][] = useMemo(() => ["Pending", "Completed", "Failed", "Declined"], []);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export with current filters.");
      return;
    }
    const csvData = filteredTransactions.map((tx) => {
      const { date: txDisplayDate, time: txDisplayTime } = tx.timestamp instanceof Date ? formatDateTime(tx.timestamp) : { date: 'Invalid Date', time: ''};
      const { date: createdDate, time: createdTime } = tx.createdAt instanceof Date ? formatDateTime(tx.createdAt) : { date: 'Invalid Date', time: ''};
      const { date: updatedDate, time: updatedTime } = tx.updatedAt instanceof Date ? formatDateTime(tx.updatedAt) : { date: 'Invalid Date', time: ''};
      const merchant = merchants.find((m) => m.id === tx.merchantId);
      const account = accounts.find((acc) => acc.id === tx.accountId);
      let signedAmount = parseFloat(tx.amount); 
      if (tx.type === "Debit" || (tx.type === "Adjustment" && signedAmount < 0)) {
        signedAmount = -Math.abs(signedAmount); 
      } else {
        signedAmount = Math.abs(signedAmount);
      }
      return {
        "Payment ID (User Facing)": tx.paymentId || "N/A",
        "Transaction DB ID": tx.id,
        "Date": txDisplayDate,
        "Time": txDisplayTime,
        "Timestamp (ISO)": tx.timestamp instanceof Date ? tx.timestamp.toISOString() : "Invalid Date",
        "Account Display ID": account?.displayId || "N/A",
        "Account Child Name": account?.childName || "N/A",
        "Account DB ID": tx.accountId || "",
        "Merchant Name": merchant?.businessName || (tx.merchantId ? "Unknown/Inactive" : "N/A"),
        "Merchant DB ID": tx.merchantId || "N/A",
        "Type": tx.type,
        "Amount": signedAmount.toFixed(2),
        "Currency": "THB", 
        "Status": tx.status,
        "Decline Reason": tx.declineReason || "",
        "PIN Verified": tx.pinVerified === null ? "N/A" : tx.pinVerified ? "Yes" : "No",
        "Description": tx.description || "",
        "Client Reference": tx.reference || "",
        "Metadata (JSON)": tx.metadata ? JSON.stringify(JSON.parse(tx.metadata)) : "",
        "System Created At (ISO)": tx.createdAt instanceof Date ? tx.createdAt.toISOString() : "Invalid Date",
        "System Updated At (ISO)": tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : "Invalid Date",
      };
    });
    try {
      const csv = unparse(csvData);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV. Please check console for details.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Transaction History</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">
          <div>
            <Label htmlFor="fromDate" className="mb-1 block text-sm font-medium">From Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="fromDate" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!fromDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? formatDateFns(fromDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                    mode="single" 
                    selected={fromDate} 
                    onSelect={setFromDate} 
                    disabled={(date) => 
                        toDate ? date > new Date(new Date(toDate).setHours(23,59,59,999)) : false 
                    }
                    initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="toDate" className="mb-1 block text-sm font-medium">To Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="toDate" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? formatDateFns(toDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                    mode="single" 
                    selected={toDate} 
                    onSelect={setToDate} 
                    disabled={(date) => 
                        fromDate ? date < new Date(new Date(fromDate).setHours(0,0,0,0)) : false
                    } 
                    initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="filterAccountId" className="mb-1 block text-sm font-medium">Account ID:</Label>
            <Input id="filterAccountId" type="text" placeholder="Filter by Account ID" value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} className="w-full"/>
          </div>
          <div>
            <Label htmlFor="filterMerchantName" className="mb-1 block text-sm font-medium">Merchant Name:</Label>
            <Input id="filterMerchantName" type="text" placeholder="Filter by Merchant Name" value={filterMerchantName} onChange={(e) => setFilterMerchantName(e.target.value)} className="w-full"/>
          </div>
          <div>
            <Label htmlFor="filterStatus" className="mb-1 block text-sm font-medium">Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filterStatus" className="w-full"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {transactionStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterPaymentId" className="mb-1 block text-sm font-medium">Payment ID:</Label>
            <Input id="filterPaymentId" type="text" placeholder="Filter by Payment ID" value={filterPaymentId} onChange={(e) => setFilterPaymentId(e.target.value)} className="w-full"/>
          </div>
          <div className="flex space-x-2 items-end pt-2 sm:pt-0 md:col-start-3 lg:col-start-3 lg:col-span-2 justify-end">
            <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
              <XIcon className="mr-2 h-4 w-4" /> Clear
            </Button>
            <Button onClick={handleExportCSV} className="w-full sm:w-auto">
              <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[80px]">Time</TableHead>
              <TableHead className="w-[150px]">Account ID</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className="w-[150px]">Merchant ID</TableHead>
              <TableHead>Merchant Name</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
              <TableHead className="text-center w-[120px]">Status</TableHead>
              <TableHead className="w-[180px]">Payment ID</TableHead>
              <TableHead className="text-center w-[100px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : transactionsToDisplay.length > 0 ? (
              transactionsToDisplay.map((tx) => {
                               // CORRECTED AGAIN: More robust handling of formatDateTime output for table display
                let displayDate = "N/A";
                let displayTime = "";

                if (tx.timestamp instanceof Date && !isNaN(tx.timestamp.getTime())) {
                    const formattedResultAsUnknown: unknown = formatDateTime(tx.timestamp);

                    if (
                        typeof formattedResultAsUnknown === 'object' &&
                        formattedResultAsUnknown !== null &&
                        'date' in formattedResultAsUnknown &&
                        typeof (formattedResultAsUnknown as any).date === 'string' && // Further checks
                        'time' in formattedResultAsUnknown &&
                        typeof (formattedResultAsUnknown as any).time === 'string'
                    ) {
                        displayDate = (formattedResultAsUnknown as { date: string; time: string }).date;
                        displayTime = (formattedResultAsUnknown as { date: string; time: string }).time;
                    } else if (typeof formattedResultAsUnknown === 'string') {
                        // Now TypeScript should correctly infer formattedResultAsUnknown as string here
                        const parts = formattedResultAsUnknown.split(" "); 
                        displayDate = parts[0] || formattedResultAsUnknown;
                        if (parts.length > 1) {
                            displayTime = parts.slice(1).join(" ");
                        }
                    } else {
                        // Handles cases where formatDateTime returns null, undefined, or an unexpected object type
                        console.warn(
                            "[TransactionsTab] formatDateTime returned an unexpected value or type for tx:",
                            tx.id,
                            "Value:", formattedResultAsUnknown
                        );
                    }
                }

                const account = accounts.find(acc => acc.id === tx.accountId);
                const merchant = merchants.find(m => m.id === tx.merchantId);
                const amountValue = parseFloat(tx.amount);

                return (
                  <TableRow key={tx.id}>
                    <TableCell>{displayDate}</TableCell>
                    <TableCell>{displayTime}</TableCell>
                    <TableCell title={account?.id || ""}>{account?.displayId || (tx.accountId ? tuncateUUID(tx.accountId) : "N/A")}</TableCell>
                    <TableCell>{account?.childName || "N/A"}</TableCell>
                    <TableCell title={merchant?.id || ""}>{tx.merchantId ? tuncateUUID(tx.merchantId) : "N/A"}</TableCell>
                    <TableCell>{merchant?.businessName || (tx.merchantId ? "Unknown" : "N/A")}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Math.abs(amountValue))}</TableCell>
                    <TableCell className="text-center">{renderStatusBadge(tx.status, "transaction")}</TableCell>
                    <TableCell className="font-mono text-xs" title={tx.paymentId || undefined}>{tuncateUUID(tx.paymentId)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetailsClick(tx)}>Details</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500 py-10">No transactions found matching your criteria.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && !transactionsLoading && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-700">
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeftIcon className="h-4 w-4 mr-1" />Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next<ChevronRightIcon className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {selectedTransactionForDetail && (
        <TransactionDetailModal 
            isOpen={isDetailModalOpen} 
            onClose={handleCloseDetailModal} 
            transaction={selectedTransactionForDetail}
        />
      )}
    </div>
  );
};

export default TransactionsTab;