// src/app/components/tabs/ActivityLogTab.tsx
"use client";

import React, { useState, useMemo } from "react";
// MODIFIED: Import AdminLog with targetType
import type { AdminLog } from "@/lib/mockData";
// Using existing formatters
import { formatDdMmYyyy, formatTime } from "@/lib/utils";

// Define the structure for a grouped session
interface LogSession {
  sessionId: string;
  adminEmail: string;
  loginTime: string;
  logoutTime?: string | null;
  logs: AdminLog[];
}

interface ActivityLogTabProps {
  logs: AdminLog[];
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ logs = [] }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  );

  const groupedSessions = useMemo(() => {
    const dateFilteredLogs = logs.filter((log) => {
      const logDate = log.timestamp.substring(0, 10);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });

    const sortedLogs = dateFilteredLogs
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    const sessions: LogSession[] = [];
    let currentSession: LogSession | null = null;

    for (const log of sortedLogs) {
      // Use specific Login actions to start sessions
      if (log.action === "Login Success" || log.action === "Logged In") {
        // Handle variations
        currentSession = {
          sessionId: log.id,
          adminEmail: log.adminUsername, // Use adminUsername from log
          loginTime: log.timestamp,
          logs: [],
        };
        sessions.push(currentSession);
      } else if (
        currentSession &&
        log.adminUsername === currentSession.adminEmail
      ) {
        // Add subsequent logs from the same user to the current session
        // Check specifically for Logout action
        if (log.action === "Logout") {
          currentSession.logoutTime = log.timestamp;
          // Don't add Logout action itself to the detailed logs list
        } else {
          // Add other actions (not Login/Logout) to the session's log list
          if (log.action !== "Login Success" && log.action !== "Logged In") {
            currentSession.logs.push(log);
          }
        }
      } else {
        // Optional: Handle logs outside a defined session if necessary
        // These might be system events or logs before the first filtered login
        console.warn("Log outside active session or before first login:", log);
      }
    }

    // Sort sessions by login time (newest first) for display
    return sessions.sort(
      (a, b) =>
        new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
    );
  }, [logs, startDate, endDate]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 5;
  const totalSessions = groupedSessions.length;
  const totalPages = Math.ceil(totalSessions / sessionsPerPage);
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * sessionsPerPage;
    return groupedSessions.slice(startIndex, startIndex + sessionsPerPage);
  }, [groupedSessions, currentPage, sessionsPerPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const paginationStart = (currentPage - 1) * sessionsPerPage + 1;
  const paginationEnd = Math.min(currentPage * sessionsPerPage, totalSessions);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Activity Log
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label
              htmlFor="log-start-date-filter"
              className="text-xs font-medium text-gray-500 mr-1 block mb-1"
            >
              {" "}
              From:{" "}
            </label>
            <input
              type="date"
              id="log-start-date-filter"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="log-end-date-filter"
              className="text-xs font-medium text-gray-500 mr-1 block mb-1"
            >
              {" "}
              To:{" "}
            </label>
            <input
              type="date"
              id="log-end-date-filter"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-4">
        {paginatedSessions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No activity sessions found for the selected criteria.
          </p>
        ) : (
          paginatedSessions.map((session) => {
            const isExpanded = expandedSessions.has(session.sessionId);
            // const sessionActive = !session.logoutTime; // Removed unused variable
            return (
              <div
                key={session.sessionId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Session Header */}
                <button
                  onClick={() => toggleSession(session.sessionId)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  aria-expanded={isExpanded}
                  aria-controls={`session-content-${session.sessionId}`}
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-left">
                      {session.adminEmail}
                    </p>
                    <p className="text-xs text-gray-500 text-left">
                      Logged in: {formatDdMmYyyy(session.loginTime)}{" "}
                      {formatTime(session.loginTime)}
                      {session.logoutTime &&
                        ` | Logged out: ${formatDdMmYyyy(
                          session.logoutTime
                        )} ${formatTime(session.logoutTime)}`}
                      {!session.logoutTime && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Session Active
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 text-left mt-1">
                      {session.logs.length} action
                      {session.logs.length !== 1 ? "s" : ""} in this session.
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Session Content (Collapsible) */}
                <div
                  id={`session-content-${session.sessionId}`}
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-4 border-t border-gray-200">
                    {session.logs.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        No other actions recorded in this session.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {session.logs.map((log) => (
                          <li
                            key={log.id}
                            className="text-sm text-gray-700 flex items-start space-x-3"
                          >
                            <span className="text-gray-500 whitespace-nowrap">
                              {formatDdMmYyyy(log.timestamp)}{" "}
                              {formatTime(log.timestamp)}
                            </span>
                            <span className="flex-1">
                              <span className="font-medium">{log.action}</span>
                              {/* MODIFIED: Display targetType along with targetId */}
                              {(log.targetType || log.targetId) && ( // Show if either exists
                                <span className="text-gray-600">
                                  {} - Target:{" "}
                                  {log.targetType ? `${log.targetType}: ` : ""}
                                  {log.targetId || "(System/Unknown)"}
                                </span>
                              )}
                              {log.details && (
                                <span className="block text-xs text-gray-500 pl-2 italic">
                                  {" "}
                                  → {log.details}
                                </span>
                              )}
                            </span>
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
          Showing <span className="font-medium">{paginationStart}</span> to{" "}
          <span className="font-medium">{paginationEnd}</span> of{" "}
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
