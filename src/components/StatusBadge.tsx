// src/components/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusKey = (status || 'unknown').toLowerCase().replace(/ /g, '_'); // Replace space with underscore
  const statusText = (status || 'Unknown').replace('_', ' ');

  let statusClass = 'status-unknown'; // Default class

  switch (statusKey) {
    case 'active':
      statusClass = 'status-active';
      break;
    case 'pending_approval': // Handle both underscore and potentially space versions
    case 'pending approval':
         statusClass = 'status-pending_approval'; // Use the CSS class name
         break;
    case 'suspended':
      statusClass = 'status-suspended';
      break;
    case 'rejected':
      statusClass = 'status-rejected';
      break;
    // Add more cases if needed
  }

  return (
    <span className={`status-badge ${statusClass}`}>
      {statusText}
    </span>
  );
};

export default StatusBadge;