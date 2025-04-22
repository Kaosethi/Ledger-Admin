// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import React from "react";
import type { Account, Merchant } from "./mockData"; // Import types needed

export const formatCurrency = (amount: number | null | undefined): string => {
  // Consider using Intl.NumberFormat for locale-aware currency formatting in the future
  // const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  // return amount != null ? formatter.format(amount) : formatter.format(0);
  return "$" + (amount != null ? amount.toFixed(2) : "0.00"); // Keeping simple version for now
};

export const formatDate = (dateString: string | null | undefined): string => {
  // This function remains for general date formatting if needed elsewhere.
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString(); // Default locale format
  } catch (e) {
    console.error("formatDate Error:", e, "Input:", dateString);
    return "Date Error";
  }
};

// ADDED: Specific DD/MM/YYYY date formatter
export const formatDdMmYyyy = (
  isoString: string | Date | null | undefined
): string => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-GB", {
      // 'en-GB' commonly uses DD/MM/YYYY
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date (DD/MM/YYYY):", error);
    return "Error";
  }
};

// ADDED: Specific time formatter (e.g., HH:MM:SS AM/PM)
export const formatTime = (
  isoString: string | Date | null | undefined
): string => {
  if (!isoString) return ""; // Return empty string if no time
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString("en-US", {
      // Use 'en-GB' for 24hr if needed
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Set to false for 24-hour format
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
};

// Render Status Badge component/function
export const renderStatusBadge = (
  status: Account["status"] | Merchant["status"] | string | undefined,
  type: "account" | "merchant" // Add type to potentially differentiate styling later if needed
): React.ReactNode => {
  // Return type is ReactNode
  const statusText = (status || "Unknown").replace(/_/g, " ");
  // Generate a generic class name based on status text
  const statusClassName = `status-${statusText
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  // Define specific Tailwind classes based on known statuses
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch (status?.toLowerCase()) {
    case "active":
    case "approved":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "suspended":
    case "declined":
    case "inactive":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case "pending":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    // Add more cases as needed
  }

  // Use Tailwind classes directly
  return React.createElement(
    "span",
    {
      className: `inline-block px-2 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`,
    },
    statusText
  );
};
