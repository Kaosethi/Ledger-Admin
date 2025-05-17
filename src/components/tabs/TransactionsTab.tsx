// src/components/tabs/TransactionsTab.tsx
"use client";
import React, { useState, useMemo } from "react";
import type { Transaction, Merchant, Account } from "@/lib/mockData"; // EXPECTING RICH TYPE

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
  DownloadIcon,
  ChevronLeftIcon, 
  ChevronRightIcon,
  XIcon,
  CalendarIcon,
} from "lucide-react";
import { format as formatDateFns } from "date-fns";

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
    return transactions.filter((tx) => {
      const txDate = tx.timestamp;

      if (fromDate) {
        const startOfDayFromDate = new Date(fromDate);
        startOfDayFromDate.setHours(0, 0, 0, 0);
        if (txDate < startOfDayFromDate) return false;
      }
      if (toDate) {
        const endOfDayToDate = new Date(toDate);
        endOfDayToDate.setHours(23, 59, 59, 999);
        if (txDate > endOfDayToDate) return false;
      }
      if (filterAccountId.trim() !== "") {
        const account = accounts.find(acc => acc.id === tx.accountId);
        if (!account?.displayId.toLowerCase().includes(filterAccountId.trim().toLowerCase()) &&
            !tx.accountId.toLowerCase().includes(filterAccountId.trim().toLowerCase())) {
          return false;
        }
      }
      if (filterMerchantName.trim() !== "") {
        const merchant = merchants.find(m => m.id === tx.merchantId);
        if (!merchant?.businessName.toLowerCase().includes(filterMerchantName.trim().toLowerCase())) {
          return false;
        }
      }
      if (filterStatus !== "all" && tx.status !== filterStatus) {
        return false;
      }
      if (filterPaymentId.trim() !== "" && !tx.paymentId.toLowerCase().includes(filterPaymentId.trim().toLowerCase())) {
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
  
  const transactionStatuses: Transaction['status'][] = ["Pending", "Completed", "Failed", "Declined"];

  return (
    <div className="space-y-6">
      {/* TASK 1: Added Transaction History Title */}
      <h1 className="text-2xl font-semibold text-gray-800">Transaction History</h1>

      {/* Filter Section */}
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
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent>
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
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} disabled={(date) => fromDate ? date < fromDate : false} initialFocus /></PopoverContent>
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
          <div className="flex space-x-2 items-end pt-2 sm:pt-0 md:col-start-3 lg:col-start-4 lg:col-span-1 justify-end">
            <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
              <XIcon className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
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
                const { date, time } = formatDateTime(tx.timestamp);
                const account = accounts.find(acc => acc.id === tx.accountId);
                const merchant = merchants.find(m => m.id === tx.merchantId);
                const amountValue = parseFloat(tx.amount);

                return (
                  <TableRow key={tx.id}>
                    <TableCell>{date}</TableCell>
                    <TableCell>{time}</TableCell>
                    <TableCell title={account?.id || ""}>{account?.displayId || (tx.accountId ? tuncateUUID(tx.accountId) : "N/A")}</TableCell>
                    <TableCell>{account?.childName || "N/A"}</TableCell>
                    <TableCell title={merchant?.id || ""}>{tx.merchantId ? tuncateUUID(tx.merchantId) : "N/A"}</TableCell>
                    <TableCell>{merchant?.businessName || (tx.merchantId ? "Unknown" : "N/A")}</TableCell>
                    {/* TASK 2: Amount column updated */}
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Math.abs(amountValue))}
                    </TableCell>
                    <TableCell className="text-center">{renderStatusBadge(tx.status, "transaction")}</TableCell>
                    <TableCell className="font-mono text-xs" title={tx.paymentId}>{tuncateUUID(tx.paymentId)}</TableCell>
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
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      )}

      {selectedTransactionForDetail && (
        <TransactionDetailModal isOpen={isDetailModalOpen} onClose={handleCloseDetailModal} transaction={selectedTransactionForDetail} />
      )}
    </div>
  );
};

export default TransactionsTab;