// src/app/components/tabs/MerchantsTab.tsx
import React from 'react';
import type { Merchant, Transaction } from '@/lib/mockData';
import { formatDate, renderStatusBadge } from '@/lib/utils';

interface MerchantsTabProps {
  merchants: Merchant[];
  transactions: Transaction[];
  // Add other props
}

const MerchantsTab: React.FC<MerchantsTabProps> = ({ merchants = [], transactions = [] }) => {

  const pendingMerchants = merchants.filter((m: Merchant) => m.status === 'pending_approval');
  const managedMerchants = merchants.filter((m: Merchant) => m.status !== 'pending_approval');

  return (
    // Added classes from #merchants-tab div
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Merchant Management</h2>

      {/* Pending Merchants Section - Added margin */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-800">Pending Merchant Applications</h3>
        {/* Added wrapper styles */}
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="pending-merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Added .table-header and .actions */}
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
                pendingMerchants.map((merchant: Merchant) => ( // Added type
                  <tr key={merchant.id}>
                    {/* Added .table-cell */}
                    <td className="table-cell font-semibold text-gray-900">{merchant.businessName}</td>
                    <td className="table-cell">{merchant.contactEmail}</td>
                    <td className="table-cell">{formatDate(merchant.submittedAt)}</td>
                    {/* Added .table-cell .actions and button styles */}
                    <td className="table-cell actions space-x-2">
                      <button className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 approve-merchant-btn">Approve</button>
                      <button className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 reject-merchant-btn">Reject</button>
                      <button className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 view-merchant-details-btn">Details</button>
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
         {/* Added wrapper styles */}
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                 {/* Added .table-header and .center/.actions */}
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
                 managedMerchants.map((merchant: Merchant) => { // Added type
                   const txCount = transactions.filter((tx: Transaction) => tx.merchantId === merchant.id && tx.status === 'Approved').length; // Added type
                   return (
                     <tr key={merchant.id}>
                        {/* Added .table-cell and variants */}
                       <td className="table-cell font-semibold text-gray-900">{merchant.id}</td>
                       <td className="table-cell">{merchant.businessName}</td>
                       <td className="table-cell">{merchant.contactEmail}</td>
                       <td className="table-cell center">{renderStatusBadge(merchant.status, 'merchant')}</td>
                       <td className="table-cell">{formatDate(merchant.updatedAt || merchant.submittedAt)}</td>
                       <td className="table-cell center">{txCount}</td>
                       <td className="table-cell actions space-x-1"> {/* Added .actions */}
                         <button className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 view-merchant-details-btn">Details</button>
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