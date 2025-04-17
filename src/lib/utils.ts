// src/lib/utils.ts
import React from 'react';
import type { Account, Merchant } from './mockData'; // Import types needed

export const formatCurrency = (amount: number | null | undefined): string => {
  return '$' + (amount != null ? amount.toFixed(2) : '0.00');
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Basic locale string is often good enough and handles timezones better
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  } catch (e) {
    console.error("formatDate Error:", e, "Input:", dateString);
    return 'Date Error'; // <<< Ensure a string is returned on error
  }
};

// Render Status Badge component/function (can also be a separate component)
export const renderStatusBadge = (
    status: Account['status'] | Merchant['status'] | string | undefined,
    type: 'account' | 'merchant' // Add type to potentially differentiate styling later if needed
    ): React.ReactNode => { // Return type is ReactNode
    const statusText = (status || 'Unknown').replace(/_/g, ' ');
    let statusClass = `status-${(status || 'unknown').toLowerCase().replace(/_/g, '-')}`;

    // You can add more specific checks if needed, otherwise rely on the CSS classes
    // e.g., if (type === 'account' && status === 'Inactive') statusClass = 'status-inactive';

    // Use custom CSS class .status-badge and status-specific class
    return React.createElement('span', { className: `status-badge ${statusClass}` }, statusText);
};