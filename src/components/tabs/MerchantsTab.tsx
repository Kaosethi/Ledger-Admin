// src/app/components/tabs/MerchantsTab.tsx
import React from 'react';
import type { Merchant, Transaction } from '@/lib/mockData';

interface MerchantsTabProps {
  merchants: Merchant[];
  transactions: Transaction[];
  onMerchantsUpdate: (updatedMerchants: Merchant[]) => void;
  logAdminActivity: (action: string, targetType: string, targetId: string, details: string) => void;
}

const MerchantsTab: React.FC<MerchantsTabProps> = ({ merchants, transactions, onMerchantsUpdate, logAdminActivity }) => {
  const handleApprove = (merchantId: string) => {
    const updated = merchants.map(m => {
        if (m.id === merchantId) {
            // Create the new object, explicitly casting the status
            return {
                ...m,
                status: 'Approved' as Merchant['status'] // <<< FIX: Explicitly cast status
            };
        }
        return m; // Return unchanged merchant if ID doesn't match
    });

    onMerchantsUpdate(updated); // Pass the correctly typed array

    logAdminActivity("Approve Merchant", "Merchant", merchantId, `Merchant approved.`);
  };

  return (
    <div>
      <h2>Merchants Tab Content</h2>
       {/* ... rest of the component ... */}
       <ul>
        {merchants.map(m => (
          <li key={m.id}>
            {m.businessName} ({m.status})
            {m.status === 'Pending' && <button onClick={() => handleApprove(m.id)} className="text-xs text-green-500 ml-2">(Approve)</button>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MerchantsTab;