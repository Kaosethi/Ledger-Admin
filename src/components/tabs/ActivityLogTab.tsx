// src/app/components/tabs/ActivityLogTab.tsx
'use client'; // ADDED: Mark as Client Component

import React, { useState, useMemo } from "react"; // ADDED: useState, useMemo
import type { AdminLog } from "@/lib/mockData";
// MODIFIED: Import more formatters
import { formatDate, formatDdMmYyyy, formatTime } from "@/lib/utils";

// Define the structure for a grouped session
interface LogSession {
  sessionId: string; // Unique identifier for the session (e.g., login log ID)
  adminEmail: string;
  loginTime: string;
  logoutTime?: string | null; // Optional logout time
  logs: AdminLog[]; // Logs within this session (excluding the initial login)
}

interface ActivityLogTabProps {
  logs: AdminLog[];
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ logs = [] }) => {
  // --- State for Date Filters ---
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD
  // --- State for Expanded Sessions ---
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // --- Data Processing: Filter, Group, Sort ---
  const groupedSessions = useMemo(() => {
    // 1. Filter by date range
    const dateFilteredLogs = logs.filter(log => {
        const logDate = log.timestamp.substring(0, 10);
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
    });

    // 2. Sort logs chronologically (oldest first for easier grouping)
    const sortedLogs = dateFilteredLogs.slice().sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 3. Group into sessions
    const sessions: LogSession[] = [];
    let currentSession: LogSession | null = null;

    for (const log of sortedLogs) {
        if (log.action === 'Login') {
            // Start a new session
            currentSession = {
                sessionId: log.id, // Use login log ID as session ID
                adminEmail: log.adminEmail,
                loginTime: log.timestamp,
                logs: [], // Initialize logs for this session
            };
            sessions.push(currentSession);
        } else if (currentSession && log.adminEmail === currentSession.adminEmail) {
            // Add log to the current session if admin matches
            if (log.action === 'Logout') {
                currentSession.logoutTime = log.timestamp;
                // Optional: Stop adding logs after logout? Depends on desired behavior.
                // currentSession = null; // Uncomment if logout *ends* the session definitively
            }
            // Add non-login/non-logout logs to the session's log list
            if (log.action !== 'Logout') { // Avoid adding the logout event itself to the list if logoutTime is set
                 currentSession.logs.push(log);
            }

        } else {
            // Log doesn't belong to the current session (e.g., different admin before a new login)
            // Or log occurred before the first Login event in the filtered range
            // We could potentially group these "orphaned" logs differently if needed
            console.warn("Orphaned log detected:", log); // Optional logging
        }
    }

    // 4. Sort sessions by login time (newest first)
    return sessions.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());

  }, [logs, startDate, endDate]);


  // --- Toggle Session Expansion ---
  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };


  // --- Pagination (Basic - Applied to Sessions) ---
  // You might want a more robust pagination library later
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 5; // Show 5 sessions per page
  const totalSessions = groupedSessions.length;
  const totalPages = Math.ceil(totalSessions / sessionsPerPage);
  const paginatedSessions = useMemo(() => {
      const startIndex = (currentPage - 1) * sessionsPerPage;
      const endIndex = startIndex + sessionsPerPage;
      return groupedSessions.slice(startIndex, endIndex);
  }, [groupedSessions, currentPage, sessionsPerPage]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const paginationStart = (currentPage - 1) * sessionsPerPage + 1;
  const paginationEnd = Math.min(currentPage * sessionsPerPage, totalSessions);

  // --- Component Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Activity Log (Grouped by Session) {/* MODIFIED: Title */}
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="log-start-date-filter" className="text-xs font-medium text-gray-500 mr-1 block mb-1"> From: </label>
            {/* ADDED: value and onChange */}
            <input
              type="date"
              id="log-start-date-filter"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="log-end-date-filter" className="text-xs font-medium text-gray-500 mr-1 block mb-1"> To: </label>
             {/* ADDED: value, onChange, min */}
            <input
              type="date"
              id="log-end-date-filter"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* MODIFIED: Session List */}
      <div className="space-y-4">
        {paginatedSessions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No activity sessions found for the selected criteria.</p>
        ) : (
          paginatedSessions.map((session) => {
            const isExpanded = expandedSessions.has(session.sessionId);
            const sessionActive = !session.logoutTime;
            return (
              <div key={session.sessionId} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Session Header */}
                <button
                  onClick={() => toggleSession(session.sessionId)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  aria-expanded={isExpanded}
                  aria-controls={`session-content-${session.sessionId}`}
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-left">{session.adminEmail}</p>
                    <p className="text-xs text-gray-500 text-left">
                      Logged in: {formatDdMmYyyy(session.loginTime)} {formatTime(session.loginTime)}
                      {session.logoutTime && ` | Logged out: ${formatDdMmYyyy(session.logoutTime)} ${formatTime(session.logoutTime)}`}
                      {!session.logoutTime && <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Session Active</span>}
                    </p>
                     <p className="text-xs text-gray-500 text-left mt-1">{session.logs.length} action{session.logs.length !== 1 ? 's' : ''} in this session.</p>
                  </div>
                  {/* Chevron Icon */}
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /> </svg>
                </button>

                {/* Session Content (Collapsible) */}
                <div
                  id={`session-content-${session.sessionId}`}
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0' // Adjust max-h if needed
                  }`}
                >
                  <div className="p-4 border-t border-gray-200">
                    {session.logs.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No other actions recorded in this session.</p>
                    ) : (
                      <ul className="space-y-2">
                        {session.logs.map(log => (
                          <li key={log.id} className="text-sm text-gray-700 flex items-start space-x-3">
                            <span className="text-gray-500 whitespace-nowrap">
                              {formatDdMmYyyy(log.timestamp)} {formatTime(log.timestamp)}
                            </span>
                            <span className="flex-1">
                                <span className="font-medium">{log.action}</span>
                                {log.targetType && log.targetId && <span className="text-gray-600"> - Target: {log.targetType}: {log.targetId}</span>}
                                {log.details && <span className="block text-xs text-gray-500 pl-2 italic"> → {log.details}</span>}
                            </span>
                            {/* Optional "Details" button for each log if needed */}
                            {/* <button className="text-xs text-primary hover:underline ml-auto shrink-0">Details</button> */}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{paginationStart}</span> to <span className="font-medium">{paginationEnd}</span> of{" "}
          <span className="font-medium">{totalSessions}</span> sessions
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Previous
          </button>
          <button
             onClick={handleNextPage}
             disabled={currentPage === totalPages || totalSessions === 0}
            className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogTab;