"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import hrMockDataInstance, { Employee, SendHomeRequest, WithdrawRequest } from "@/lib/hrPortalMockData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HRPortalPage() {
  // Use mock data directly in this proof of concept
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sendHomeRequests, setSendHomeRequests] = useState<SendHomeRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const loadData = () => {
      setTimeout(() => {
        setEmployees(hrMockDataInstance.employees);
        setSendHomeRequests(hrMockDataInstance.sendHomeRequests);
        setWithdrawRequests(hrMockDataInstance.withdrawRequests);
        setIsLoading(false);
      }, 800); // Simulate network delay
    };
    
    loadData();
  }, []);

  // Count active employees
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const totalPayroll = hrMockDataInstance.totalPayrollProcessed;
  const totalWithdrawn = hrMockDataInstance.totalWithdrawn;

  return (
    <div>
      {/* Top navigation bar */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="ml-4">
                <h1 className="text-xl font-bold">HR Admin Portal</h1>
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link href="/hr-portal">
                <Button variant="default" className="text-sm">Dashboard</Button>
              </Link>
              <Link href="/hr-portal/payroll">
                <Button variant="ghost" className="text-sm">Payroll</Button>
              </Link>
              <Link href="/hr-portal/send-home-requests">
                <Button variant="ghost" className="text-sm">Send Home Requests</Button>
              </Link>
              <Link href="/hr-portal/withdraw-requests">
                <Button variant="ghost" className="text-sm">Withdraw Requests</Button>
              </Link>
              <Link href="/hr-portal/user-accounts">
                <Button variant="ghost" className="text-sm">User Accounts</Button>
              </Link>
              <Link href="/hr-portal/admin-log">
                <Button variant="ghost" className="text-sm">Admin Log</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* User Profile Section */}
        <div className="bg-white shadow mb-8 p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold">John Doe</h2>
                <p className="text-sm text-gray-500">HR Manager</p>
                <p className="text-sm">Welcome back to the HR Portal!</p>
              </div>
            </div>
            <Button variant="outline" className="text-sm">Logout</Button>
          </div>
        </div>

        {/* Employee Stats Section */}
        <div className="bg-white shadow mb-8 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Employee Stats</h2>
              <p className="text-sm text-gray-500 mt-1">Overview of employee-related metrics</p>
            </div>
            <Button variant="outline" size="sm">View Details</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Total Employees */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              {isLoading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{employees.length}</p>
              )}
            </div>

            {/* Pending Send Home Requests */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Pending Send Home Requests</p>
              {isLoading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{sendHomeRequests.length}</p>
              )}
            </div>

            {/* Pending Withdraw Requests */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Pending Withdraw Requests</p>
              {isLoading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{withdrawRequests.length}</p>
              )}
            </div>

            {/* Total Payroll Processed */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Total Payroll Processed</p>
              {isLoading ? (
                <Skeleton className="h-10 w-36 mt-1" />
              ) : (
                <p className="text-2xl font-bold">MMK {totalPayroll.toLocaleString()}</p>
              )}
            </div>

            {/* Active Employee Accounts */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Active Employee Accounts</p>
              {isLoading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{activeEmployees}</p>
              )}
            </div>

            {/* Total Withdrawn */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Total Withdrawn</p>
              {isLoading ? (
                <Skeleton className="h-10 w-36 mt-1" />
              ) : (
                <p className="text-2xl font-bold">MMK {totalWithdrawn.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="bg-white shadow mb-8 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Recent Activities</h2>
          <p className="text-sm text-gray-500 mb-6">Overview of the latest requests and transactions</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Send Home Request */}
            <div className="flex flex-col items-center border rounded-lg p-6">
              <span className="text-4xl mb-4">✏️</span>
              <h3 className="text-lg font-semibold mb-1">Send Home Request</h3>
              <p className="text-xs text-gray-500 mb-4">Recent Requests</p>
              <p className="text-xl font-bold mb-1">{sendHomeRequests.length} pending</p>
            </div>

            {/* Withdraw Request */}
            <div className="flex flex-col items-center border rounded-lg p-6">
              <span className="text-4xl mb-4">💵</span>
              <h3 className="text-lg font-semibold mb-1">Withdraw Request</h3>
              <p className="text-xs text-gray-500 mb-4">Pending Withdrawals</p>
              <p className="text-xl font-bold mb-1">{withdrawRequests.length} pending</p>
            </div>

            {/* Employees Managed */}
            <div className="flex flex-col items-center border rounded-lg p-6">
              <span className="text-4xl mb-4">👥</span>
              <h3 className="text-lg font-semibold mb-1">Employees Managed</h3>
              <p className="text-xs text-gray-500 mb-4">Team Size</p>
              <p className="text-xl font-bold mb-1">{activeEmployees} active</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 mb-6 pt-4 border-t text-center text-sm text-gray-500">
          <div className="flex justify-between">
            <p>© 2023 HR Admin Portal. All rights reserved.</p>
            <p>Contact us: support@hradminportal.com</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
