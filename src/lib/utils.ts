// src/lib/utils.ts
import React from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a fallback ID for accounts - ENSURE THIS IS EXPORTED
export function generateFallbackId(): string {
  const year = new Date().getFullYear().toString();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STC-${year}-${randomChars}`;
}

export const formatCurrency = (
  amount: number | string | undefined | null,
  currency: string = "THB",
  locale: string = "en-US"
): string => {
  let numAmount: number;

  if (typeof amount === 'string') {
    numAmount = parseFloat(amount);
  } else if (typeof amount === 'number') {
    numAmount = amount;
  } else {
    numAmount = NaN; 
  }

  if (isNaN(numAmount)) {
    return "฿ -.--"; 
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(numAmount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency} ${numAmount.toFixed(2)}`; 
  }
};

export const formatDate = (
  dateInput: string | Date | null | undefined,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return "N/A";

  try {
    const dateObject =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      
    if (isNaN(dateObject.getTime())) {
      console.warn("Invalid date provided to formatDate:", dateInput);
      return "Invalid Date";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short", 
      day: "numeric",
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObject);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

export const formatDdMmYyyy = (
  dateInput: string | Date | null | undefined
): string => {
  if (!dateInput) return "N/A";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
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

export const formatTime = (
  dateInput: string | Date | null | undefined
): string => {
  if (!dateInput) return "N/A";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "Invalid Time";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error("Error in formatTime:", e);
    return "Invalid Time";
  }
};

export const formatDdMmYyyyHhMmSs = (
  dateTimeInput: string | Date | null | undefined
): string => {
  if (!dateTimeInput) return "N/A";
  try {
    const date = typeof dateTimeInput === "string" ? new Date(dateTimeInput) : dateTimeInput;
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Error formatting date/time in formatDdMmYyyyHhMmSs:", e);
    return "Invalid Date/Time";
  }
};

export const formatDateTime = (
  dateTimeInput: string | Date | null | undefined,
  locale: string = "en-US"
): { date: string; time: string } => {
  if (!dateTimeInput) return { date: "N/A", time: "N/A" };
  try {
    const dateObj =
      typeof dateTimeInput === "string"
        ? new Date(dateTimeInput)
        : dateTimeInput;

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date provided to formatDateTime:", dateTimeInput);
      return { date: "Invalid Date", time: "Invalid Time" };
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric", 
      minute: "2-digit",
      hour12: true, 
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
  let textToDisplay = status || "Unknown";
  textToDisplay = textToDisplay.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const lowerCaseStatus = status?.toLowerCase();

  switch (type) {
    case "account":
      switch (lowerCaseStatus) {
        case "active": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "inactive": bgColor = "bg-gray-100"; textColor = "text-gray-600"; break;
        case "rejected": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
        case "suspended": bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; break;
        case "pending": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        default: break;
      }
      break;
    case "merchant":
      switch (lowerCaseStatus) {
        case "active": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "pending_approval": 
        case "pending": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        case "suspended": bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; break;
        case "rejected": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
        default: break;
      }
      break;
    case "transaction":
      switch (lowerCaseStatus) {
        case "completed": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "pending": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        case "failed": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
        case "declined": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
        default: break;
      }
      break;
    default: 
      switch (lowerCaseStatus) {
        case "active": case "completed": case "approved": bgColor = "bg-green-100"; textColor = "text-green-800"; break;
        case "inactive": bgColor = "bg-gray-100"; textColor = "text-gray-600"; break;
        case "pending": case "pending_approval": bgColor = "bg-blue-100"; textColor = "text-blue-800"; break;
        case "suspended": bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; break;
        case "failed": case "declined": case "rejected": bgColor = "bg-red-100"; textColor = "text-red-800"; break;
        default: break;
      }
      break;
  }
  return React.createElement(
    "span",
    {
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`,
    },
    textToDisplay
  );
};

export const tuncateUUID = (uuid: string | null | undefined, first = 8, last = 4): string => {
  if (!uuid) return "N/A";
  if (uuid.length <= first + last + 3) {
    return uuid; 
  }
  return `${uuid.substring(0, first)}...${uuid.substring(uuid.length - last)}`;
};