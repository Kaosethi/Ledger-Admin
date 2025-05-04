"use client";

import ActivityLogTab from "@/components/tabs/ActivityLogTab";
import mockData from "@/lib/mockData";

export default function ActivityLogPage() {
  return <ActivityLogTab logs={mockData.adminActivityLog} />;
}
