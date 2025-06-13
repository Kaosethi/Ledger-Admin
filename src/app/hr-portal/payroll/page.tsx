"use client";

import { useEffect, useState } from "react";
import hrMockDataInstance, { PayrollRecord, SalaryAdvance } from "@/lib/hrPortalMockData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function PayrollPage() {
  // States for data and loading
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("current");
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate loading data
  useEffect(() => {
    const loadData = () => {
      setTimeout(() => {
        setPayrollRecords(hrMockDataInstance.payrollRecords);
        setSalaryAdvances(hrMockDataInstance.salaryAdvances);
        setIsLoading(false);
      }, 800); // Simulate network delay
    };
    
    loadData();
  }, []);

  // Filter payroll records based on search term
  const filteredPayrollRecords = payrollRecords.filter(record => {
    return record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get totals
  const totalProcessed = payrollRecords
    .filter(record => record.status === "Paid")
    .reduce((sum, record) => sum + record.totalPaid, 0);
  
  const totalPending = payrollRecords
    .filter(record => record.status === "Processing")
    .reduce((sum, record) => sum + record.totalPaid, 0);

  const pendingAdvances = salaryAdvances.filter(advance => advance.status === "Pending");

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Format period for display
  const formatPeriod = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div>
      {/* Top navigation bar */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div>
                <h1 className="text-xl font-bold">HR Admin Portal</h1>
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link href="/hr-portal">
                <Button variant="ghost" className="text-sm">Dashboard</Button>
              </Link>
              <Link href="/hr-portal/payroll">
                <Button variant="default" className="text-sm">Payroll</Button>
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
        {/* User Profile Section - Minimized for payroll page */}
        <div className="bg-white shadow mb-8 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base font-semibold">John Doe</h2>
                <p className="text-sm text-gray-500">HR Manager</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Logout</Button>
          </div>
        </div>

        {/* Payroll Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Payroll Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage employee salaries and payment records</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Process Payroll</Button>
        </div>

        {/* Payroll Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Total Processed (May)</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">MMK {totalProcessed.toLocaleString()}</p>
            )}
          </Card>
          
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Pending Payments (June)</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">MMK {totalPending.toLocaleString()}</p>
            )}
          </Card>
          
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Total Employees</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{hrMockDataInstance.employees.length}</p>
            )}
          </Card>
          
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Pending Salary Advances</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{pendingAdvances.length}</p>
            )}
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm whitespace-nowrap">Payroll Period:</p>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">June 2025 (Current)</SelectItem>
                <SelectItem value="previous">May 2025</SelectItem>
                <SelectItem value="archive">April 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Payroll Records Table */}
        <Card className="shadow mb-8">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Payroll Records</h3>
          </div>
          
          {isLoading ? (
            <div className="p-8">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employeeId}</TableCell>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell>{formatPeriod(record.periodStart, record.periodEnd)}</TableCell>
                      <TableCell className="text-right">{record.baseSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{record.overtime.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{record.bonus.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{record.deductions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{record.totalPaid.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : record.status === 'Processing' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Salary Advances Table */}
        <Card className="shadow mb-8">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Salary Advances</h3>
          </div>
          
          {isLoading ? (
            <div className="p-8">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryAdvances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>{advance.id}</TableCell>
                      <TableCell>
                        {advance.employeeName}
                        <div className="text-xs text-gray-500">{advance.employeeId}</div>
                      </TableCell>
                      <TableCell className="font-medium">MMK {advance.amount.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(advance.requestDate)}</TableCell>
                      <TableCell>{advance.reason}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          advance.status === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : advance.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {advance.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {advance.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm">View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Footer */}
        <footer className="mt-8 mb-6 pt-4 border-t text-center text-sm text-gray-500">
          <div className="flex justify-between">
            <p>© 2023 HR Admin Portal. All rights reserved.</p>
            <p>Contact us: support@hradminportal.com</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
