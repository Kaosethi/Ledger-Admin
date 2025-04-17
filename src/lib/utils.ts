// src/lib/utils.ts

export function formatCurrency(amount: number | null | undefined): string {
    return '$' + (amount != null ? amount.toFixed(2) : '0.00');
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date'; // Check if date is valid
        // Format: DD/MM/YYYY HH:MM (24-hour)
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        console.error("formatDate Error:", e);
        return 'Date Error';
    }
}

export function getDateInputString(dateString: string | null | undefined): string | null {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null; // Check if date is valid
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } catch (e) {
        console.error("getDateInputString Error:", e);
        return null;
    }
}

// We will create StatusBadge as a component instead
// export function renderStatusBadge(status: string | null | undefined): string { ... }