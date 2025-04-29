"use client";

import { useEffect, useState } from "react";
import ActivityLogTab from "@/components/tabs/ActivityLogTab";

// Types for the data needed by ActivityLogTab
interface AdminLog {
  id: string;
  timestamp: string;
  adminUsername: string;
  action: string;
  targetId: string;
  details: string;
  // Add any other fields needed by the component
}

export default function ActivityLogPage() {
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch admin logs data
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Fetch admin activity logs
        const response = await fetch("/api/admin-logs");
        if (response.ok) {
          const data = await response.json();
          setAdminLogs(data);
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading activity logs...</div>;
  }

  return <ActivityLogTab adminActivityLog={adminLogs} />;
}
