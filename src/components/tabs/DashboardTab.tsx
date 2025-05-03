// src/app/components/tabs/DashboardTab.tsx
// FIXED: Corrected status comparisons for Merchants and Transactions to match type definitions.
"use client";

import React, { useState, useMemo } from "react";
import type { Account, Merchant, Transaction } from "@/lib/mockData"; // Ensure path is correct
import { formatCurrency, cn } from "@/lib/utils"; // Ensure path is correct
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Added Card imports
import { Label } from "@/components/ui/label"; // Using shadcn Label
import { Button } from "@/components/ui/button"; // Added Button import
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Added Popover imports
import { Calendar } from "@/components/ui/calendar"; // Added Calendar import
import {
  Users,
  Building,
  Clock,
  Activity,
  DollarSign,
  Hash,
  CalendarIcon, // Added CalendarIcon
} from "lucide-react"; // Added icons
import { format } from "date-fns"; // Added date-fns format
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector,
  Label as RechartsLabel,
} from "recharts";

interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
}

// Define colors for Pie chart segments (using actual status values)
const PIE_COLORS = {
  Active: "#10B981", // green-500
  Suspended: "#EF4444", // red-500
  Inactive: "#9CA3AF", // gray-400 // Updated color for Inactive
  // Removed Pending as it's not an Account status here
  Default: "#6B7280", // gray-500
};
// Use the actual Account status type for keys
type AccountStatusKey = Account["status"] | "Default"; // Or handle 'Unknown' if needed

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
}) => {
  // Changed state to handle Date objects
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filteredTransactions = useMemo(() => {
    // Adjusted filtering logic for Date objects
    return transactions.filter((tx) => {
      try {
        const txDate = new Date(tx.timestamp);
        // Set time to 00:00:00 for date-only comparison
        txDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          // Include the end date itself
          if (txDate > end) return false;
        }
        return true;
      } catch (e) {
        console.error("Error parsing transaction date:", tx.timestamp, e);
        return false; // Exclude transactions with invalid dates
      }
    });
  }, [transactions, startDate, endDate]);

  // --- Memoized Stat Card Calculations ---
  const totalAccounts = accounts.length;
  // MODIFIED: Use 'Active' (capitalized) from MerchantStatus type
  const activeMerchants = useMemo(
    () => merchants.filter((m) => m.status === "Active").length,
    [merchants]
  );
  // MODIFIED: Use 'Pending' (capitalized) from MerchantStatus type
  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "Pending").length,
    [merchants]
  );

  // MODIFIED: Use 'Completed' from Transaction['status'] type
  const completedTransactions = useMemo(
    () => filteredTransactions.filter((tx) => tx.status === "Completed"),
    [filteredTransactions]
  );

  const totalTxCount = filteredTransactions.length;
  // MODIFIED: Use completedTransactions for value calculation
  const totalTxValue = useMemo(
    () => completedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
    [completedTransactions]
  );
  // MODIFIED: Use completedTransactions for average calculation
  const avgTxValue = useMemo(
    () =>
      completedTransactions.length > 0
        ? totalTxValue / completedTransactions.length
        : 0,
    [completedTransactions, totalTxValue]
  );

  // --- Memoized Chart Data ---
  const transactionsPerDay = useMemo(() => {
    const dailyCounts: { [date: string]: number } = {};
    filteredTransactions.forEach((tx) => {
      try {
        // Format date consistently (YYYY-MM-DD) for grouping
        const date = format(new Date(tx.timestamp), "yyyy-MM-dd");
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      } catch (e) {
        console.error(
          "Error processing transaction date for chart:",
          tx.timestamp,
          e
        );
      }
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // Pie Chart: Account Status Distribution
  const accountStatusData = useMemo(() => {
    // Counts based on the actual Account['status'] type
    const statusCounts: Record<Account["status"], number> = {
      Active: 0,
      Inactive: 0,
      Suspended: 0,
    };
    accounts.forEach((acc) => {
      // Ensure status is one of the defined keys
      if (
        acc.status === "Active" ||
        acc.status === "Inactive" ||
        acc.status === "Suspended"
      ) {
        statusCounts[acc.status]++;
      }
    });

    // Convert to array format suitable for Recharts, filtering out zero counts
    return (Object.entries(statusCounts) as [Account["status"], number][])
      .filter(([name, value]) => value > 0) // Only show statuses with accounts
      .map(([name, value]) => ({
        name, // 'Active', 'Inactive', 'Suspended'
        value,
        fill: PIE_COLORS[name as AccountStatusKey] || PIE_COLORS.Default,
      }));
  }, [accounts]);

  // --- Component Render ---
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {" "}
      {/* Updated main container padding/gap */}
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {/* Updated heading styles */}
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of system activity and performance.
          </p>
        </div>
        {/* Date Filters - Replaced with DatePicker */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end md:gap-4 shrink-0">
          {/* Start Date Picker */}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date Range From:
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal text-sm", // Adjusted width
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick a start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border bg-white z-50">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={
                    (date) =>
                      (endDate && date > endDate) || date > new Date() || false // Ensure boolean return
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* End Date Picker */}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              To:
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal text-sm", // Adjusted width
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "PPP")
                  ) : (
                    <span>Pick an end date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border bg-white z-50">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date > new Date() || !!(startDate && date < startDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      {/* Stats Grid - Refactored with Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Card 1: Beneficiaries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div id="db-total-accounts" className="text-2xl font-bold">
              {totalAccounts}
            </div>
            <p className="text-xs text-muted-foreground">
              Total registered accounts
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Active Merchants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Merchants
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div id="db-active-merchants" className="text-2xl font-bold">
              {activeMerchants}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to process transactions
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Pending Merchants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Merchants
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div id="db-pending-merchants" className="text-2xl font-bold">
              {pendingMerchants}
            </div>
            <p className="text-xs text-muted-foreground">
              Applications awaiting approval
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div id="db-total-transactions" className="text-2xl font-bold">
              {totalTxCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Total (All Statuses)
            </p>
            <p className="text-xs text-muted-foreground">
              {startDate || endDate ? "(Selected Range)" : "(All Time)"}
            </p>
          </CardContent>
        </Card>

        {/* Card 5: Total Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div id="db-total-tx-value" className="text-2xl font-bold">
              {formatCurrency(totalTxValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sum of completed transactions
            </p>
            <p className="text-xs text-muted-foreground">
              {startDate || endDate ? "(Selected Range)" : "(All Time)"}
            </p>
          </CardContent>
        </Card>

        {/* Card 6: Average Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />{" "}
            {/* Used Hash for Average */}
          </CardHeader>
          <CardContent>
            <div id="db-avg-tx-value" className="text-2xl font-bold">
              {formatCurrency(avgTxValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average completed transaction
            </p>
            <p className="text-xs text-muted-foreground">
              {startDate || endDate ? "(Selected Range)" : "(All Time)"}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Charts Section - Refactored with Card */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* Line Chart Card */}
        <Card className="lg:col-span-2">
          {" "}
          {/* Use Card for container */}
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Transactions Per Day
            </CardTitle>
            {/* Optional: Add CardDescription if needed */}
          </CardHeader>
          <CardContent className="pl-2 pr-4 pb-4">
            {" "}
            {/* Adjust padding for chart */}
            {transactionsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {/* LineChart Definition (styles inside chart might need further tweaking) */}
                <LineChart
                  data={transactionsPerDay}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(tick) => {
                      try {
                        return new Date(tick + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        );
                      } catch {
                        return tick;
                      }
                    }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#111827" }}
                    labelFormatter={(label) => {
                      try {
                        return new Date(label + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        );
                      } catch {
                        return label;
                      }
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Transactions"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ r: 3, fill: "#4f46e5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                {" "}
                {/* Adjusted height and class */}
                No transaction data available for the selected date range.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart Card */}
        <Card className="flex flex-col">
          {" "}
          {/* Use Card for container */}
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Account Status
            </CardTitle>
            {/* Optional: Add CardDescription if needed */}
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center pb-4">
            {" "}
            {/* Adjust padding and ensure centering */}
            {accountStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {/* PieChart Definition (styles inside chart might need further tweaking) */}
                <PieChart>
                  <Pie
                    data={accountStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {accountStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <RechartsLabel
                      value={`Total: ${totalAccounts}`}
                      position="center"
                      fill="#374151"
                      fontSize={16}
                      fontWeight="bold"
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const numValue =
                        typeof value === "number" ? value : Number(value);
                      return [
                        `${numValue} (${(
                          (numValue / totalAccounts) *
                          100
                        ).toFixed(0)}%)`,
                        name,
                      ];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "12px", lineHeight: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                {" "}
                {/* Adjusted height and class */}
                No account data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
