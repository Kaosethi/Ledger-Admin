'use client';

import { useEffect, useState } from 'react';
import MerchantsTab from '@/components/tabs/MerchantsTab';

// Types for the data needed by MerchantsTab
interface Merchant {
  id: string;
  businessName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  status: string;
  submittedAt: string;
  // Add any other fields needed by the component
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch merchants data
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch('/api/merchants');
        if (response.ok) {
          const data = await response.json();
          setMerchants(data);
        }
      } catch (error) {
        console.error('Error fetching merchants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  // Handler for merchant updates
  const handleMerchantsUpdate = (updatedMerchants: Merchant[]) => {
    setMerchants(updatedMerchants);
  };

  if (loading) {
    return <div className="text-center py-10">Loading merchants data...</div>;
  }

  return (
    <MerchantsTab 
      merchants={merchants} 
      onMerchantsUpdate={handleMerchantsUpdate} 
    />
  );
} 