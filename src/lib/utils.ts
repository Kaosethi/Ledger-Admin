// src/lib/utils.ts
// MODIFIED: Updated renderStatusBadge to handle all transaction statuses

import React from 'react';

/**
 * Formats a number as currency (e.g., USD).
 * @param amount - The number to format.
 * @param currency - The currency code (default: 'USD').
 * @param locale - The locale string (default: 'en-US').
 * @returns The formatted currency string.
 */
export const formatCurrency = (
    amount: number | undefined | null,
    currency: string = 'USD',
    locale: string = 'en-US'
): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
        // Return a default or placeholder string for invalid input
        return '$ -.--'; // Or formatCurrency(0, currency, locale) for $0.00
    }
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch (error) {
        console.error("Error formatting currency:", error);
        // Fallback for safety
        return `${currency} ${amount.toFixed(2)}`;
    }
};

/**
 * Formats an ISO date string or Date object into a localized date string.
 * Handles null or undefined dates gracefully.
 * Example: '1/15/2023' or 'N/A'
 * @param dateInput - The date string (ISO format recommended) or Date object or null/undefined.
 * @param locale - The locale string (default: 'en-US').
 * @param options - Intl.DateTimeFormat options (optional).
 * @returns The formatted date string or 'N/A'.
 */
export const formatDate = (
    dateInput: string | Date | null | undefined,
    locale: string = 'en-US',
    options?: Intl.DateTimeFormatOptions
): string => {
    if (!dateInput) return "N/A";

    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            console.warn("Invalid date provided to formatDate:", dateInput);
            return "Invalid Date";
        }

        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            ...options, // User options override defaults
        };
        return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Error"; // Fallback
    }
};

/**
 * Formats an ISO date string into DD/MM/YYYY format.
 * @param isoString - The ISO date string.
 * @returns Formatted date string 'DD/MM/YYYY' or 'N/A'.
 */
export const formatDdMmYyyy = (isoString: string | null | undefined): string => {
    if (!isoString) return "N/A";
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("Error in formatDdMmYyyy:", e);
        return "Invalid Date";
    }
};

/**
 * Formats an ISO date string into HH:MM:SS format (24-hour).
 * @param isoString - The ISO date string.
 * @returns Formatted time string 'HH:MM:SS' or 'N/A'.
 */
export const formatTime = (isoString: string | null | undefined): string => {
    if (!isoString) return "N/A";
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    } catch (e) {
        console.error("Error in formatTime:", e);
        return "Invalid Time";
    }
};

/**
 * Formats an ISO date string into DD/MM/YYYY, HH:MM:SS format.
 * @param isoString - The ISO date string.
 * @returns Formatted date and time string or 'N/A'.
 */
export const formatDdMmYyyyHhMmSs = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Error formatting date/time:", e);
    return "Invalid Date";
  }
};


/**
 * Renders a status badge component based on the status string and type.
 * @param status - The status string (e.g., 'Active', 'pending_approval', 'Approved').
 * @param type - The type of status ('account', 'merchant', 'transaction', etc.) to determine styling. If omitted, uses generic coloring.
 * @returns A JSX element representing the badge.
 */
export const renderStatusBadge = (
    // MODIFIED: Made type optional for broader use, defaulting to generic styling
    status: string | undefined | null,
    type?: 'account' | 'merchant' | 'transaction' | 'pending'
): React.ReactElement => {
    let bgColor = 'bg-gray-100'; // Default background
    let textColor = 'text-gray-800'; // Default text color
    let text = status || 'Unknown'; // Use original status text unless null/undefined
    // Keep the formatting for potential snake_case inputs from other types
    text = text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const lowerCaseStatus = status?.toLowerCase();

    switch (type) {
        case 'account': // Keep account statuses as they were
            switch (lowerCaseStatus) {
                case 'active':
                    bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
                case 'inactive':
                case 'rejected': // Grouping inactive/rejected for account
                    bgColor = 'bg-gray-100'; textColor = 'text-gray-600'; break; // Use gray for inactive account
                case 'suspended':
                    bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
                case 'pending':
                    bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
            }
            break;
        case 'merchant': // Keep merchant statuses as they were, map isActive boolean if needed elsewhere
             switch (lowerCaseStatus) {
                case 'active': // Assuming 'Active' is passed if isActive is true
                    bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
                case 'inactive': // Assuming 'Inactive' is passed if isActive is false
                    bgColor = 'bg-gray-100'; textColor = 'text-gray-600'; break; // Gray for inactive merchant
                case 'pending_approval':
                    bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
                 case 'suspended':
                    bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
                 case 'rejected':
                    bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
            }
            break;
        case 'transaction':
             // MODIFIED: Handle specific transaction statuses
             switch (lowerCaseStatus) {
                case 'completed': // Use 'completed' to match data
                    bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
                case 'pending':
                    bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break; // Blue for pending
                case 'failed': // Red for failed
                    bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
                case 'declined': // Also red for declined
                    bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
            }
            break;
        case 'pending': // Generic pending registration/request status
             switch (lowerCaseStatus) {
                case 'pending':
                    bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
                case 'approved':
                     bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
                 case 'rejected':
                    bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
            }
            break;
        default: // Fallback / Generic coloring if type is not provided
             switch (lowerCaseStatus) {
                case 'active':
                case 'completed':
                case 'approved':
                    bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
                case 'inactive':
                    bgColor = 'bg-gray-100'; textColor = 'text-gray-600'; break;
                case 'pending':
                case 'pending_approval':
                    bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
                case 'suspended':
                    bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
                case 'failed':
                case 'declined':
                case 'rejected':
                    bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
             }
            break;

    }

    // Use createElement for simpler JSX construction without importing React explicitly everywhere
    return React.createElement(
        'span',
        {
            className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`
        },
        text // Use the original case status text for display
    );
};

// You can add other utility functions here as needed.