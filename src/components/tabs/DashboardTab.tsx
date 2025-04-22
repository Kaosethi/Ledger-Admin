// src/app/components/tabs/DashboardTab.tsx
'use client'; // ADDED: Mark as Client Component for recharts and state

import React, { useState, useMemo } from "react"; // ADDED: useState, useMemo
import type { Account, Merchant, Transaction } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
// ADDED: Import Recharts components
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
  Sector, // For potential active shape rendering later
  Label
} from 'recharts';

interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
}

// Define colors for Pie chart segments
const PIE_COLORS = {
    Active: '#10B981', // green-500
    Suspended: '#EF4444', // red-500
    Inactive: '#F87171', // red-400 (slightly different)
    Pending: '#F59E0B', // amber-500
    Default: '#6B7280', // gray-500
};
type AccountStatusKey = keyof typeof PIE_COLORS;

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
}) => {
  // --- State for Date Filters ---
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD

  // --- Memoized Filtered Transactions ---
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) {
      return transactions; // Return all if no date range selected
    }
    return transactions.filter(tx => {
      const txDate = tx.timestamp.substring(0, 10); // Extract YYYY-MM-DD
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  // --- Memoized Stat Card Calculations (using filtered data) ---
  const totalAccounts = accounts.length; // Total accounts doesn't depend on date range
  const activeMerchants = merchants.filter((m) => m.status === "active").length; // Merchants status not date dependent
  const pendingMerchants = merchants.filter(
    (m) => m.status === "pending_approval"
  ).length; // Merchants status not date dependent

  const approvedTransactions = useMemo(() =>
    filteredTransactions.filter((tx) => tx.status === "Approved"),
    [filteredTransactions]
  ); // Based on filtered

  const totalTxCount = filteredTransactions.length; // Based on filtered
  const totalTxValue = useMemo(() =>
    approvedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
    [approvedTransactions]
  ); // Based on filtered & approved
  const avgTxValue = useMemo(() =>
    approvedTransactions.length > 0
      ? totalTxValue / approvedTransactions.length
      : 0,
    [approvedTransactions, totalTxValue]
  ); // Based on filtered & approved

  // --- Memoized Chart Data ---

  // Line Chart: Transactions per Day
  const transactionsPerDay = useMemo(() => {
    const dailyCounts: { [date: string]: number } = {};
    filteredTransactions.forEach(tx => {
      const date = tx.timestamp.substring(0, 10); // YYYY-MM-DD
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Convert to array and sort by date for the chart
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

  }, [filteredTransactions]);


  // Pie Chart: Account Status Distribution
  const accountStatusData = useMemo(() => {
    const statusCounts: { [status: string]: number } = {};
    accounts.forEach(acc => {
        const statusKey = acc.status || 'Unknown';
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        // Add a color property based on the status name
        fill: PIE_COLORS[name as AccountStatusKey] || PIE_COLORS.Default,
    }));
  }, [accounts]);


  // --- Event Handlers for Date Inputs ---
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // --- Component Render ---
  return (
    <div className="bg-gray-100 p-6 lg:p-8 rounded-lg space-y-8"> {/* Added space-y */}
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="mt-1 text-base text-gray-500">
            Overview of system activity and performance.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div>
            <label htmlFor="db-start-date-filter" className="block text-xs font-medium text-gray-600 mb-1"> Date Range From: </label>
            {/* ADDED: value and onChange */}
            <input type="date" id="db-start-date-filter" value={startDate} onChange={handleStartDateChange} className="px-3 py-1.5 block w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="db-end-date-filter" className="block text-xs font-medium text-gray-600 mb-1"> To: </label>
             {/* ADDED: value, onChange, min */}
            <input type="date" id="db-end-date-filter" value={endDate} onChange={handleEndDateChange} min={startDate} className="px-3 py-1.5 block w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Stats Grid (Unchanged structure, values now use filtered data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg"> {/* Card 1: Beneficiaries */}
          <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Beneficiaries</span><span className="p-2 bg-blue-100 rounded-full text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg></span></div>
          <div id="db-total-accounts" className="text-4xl font-bold text-gray-900">{totalAccounts}</div>
          <p className="mt-1 text-xs text-gray-500">Total registered accounts</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg"> {/* Card 2: Active Merchants */}
          <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Merchants</span><span className="p-2 bg-green-100 rounded-full text-green-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 7v1.132a1 1 0 00.91.996l.884.066A5.002 5.002 0 0110 12a5 5 0 015.207-4.806l.884-.066A1 1 0 0017 8.132V7a1 1 0 00-.496-.868l-7-4z" clipRule="evenodd" /><path d="M4 13a1 1 0 00-1 1v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-1-1H4z" /></svg></span></div>
          <div id="db-active-merchants" className="text-4xl font-bold text-gray-900">{activeMerchants}</div>
          <p className="mt-1 text-xs text-gray-500">Ready to process transactions</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg"> {/* Card 3: Pending Merchants */}
           <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Merchants</span><span className="p-2 bg-yellow-100 rounded-full text-yellow-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg></span></div>
          <div id="db-pending-merchants" className="text-4xl font-bold text-gray-900">{pendingMerchants}</div>
          <p className="mt-1 text-xs text-gray-500">Applications awaiting approval</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg"> {/* Card 4: Transactions */}
          <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Transactions</span><span className="p-2 bg-indigo-100 rounded-full text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span></div>
          <div id="db-total-transactions" className="text-4xl font-bold text-gray-900">{totalTxCount}</div>
          <p className="mt-1 text-xs text-gray-500">Total (Approved & Declined)</p>
          <p className="mt-1 text-xs text-primary">{(startDate || endDate) ? '(Selected Date Range)' : '(All Time)'}</p> {/* MODIFIED: Indicate date range */}
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg"> {/* Card 5: Total Value */}
           <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Value</span><span className="p-2 bg-purple-100 rounded-full text-purple-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></div>
          <div id="db-total-tx-value" className="text-4xl font-bold text-gray-900">{formatCurrency(totalTxValue)}</div>
          <p className="mt-1 text-xs text-gray-500">Sum of approved transactions</p>
           <p className="mt-1 text-xs text-primary">{(startDate || endDate) ? '(Selected Date Range)' : '(All Time)'}</p> {/* MODIFIED: Indicate date range */}
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg"> {/* Card 6: Average Value */}
           <div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Average Value</span><span className="p-2 bg-pink-100 rounded-full text-pink-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-.567-.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.002-4.217a1.5 1.5 0 01-.839-2.804 1.5 1.5 0 01.839-2.804.25.25 0 00.161-.452 6.5 6.5 0 100 6.514.25.25 0 00-.161-.452z" clipRule="evenodd" /></svg></span></div>
          <div id="db-avg-tx-value" className="text-4xl font-bold text-gray-900">{formatCurrency(avgTxValue)}</div>
          <p className="mt-1 text-xs text-gray-500">Average approved transaction</p>
           <p className="mt-1 text-xs text-primary">{(startDate || endDate) ? '(Selected Date Range)' : '(All Time)'}</p> {/* MODIFIED: Indicate date range */}
        </div>
      </div>

      {/* MODIFIED: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Transactions Per Day
          </h3>
          {transactionsPerDay.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={transactionsPerDay}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }} // Adjusted margins
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /> {/* Lighter grid */}
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280" // Gray axis line
                    tick={{ fontSize: 12, fill: '#6b7280' }} // Gray ticks
                    tickFormatter={(tick) => { // Format date for display
                        try { return new Date(tick + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
                        catch { return tick; }
                    }}
                  />
                  <YAxis
                     stroke="#6b7280"
                     tick={{ fontSize: 12, fill: '#6b7280' }}
                     allowDecimals={false} // Ensure whole numbers for count
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '12px' }}
                    itemStyle={{ color: '#111827' }}
                    labelFormatter={(label) => { // Format date in tooltip label
                         try { return new Date(label + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
                         catch { return label; }
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Transactions" // Name for Legend/Tooltip
                    stroke="#4f46e5" // primary color
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ r: 3, fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
          ) : (
             <div className="aspect-[16/6] flex items-center justify-center text-sm text-gray-500">
                No transaction data available for the selected date range.
             </div>
          )}
        </div>

        {/* Pie Chart Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Account Status
          </h3>
          {accountStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                    data={accountStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // label={renderCustomizedLabel} // Add custom label later if needed
                    outerRadius={100} // Adjust size as needed
                    innerRadius={50} // Make it a Donut chart
                    fill="#8884d8" // Default fill, overridden by Cell
                    dataKey="value"
                    paddingAngle={2} // Add spacing between segments
                >
                    {accountStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    {/* Center Label */}
                    <Label
                        value={`Total: ${totalAccounts}`}
                        position="center"
                        fill="#374151" // gray-700
                        fontSize={16}
                        fontWeight="bold"
                    />
                </Pie>
                <Tooltip formatter={(value, name) => {
                  const numValue = typeof value === 'number' ? value : Number(value);
                  return [`${numValue} (${((numValue / totalAccounts) * 100).toFixed(0)}%)`, name];
                }} />
                <Legend
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: '12px', lineHeight: '20px' }}
                />
                </PieChart>
            </ResponsiveContainer>
            ) : (
             <div className="flex-grow flex items-center justify-center text-sm text-gray-500">
                No account data available.
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardTab;