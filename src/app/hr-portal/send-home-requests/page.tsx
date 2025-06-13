"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import hrMockDataInstance, { SendHomeRequest } from "@/lib/hrPortalMockData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function SendHomeRequestsPage() {
  // States for data and loading
  const [sendHomeRequests, setSendHomeRequests] = useState<SendHomeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate loading data
  useEffect(() => {
    const loadData = () => {
      try {
        setTimeout(() => {
          // Try to access the mock data
          const requestData = hrMockDataInstance.sendHomeRequests || [];
          setSendHomeRequests(requestData);
          setIsLoading(false);
        }, 800); // Simulate network delay
      } catch (error) {
        console.error("Error loading mock data:", error);
        setSendHomeRequests([]);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter send home requests based on search term and status
  const filteredRequests = sendHomeRequests.filter(request => {
    const matchesSearch = 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.rmsId && request.rmsId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === "all" ||
      request.status.toLowerCase() === filterStatus.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                <Button variant="ghost" className="text-sm">Payroll</Button>
              </Link>
              <Link href="/hr-portal/send-home-requests">
                <Button variant="default" className="text-sm">Send Home Requests</Button>
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
        {/* User Profile Section - Minimized for this page */}
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

        {/* Send Home Requests Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Send Home Requests</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage employee send home requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold mt-1">{sendHomeRequests.length}</p>
          </Card>
          
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-2xl font-bold mt-1">
              {sendHomeRequests.filter(r => r.status === 'Pending').length}
            </p>
          </Card>
          
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="text-2xl font-bold mt-1">
              {sendHomeRequests.filter(r => r.status === 'Completed').length}
            </p>
          </Card>
          
          <Card className="p-4 shadow">
            <p className="text-sm font-medium text-gray-500">Total Sent Home Amount</p>
            <p className="text-2xl font-bold mt-1">
              MMK {sendHomeRequests
                .filter(r => r.status === 'Completed')
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()}
            </p>
          </Card>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm whitespace-nowrap">Status:</p>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Send Home Requests Table */}
        <Card className="shadow mb-8">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Request History</h3>
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
                    <TableHead>Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>RMS ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{request.employeeName}</div>
                          <div className="text-xs text-gray-500">{request.employeeId}</div>
                        </TableCell>
                        <TableCell>{request.rmsId || '-'}</TableCell>
                        <TableCell>
                          {request.timestamp ? formatDate(request.timestamp) : formatDate(request.requestDate)}
                        </TableCell>
                        <TableCell className="font-medium">MMK {request.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'Pending' ? (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {searchTerm || filterStatus !== "all" ? 
                          "No matching requests found. Try adjusting your filters." : 
                          "No send home requests available."}
                      </TableCell>
                    </TableRow>
                  )}
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
