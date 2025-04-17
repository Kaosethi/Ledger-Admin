import React from 'react';
import type { AdminLog } from '@/lib/mockData'; // Import types

// Define props expected by this tab
interface ActivityLogTabProps {
  logs: AdminLog[];
}

// Use React.FC and the props interface
const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ logs }) => {
  return (
    <div>
      <h2>Activity Log Tab Content</h2>
      <p>Content for viewing admin activity logs goes here.</p>
      <ul>
        {logs.map(log => (
           // Ensure your AdminLog interface has 'id'
          <li key={log.id}>
            {log.timestamp}: [{log.adminEmail}] {log.action} - {log.details || ''}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLogTab;