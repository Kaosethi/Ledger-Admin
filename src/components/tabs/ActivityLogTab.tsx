// src/app/components/tabs/ActivityLogTab.tsx
import React from 'react'; // <-- Added useState
import type { AdminLog } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

// REMOVED: LogSession interface, as we now accept raw logs

interface ActivityLogTabProps {
  // MODIFIED: Expect raw AdminLog array instead of pre-grouped sessions
  logs: AdminLog[];
  // Add other props if needed
}

// Destructure logs prop
const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ logs = [] }) => {
  // State for pagination/filtering would go here if needed
  // State for toggling details might also be needed

  // --- Session Grouping Logic (Placeholder) ---
  // If you want the grouped-by-session view, you need to implement logic here
  // or (better) do the grouping in AdminDashboard before passing data down.
  // This example *does not* group logs; it displays them raw.

  // Example: Basic structure if you were to group (requires more complex logic)
  // const groupedSessions = useMemo(() => {
  //    // ... logic to group logs by adminEmail and time windows ...
  //    return []; // Return array of LogSession objects
  // }, [logs]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        {/* MODIFIED: Title reflects raw logs */}
        <h2 className="text-xl font-semibold text-gray-800">Admin Activity Log (Raw Events)</h2>
        <div className="flex flex-wrap items-end gap-2">
          {/* Date filters */}
          <div>
            <label htmlFor="log-start-date-filter" className="text-xs font-medium text-gray-500 mr-1 block mb-1">From:</label>
            <input type="date" id="log-start-date-filter" className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="log-end-date-filter" className="text-xs font-medium text-gray-500 mr-1 block mb-1">To:</label>
            <input type="date" id="log-end-date-filter" className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400" />
          </div>
          {/* Add Filter button if needed */}
        </div>
      </div>

      {/* MODIFIED: Display raw logs in a simple table or list */}
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
             <tr>
               <th scope="col" className="table-header">Timestamp</th>
               <th scope="col" className="table-header">Admin Email</th>
               <th scope="col" className="table-header">Action</th>
               <th scope="col" className="table-header">Target</th>
               <th scope="col" className="table-header">Details</th>
               {/* <th scope="col" className="table-header actions">Actions</th> */}
             </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="table-cell center">No activity logs found.</td></tr>
            ) : (
              // Map directly over the logs prop, assuming newest first might be better (add sort if needed)
              logs.slice().reverse().map((log: AdminLog) => ( // Create copy and reverse for display order
                <tr key={log.id}>
                  <td className="table-cell whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="table-cell">{log.adminEmail}</td>
                  <td className="table-cell">{log.action}</td>
                  <td className="table-cell">{log.targetType}: {log.targetId}</td>
                  <td className="table-cell break-words max-w-xs">{log.details}</td>
                  {/* Optional: Add a details button if needed */}
                  {/* <td className="table-cell actions">
                     <button className="text-xs text-primary hover:text-secondary">Details</button>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section - Needs state/logic to work */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {/* Update pagination text based on logs */}
          Showing <span id="log-pagination-start">1</span> to <span id="log-pagination-end">{Math.min(10, logs.length)}</span> of <span id="log-pagination-total">{logs.length}</span> logs
        </div>
        <div className="flex space-x-2">
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">Previous</button>
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogTab;