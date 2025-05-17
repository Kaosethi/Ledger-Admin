// src/lib/utils.ts
import React from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ... (cn, generateFallbackId, formatCurrency, formatDate, formatDateTime - keep as corrected before) ...

export const formatDate = ( // Keep this corrected version
  dateInput: string | Date | null | undefined,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return "N/A";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      console.warn("Invalid date provided to formatDate:", dateInput);
      return "Invalid Date";
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric", month: "short", day: "numeric", ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

export const formatDateTime = ( // Keep this corrected version
  dateTimeInput: string | Date | null | undefined,
  locale: string = "en-US"
): { date: string; time: string } => {
  if (!dateTimeInput) return { date: "N/A", time: "N/A" };
  try {
    const dateObj = typeof dateTimeInput === "string" ? new Date(dateTimeInput) : dateTimeInput;
    if (isNaN(dateObj.getTime())) return { date: "Invalid Date", time: "Invalid Time" };
    const dateOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    const date = dateObj.toLocaleDateString(locale, dateOptions);
    const time = dateObj.toLocaleTimeString(locale, timeOptions);
    return { date, time };
  } catch (e) {
    console.error("Error in formatDateTime:", e);
    return { date: "Error", time: "Error" };
  }
};


// Ensure this function exists and is exported
export const formatDdMmYyyyHhMmSs = (
  isoString: string | null | undefined // This function expects a string
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


// ... (renderStatusBadge - keep as corrected before) ...
export const renderStatusBadge = (
  status: string | undefined | null,
  type?: "account" | "merchant" | "transaction" | "pending"
): React.ReactElement => {
  // ... (implementation from previous corrected version)
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let text = status || "Unknown";
  text = text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const lowerCaseStatus = status?.toLowerCase();
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
        case "pending_approval":
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
    default: 
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


// RENAMED BACK TO tuncateUUID to match existing imports
export const tuncateUUID = (uuid: string | null | undefined, first = 8, last = 4): string => {
  if (!uuid) return "N/A";
  if (uuid.length <= first + last + 3) return uuid; 
  return `${uuid.substring(0, first)}...${uuid.substring(uuid.length - last)}`;
};