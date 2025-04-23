// src/lib/utils.ts
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
 * @param type - The type of status ('account', 'merchant', 'transaction', etc.) to determine styling.
 * @returns A JSX element representing the badge.
 */
export const renderStatusBadge = (
    status: string | undefined | null,
    type: 'account' | 'merchant' | 'transaction' | 'pending'
): React.ReactElement => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    let text = status || 'Unknown';
    text = text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format text

    switch (type) {
        case 'account':
            switch (status?.toLowerCase()) {
                case 'active':
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                    break;
                case 'inactive':
                case 'rejected':
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    break;
                case 'suspended':
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-yellow-800';
                    break;
                case 'pending':
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-800';
                    break;
            }
            break;
        case 'merchant':
             switch (status?.toLowerCase()) {
                case 'active':
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                    break;
                case 'pending_approval':
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-800';
                    break;
                 case 'suspended':
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-yellow-800';
                    break;
                 case 'rejected':
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    break;
            }
            break;
        case 'transaction':
             switch (status?.toLowerCase()) {
                case 'approved':
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                    break;
                case 'declined':
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    break;
            }
            break;
        case 'pending': // Generic pending status
             switch (status?.toLowerCase()) {
                case 'pending':
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-800';
                    break;
                case 'approved':
                     bgColor = 'bg-green-100';
                     textColor = 'text-green-800';
                     break;
                 case 'rejected':
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    break;
            }
            break;
    }

    return React.createElement(
        'span',
        {
            className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`
        },
        text
    );
};

// You can add other utility functions here as needed.