// src/app/components/tabs/ActivityLogTab.tsx
import React from 'react'; // Assuming state for toggle will be added
import type { AdminLog } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

interface LogSession { // Example grouping structure
    adminUser: string;
    loginTime: string;
    logoutTime: string | null;
    actions: AdminLog[];
    loginLogId?: string;
    logoutLogId?: string;
}

interface ActivityLogTabProps {
  sessions: LogSession[]; // Expect grouped sessions
  // Add other props
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ sessions = [] }) => {
  // Add state here for toggling session visibility, e.g.,
  // const [openSessionIndex, setOpenSessionIndex] = useState<number | null>(null);

  return (
    // Added classes from #activity-log-tab div
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header & Filters - Added layout classes */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Admin Activity Log (Grouped by Session)</h2>
        {/* Added layout classes */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Added input field styles */}
          <div>
            <label htmlFor="log-start-date-filter" className="text-xs font-medium text-gray-500 mr-1 block mb-1">From:</label>
            <input type="date" id="log-start-date-filter" className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="log-end-date-filter" className="text-xs font-medium text-gray-500 mr-1 block mb-1">To:</label>
            <input type="date" id="log-end-date-filter" className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400" />
          </div>
        </div>
      </div>

      {/* Sessions Container - Added spacing */}
      <div id="activity-log-sessions-container" className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No activity sessions found for the selected period.</div>
        ) : (
          sessions.map((session, index) => (
            // Session Wrapper - Added border, shadow
            <div key={session.loginLogId || session.loginTime || index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Session Header - Added layout, padding, hover */}
              {/* Add onClick to toggle state */}
              <div className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer session-header hover:bg-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">{session.adminUser}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Logged in: <span className="font-medium">{formatDate(session.loginTime)}</span> |{' '}
                    {session.logoutTime
                      ? `Logged out: <span class="font-medium">${formatDate(session.logoutTime)}</span>`
                      : <span className="text-green-600 font-medium">Session Active</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{session.actions.length} {session.actions.length === 1 ? 'action' : 'actions'} in this session.</p>
                </div>
                {/* Chevron Icon - Add conditional 'rotate-180' based on state */}
                <svg className="w-5 h-5 text-gray-500 transition-transform transform chevron-icon shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              {/* Session Content - Add conditional 'hidden' based on state */}
              <div className="p-4 border-t border-gray-200 session-content hidden bg-white">
                {session.actions.length > 0 ? (
                  <ul className="space-y-3">
                    {session.actions.map(action => (
                      <li key={action.id} className="text-sm flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0">
                        <div className="flex-grow min-w-0">
                          <span className="font-mono text-xs text-gray-500 mr-2 block sm:inline">{formatDate(action.timestamp)}</span>
                          <span className="font-medium text-gray-800 break-words">{action.action}</span>
                          <span className="text-gray-600 block sm:inline break-words"> - Target: {action.targetType || 'N/A'}: {action.targetId || 'N/A'}</span>
                        </div>
                        <button
                          className="text-xs text-primary hover:text-secondary flex-shrink-0 mt-1 sm:mt-0 view-activity-btn"
                          // onClick={() => openLogDetailsModal(action.id)}
                        >
                          Details
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No other actions recorded in this session.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Section - Added styles */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span id="log-pagination-start">1</span> to <span id="log-pagination-end">{Math.min(10, sessions.length)}</span> of <span id="log-pagination-total">{sessions.length}</span> sessions
        </div>
        <div className="flex space-x-2">
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            Previous
          </button>
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogTab;