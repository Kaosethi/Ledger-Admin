// src/lib/utils.ts
// MODIFIED: formatCurrency function defaults and fallback for THB

import React from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a fallback ID for accounts
export function generateFallbackId() {
  const year = new Date().getFullYear().toString();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STC-${year}-${randomChars}`;
}

// MODIFIED: formatCurrency to default to THB and use Baht symbol
export const formatCurrency = (
  amount: number | undefined | null,
  currency: string = "THB", // MODIFIED: Default currency to THB
  locale: string = "en-US" // Kept as en-US, Intl.NumberFormat will use THB symbol
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "฿ -.--"; // MODIFIED: Fallback symbol to Baht and placeholder
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency, // This will now be 'THB' by default
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // This will also use 'THB' (or the provided currency) if currency default is changed
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (
  dateInput: string | Date | null | undefined,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return "N/A";

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      console.warn("Invalid date provided to formatDate:", dateInput);
      return "Invalid Date";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

export const formatDdMmYyyy = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error in formatDdMmYyyy:", e);
    return "Invalid Date";
  }
};

export const formatTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Error in formatTime:", e);
    return "Invalid Time";
  }
};

export const formatDdMmYyyyHhMmSs = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Error formatting date/time:", e);
    return "Invalid Date";
  }
};

export const formatDateTime = (
  isoString: string | null | undefined,
  locale: string = "en-US"
): { date: string; time: string } => {
  if (!isoString) return { date: "N/A", time: "N/A" };
  try {
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime()))
      return { date: "Invalid Date", time: "Invalid Time" };

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };

    const date = dateObj.toLocaleDateString(locale, dateOptions);
    const time = dateObj.toLocaleTimeString(locale, timeOptions);
    return { date, time };
  } catch (e) {
    console.error("Error in formatDateTime:", e);
    return { date: "Error", time: "Error" };
  }
};

export const renderStatusBadge = (
  status: string | undefined | null,
  type?: "account" | "merchant" | "transaction" | "pending"
): React.ReactElement => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let text = status || "Unknown";
  text = text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const lowerCaseStatus = status?.toLowerCase();

  switch (type) {
    case "account":
      switch (lowerCaseStatus) {
        case "active":
          bgColor = "bg-green-100";
          textColor = "text-green-800";
          break;
        case "inactive":
        case "rejected":
          bgColor = "bg-gray-100";
          textColor = "text-gray-600";
          break;
        case "suspended":
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
          break;
        case "pending":
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
          break;
      }
      break;
    case "merchant":
      switch (lowerCaseStatus) {
        case "active":
          bgColor = "bg-green-100";
          textColor = "text-green-800";
          break;
        case "pending":
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
          break;
        case "suspended":
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
          break;
        case "rejected":
          bgColor = "bg-red-100";
          textColor = "text-red-800";
          break;
      }
      break;
    case "transaction":
      switch (lowerCaseStatus) {
        case "completed":
          bgColor = "bg-green-100";
          textColor = "text-green-800";
          break;
        case "pending":
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
          break;
        case "failed":
          bgColor = "bg-red-100";
          textColor = "text-red-800";
          break;
        case "declined":
          bgColor = "bg-red-100";
          textColor = "text-red-800";
          break;
      }
      break;
    case "pending":
      switch (lowerCaseStatus) {
        case "pending":
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
          break;
        case "approved":
          bgColor = "bg-green-100";
          textColor = "text-green-800";
          break;
        case "rejected":
          bgColor = "bg-red-100";
          textColor = "text-red-800";
          break;
      }
      break;
    default:
      switch (lowerCaseStatus) {
        case "active":
        case "completed":
        case "approved":
          bgColor = "bg-green-100";
          textColor = "text-green-800";
          break;
        case "inactive":
          bgColor = "bg-gray-100";
          textColor = "text-gray-600";
          break;
        case "pending":
        case "pending_approval":
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
          break;
        case "suspended":
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
          break;
        case "failed":
        case "declined":
        case "rejected":
          bgColor = "bg-red-100";
          textColor = "text-red-800";
          break;
      }
      break;
  }
  return React.createElement(
    "span",
    {
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`,
    },
    text
  );
};

export const tuncateUUID = (uuid: string): string => {
  return uuid.slice(0, 8);
};
