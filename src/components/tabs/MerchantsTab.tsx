// src/app/components/tabs/MerchantsTab.tsx
import React from 'react';
import type { Merchant, Transaction } from '@/lib/mockData';
import { formatDate, renderStatusBadge } from '@/lib/utils';

interface MerchantsTabProps {
  merchants: Merchant[];
  transactions: Transaction[];
  // ADDED: Define the expected props from AdminDashboard
  onMerchantsUpdate?: (updatedMerchants: Merchant[]) => void; // Function to update merchants list
  logAdminActivity?: (action: string, targetType?: string, targetId?: string, details?: string) => void; // Function to log activity
  // Add other props if needed
}

// Destructure the props
const MerchantsTab: React.FC<MerchantsTabProps> = ({ merchants = [], transactions = [], onMerchantsUpdate, logAdminActivity }) => {

  // --- Add state and handlers here for buttons (Approve/Reject/Details) ---

  const handleApprove = (merchantId: string) => {
    console.log("Approving merchant:", merchantId);
    // 1. Find the merchant and update its status
    const updatedMerchants = merchants.map(m =>
      m.id === merchantId ? { ...m, status: 'active' as Merchant["status"], updatedAt: new Date().toISOString() } : m
    );
    // 2. Call parent update function
    if (onMerchantsUpdate) {
      onMerchantsUpdate(updatedMerchants);
    }
    // 3. Log activity
    if (logAdminActivity) {
      logAdminActivity('Approve Merchant', 'Merchant', merchantId);
    }
    alert(`Merchant ${merchantId} approved (simulated). Implement actual logic.`);
  };

  const handleReject = (merchantId: string) => {
     console.log("Rejecting merchant:", merchantId);
     // 1. Find the merchant and update its status
     const updatedMerchants = merchants.map(m =>
       m.id === merchantId ? { ...m, status: 'rejected' as Merchant["status"], updatedAt: new Date().toISOString() } : m
     );
     // 2. Call parent update function
     if (onMerchantsUpdate) {
       onMerchantsUpdate(updatedMerchants);
     }
     // 3. Log activity
     if (logAdminActivity) {
       logAdminActivity('Reject Merchant', 'Merchant', merchantId);
     }
     alert(`Merchant ${merchantId} rejected (simulated). Implement actual logic.`);
  };

  const handleViewDetails = (merchantId: string) => {
     console.log("Viewing details for merchant:", merchantId);
     // TODO: Implement logic to open a details modal/view
     alert(`Implement details view for Merchant ${merchantId}.`);
  };

  // Filter merchants (consider memoizing if lists are large)
  const pendingMerchants = merchants.filter((m: Merchant) => m.status === 'pending_approval');
  const managedMerchants = merchants.filter((m: Merchant) => m.status !== 'pending_approval');

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Merchant Management</h2>

      {/* Pending Merchants Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-800">Pending Merchant Applications</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="pending-merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="table-header">Store Name</th>
                <th scope="col" className="table-header">Contact Email</th>
                <th scope="col" className="table-header">Submitted</th>
                <th scope="col" className="table-header actions">Actions</th>
              </tr>
            </thead>
            <tbody id="pending-merchants-table-body" className="bg-white divide-y divide-gray-200">
              {pendingMerchants.length === 0 ? (
                <tr><td colSpan={4} className="table-cell center">No pending applications.</td></tr>
              ) : (
                pendingMerchants.map((merchant) => ( // Removed type assertion, TS infers from filter
                  <tr key={merchant.id}>
                    <td className="table-cell font-semibold text-gray-900">{merchant.businessName}</td>
                    <td className="table-cell">{merchant.contactEmail}</td>
                    <td className="table-cell">{formatDate(merchant.submittedAt)}</td>
                    <td className="table-cell actions space-x-2">
                      {/* Added onClick handlers */}
                      <button onClick={() => handleApprove(merchant.id)} className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 approve-merchant-btn">Approve</button>
                      <button onClick={() => handleReject(merchant.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 reject-merchant-btn">Reject</button>
                      <button onClick={() => handleViewDetails(merchant.id)} className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 view-merchant-details-btn">Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Managed Merchants Section */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-800">All Managed Merchants</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="table-header">Merchant ID</th>
                <th scope="col" className="table-header">Store Name</th>
                <th scope="col" className="table-header">Contact Email</th>
                <th scope="col" className="table-header center">Status</th>
                <th scope="col" className="table-header">Created/Updated</th>
                <th scope="col" className="table-header center">Transactions</th>
                <th scope="col" className="table-header actions">Actions</th>
              </tr>
            </thead>
            <tbody id="merchants-table-body" className="bg-white divide-y divide-gray-200">
               {managedMerchants.length === 0 ? (
                 <tr><td colSpan={7} className="table-cell center">No managed merchants found.</td></tr>
               ) : (
                 managedMerchants.map((merchant) => { // Removed type assertion
                   // Calculate transaction count (consider moving logic if complex)
                   const txCount = transactions.filter(tx => tx.merchantId === merchant.id && tx.status === 'Approved').length;
                   return (
                     <tr key={merchant.id}>
                       <td className="table-cell font-semibold text-gray-900">{merchant.id}</td>
                       <td className="table-cell">{merchant.businessName}</td>
                       <td className="table-cell">{merchant.contactEmail}</td>
                       <td className="table-cell center">{renderStatusBadge(merchant.status, 'merchant')}</td>
                       <td className="table-cell">{formatDate(merchant.updatedAt || merchant.submittedAt)}</td>
                       <td className="table-cell center">{txCount}</td>
                       <td className="table-cell actions space-x-1">
                         {/* Added onClick handler */}
                         <button onClick={() => handleViewDetails(merchant.id)} className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 view-merchant-details-btn">Details</button>
                       </td>
                     </tr>
                   )
                 })
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MerchantsTab;