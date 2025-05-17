// src/lib/utils.ts
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

export const formatCurrency = (
  amount: number | undefined | null,
  currency: string = "THB",
  locale: string = "en-US" 
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "฿ -.--"; 
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

// This function is already correctly typed to accept Date objects or strings
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
      month: "short", // Changed to 'short' for better display like "May"
      day: "numeric",
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

// Functions like formatDdMmYyyy, formatTime, formatDdMmYyyyHhMmSs
// also expect string inputs. If you pass Date objects to them from your component,
// they would need similar adjustments or you'd call .toISOString() before passing.
// For simplicity, I'll assume they are used where strings are already available
// or that `formatDateTime` is the primary one used in the modal.

export const formatDdMmYyyy = (
  isoString: string | null | undefined // Stays as string input
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

export const formatTime = (isoString: string | null | undefined): string => { // Stays as string input
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    // const seconds = date.getSeconds().toString().padStart(2, "0"); // Usually not needed for display
    return `${hours}:${minutes}`; // Removed seconds for cleaner time
  } catch (e) {
    console.error("Error in formatTime:", e);
    return "Invalid Time";
  }
};

// This function combines date and time formatting
export const formatDateTime = (
  dateTimeInput: string | Date | null | undefined, // MODIFIED: parameter type and name
  locale: string = "en-US"
): { date: string; time: string } => {
  if (!dateTimeInput) return { date: "N/A", time: "N/A" };
  try {
    // MODIFIED: Handle both string and Date object inputs
    const dateObj =
      typeof dateTimeInput === "string"
        ? new Date(dateTimeInput)
        : dateTimeInput;

    if (isNaN(dateObj.getTime()))
      return { date: "Invalid Date", time: "Invalid Time" };

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short", // Consistent with formatDate
      day: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric", // Use 'numeric' for non-padded hour in AM/PM
      minute: "2-digit",
      hour12: true, // For AM/PM format like "11:55 AM"
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

  // ... (rest of your renderStatusBadge logic - no changes needed here for the date issue)
  switch (type) {
    case "account":
      switch (lowerCaseStatus) {
        case "active": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "inactive": case "rejected": bgColor = "bg-gray-100"; textColor = "text-gray-600"; break;
        case "suspended": bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; break;
        case "pending": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
      }
      break;
    case "merchant":
      switch (lowerCaseStatus) {
        case "active": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "pending_approval": // Added to match your actual status
        case "pending": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        case "suspended": bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; break;
        case "rejected": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
      }
      break;
    case "transaction":
      switch (lowerCaseStatus) {
        case "completed": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "pending": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        case "failed": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
        case "declined": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
      }
      break;
    // Removed "pending" type as it seems redundant with "merchant" or "account" types
    default: // Default handling for any other status or if type is not specified
      switch (lowerCaseStatus) {
        case "active": case "completed": case "approved": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "inactive": bgColor = "bg-gray-100"; textColor = "text-gray-600"; break;
        case "pending": case "pending_approval": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        case "suspended": bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; break;
        case "failed": case "declined": case "rejected": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
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

// Corrected typo from tuncateUUID to truncateUUID
export const truncateUUID = (uuid: string | null | undefined, first = 8, last = 4): string => {
  if (!uuid) return "N/A"; // Handle null or undefined input
  // If the UUID is short (e.g., already truncated or not a full UUID), return as is.
  if (uuid.length <= first + last + 3) return uuid; // +3 for "..."
  return `${uuid.substring(0, first)}...${uuid.substring(uuid.length - last)}`;
};