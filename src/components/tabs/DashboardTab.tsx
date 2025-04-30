// src/app/components/tabs/DashboardTab.tsx
// FIXED: Corrected status comparisons for Merchants and Transactions to match type definitions.
'use client';

import React, { useState, useMemo } from "react";
import type { Account, Merchant, Transaction } from "@/lib/mockData"; // Ensure path is correct
import { formatCurrency } from "@/lib/utils"; // Ensure path is correct
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
  Label
} from 'recharts';

interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
}

// Define colors for Pie chart segments (using actual status values)
const PIE_COLORS = {
    Active: '#10B981', // green-500
    Suspended: '#EF4444', // red-500
    Inactive: '#9CA3AF', // gray-400 // Updated color for Inactive
    // Removed Pending as it's not an Account status here
    Default: '#6B7280', // gray-500
};
// Use the actual Account status type for keys
type AccountStatusKey = Account['status'] | 'Default'; // Or handle 'Unknown' if needed

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) {
      return transactions;
    }
    return transactions.filter(tx => {
      const txDate = tx.timestamp.substring(0, 10);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  // --- Memoized Stat Card Calculations ---
  const totalAccounts = accounts.length;
  // MODIFIED: Use 'Active' (capitalized) from MerchantStatus type
  const activeMerchants = useMemo(() =>
    merchants.filter((m) => m.status === "Active").length,
    [merchants]
  );
  // MODIFIED: Use 'Pending' (capitalized) from MerchantStatus type
  const pendingMerchants = useMemo(() =>
    merchants.filter((m) => m.status === "Pending").length,
    [merchants]
  );

  // MODIFIED: Use 'Completed' from Transaction['status'] type
  const completedTransactions = useMemo(() =>
    filteredTransactions.filter((tx) => tx.status === "Completed"),
    [filteredTransactions]
  );

  const totalTxCount = filteredTransactions.length;
  // MODIFIED: Use completedTransactions for value calculation
  const totalTxValue = useMemo(() =>
    completedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
    [completedTransactions]
  );
  // MODIFIED: Use completedTransactions for average calculation
  const avgTxValue = useMemo(() =>
    completedTransactions.length > 0
      ? totalTxValue / completedTransactions.length
      : 0,
    [completedTransactions, totalTxValue]
  );

  // --- Memoized Chart Data ---

  // Line Chart: Transactions per Day
  const transactionsPerDay = useMemo(() => {
    const dailyCounts: { [date: string]: number } = {};
    filteredTransactions.forEach(tx => {
      const date = tx.timestamp.substring(0, 10);
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // Pie Chart: Account Status Distribution
  const accountStatusData = useMemo(() => {
    // Counts based on the actual Account['status'] type
    const statusCounts: Record<Account['status'], number> = {
        Active: 0,
        Inactive: 0,
        Suspended: 0,
    };
    accounts.forEach(acc => {
        // Ensure status is one of the defined keys
        if (acc.status === 'Active' || acc.status === 'Inactive' || acc.status === 'Suspended') {
            statusCounts[acc.status]++;
        }
    });

    // Convert to array format suitable for Recharts, filtering out zero counts
    return (Object.entries(statusCounts) as [Account['status'], number][])
        .filter(([name, value]) => value > 0) // Only show statuses with accounts
        .map(([name, value]) => ({
            name, // 'Active', 'Inactive', 'Suspended'
            value,
            fill: PIE_COLORS[name as AccountStatusKey] || PIE_COLORS.Default,
        }));
  }, [accounts]);

  // --- Event Handlers ---
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // --- Component Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="mt-1 text-base text-gray-500">Overview of system activity and performance.</p>
        </div>
        {/* Date Filters */}
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div>
            <label htmlFor="db-start-date-filter" className="block text-xs font-medium text-gray-600 mb-1">Date Range From:</label>
            <input type="date" id="db-start-date-filter" value={startDate} onChange={handleStartDateChange} className="px-3 py-1.5 block w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label htmlFor="db-end-date-filter" className="block text-xs font-medium text-gray-600 mb-1">To:</label>
            <input type="date" id="db-end-date-filter" value={endDate} onChange={handleEndDateChange} min={startDate || undefined} className="px-3 py-1.5 block w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Card 1: Beneficiaries */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Beneficiaries</span><span className="p-2 bg-blue-100 rounded-full text-blue-600">{/* Icon */}</span></div>
          <div id="db-total-accounts" className="text-4xl font-bold text-gray-900">{totalAccounts}</div>
          <p className="mt-1 text-xs text-gray-500">Total registered accounts</p>
        </div>
         {/* Card 2: Active Merchants */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Merchants</span><span className="p-2 bg-green-100 rounded-full text-green-600">{/* Icon */}</span></div>
          <div id="db-active-merchants" className="text-4xl font-bold text-gray-900">{activeMerchants}</div>
          <p className="mt-1 text-xs text-gray-500">Ready to process transactions</p>
        </div>
         {/* Card 3: Pending Merchants */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
           <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Merchants</span><span className="p-2 bg-yellow-100 rounded-full text-yellow-600">{/* Icon */}</span></div>
          <div id="db-pending-merchants" className="text-4xl font-bold text-gray-900">{pendingMerchants}</div>
          <p className="mt-1 text-xs text-gray-500">Applications awaiting approval</p>
        </div>
         {/* Card 4: Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Transactions</span><span className="p-2 bg-indigo-100 rounded-full text-indigo-600">{/* Icon */}</span></div>
          <div id="db-total-transactions" className="text-4xl font-bold text-gray-900">{totalTxCount}</div>
          <p className="mt-1 text-xs text-gray-500">Total (All Statuses)</p>
          <p className="mt-1 text-xs text-primary">{(startDate || endDate) ? '(Selected Date Range)' : '(All Time)'}</p>
        </div>
         {/* Card 5: Total Value */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
           <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Value</span><span className="p-2 bg-purple-100 rounded-full text-purple-600">{/* Icon */}</span></div>
          <div id="db-total-tx-value" className="text-4xl font-bold text-gray-900">{formatCurrency(totalTxValue)}</div>
           {/* MODIFIED: Clarify value is for Completed transactions */}
          <p className="mt-1 text-xs text-gray-500">Sum of completed transactions</p>
           <p className="mt-1 text-xs text-primary">{(startDate || endDate) ? '(Selected Date Range)' : '(All Time)'}</p>
        </div>
         {/* Card 6: Average Value */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
           <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Average Value</span><span className="p-2 bg-pink-100 rounded-full text-pink-600">{/* Icon */}</span></div>
          <div id="db-avg-tx-value" className="text-4xl font-bold text-gray-900">{formatCurrency(avgTxValue)}</div>
           {/* MODIFIED: Clarify value is for Completed transactions */}
          <p className="mt-1 text-xs text-gray-500">Average completed transaction</p>
           <p className="mt-1 text-xs text-primary">{(startDate || endDate) ? '(Selected Date Range)' : '(All Time)'}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transactions Per Day</h3>
          {transactionsPerDay.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                {/* LineChart Definition */}
                <LineChart data={transactionsPerDay} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(tick) => { try { return new Date(tick + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return tick; }}} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '12px' }} itemStyle={{ color: '#111827' }} labelFormatter={(label) => { try { return new Date(label + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return label; }}} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  <Line type="monotone" dataKey="count" name="Transactions" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 3, fill: '#4f46e5' }} />
                </LineChart>
              </ResponsiveContainer>
          ) : (
             <div className="aspect-[16/6] flex items-center justify-center text-sm text-gray-500">No transaction data available for the selected date range.</div>
          )}
        </div>

        {/* Pie Chart Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>
          {accountStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                 {/* PieChart Definition */}
                <PieChart>
                    <Pie data={accountStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={50} fill="#8884d8" dataKey="value" paddingAngle={2}>
                        {accountStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <Label value={`Total: ${totalAccounts}`} position="center" fill="#374151" fontSize={16} fontWeight="bold"/>
                    </Pie>
                    <Tooltip formatter={(value, name) => { const numValue = typeof value === 'number' ? value : Number(value); return [`${numValue} (${((numValue / totalAccounts) * 100).toFixed(0)}%)`, name]; }} />
                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', lineHeight: '20px' }} />
                </PieChart>
            </ResponsiveContainer>
            ) : (
             <div className="flex-grow flex items-center justify-center text-sm text-gray-500">No account data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;