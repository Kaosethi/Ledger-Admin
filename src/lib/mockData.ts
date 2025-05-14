// src/lib/mockData.ts
// MODIFIED: Aligned MerchantStatus and Merchant interface with backend schema.

import { v4 as uuidv4 } from 'uuid';

// --- Admin User Interface ---
export interface AdminUser {
    id: string;
    email: string;
    passwordHash: string; // In a real app, this would not be in mock data sent to client
    name: string;
    role: 'Admin' | 'Supervisor';
    isActive: boolean;
    createdAt: string; // ISO Date String
}

// --- Account Interface ---
export interface Account {
    id: string;
    displayId: string;
    guardianName: string;
    childName: string;
    balance: number;
    status: 'Active' | 'Inactive' | 'Suspended'; // Keep as is if this enum is different for accounts
    createdAt: string; // ISO Date String
    lastActivity: string; // ISO Date String
    updatedAt?: string; // ISO Date String
    pin?: string; // In a real app, raw PIN would not be stored or mocked like this
    guardianDob?: string; // e.g., "YYYY-MM-DD"
    guardianContact?: string;
    address?: string;
    currentQrToken?: string;
}

// --- Merchant Interface & Status Type (ALIGNED WITH BACKEND) ---
// These values MUST match your Drizzle `merchantStatusEnum`
export type BackendMerchantStatus = 
  | "pending_approval"
  | "active"
  | "rejected"
  | "suspended";

// This interface should now reflect the fields your backend's /api/merchants GET might return
// AND how you want to structure your mock data.
export interface MockMerchant { // Renamed to MockMerchant to differentiate if needed, or keep as Merchant
    id: string;                     // uuid
    businessName: string;           // Corresponds to 'name' in your original mock, maps to 'business_name' from backend
    contactEmail?: string | null;
    storeAddress?: string | null;    // Corresponds to 'location' in your original mock
    category?: string | null;
    status: BackendMerchantStatus;  // Use the aligned status type
    submittedAt: string;            // ISO Date String
    updatedAt?: string;              // ISO Date String
    // Add other fields from your Drizzle 'merchants' schema that you want to mock
    contactPerson?: string | null;
    contactPhone?: string | null;
    // hashedPassword should NOT be part of data sent to client
    declineReason?: string | null;
    pinVerified?: boolean | null;
    website?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    createdAt?: string; // Usually provided by DB
}

// --- Transaction Interface ---
// This should align with what your /api/transactions might return
export interface Transaction {
    id: string;
    accountId: string;
    merchantId?: string | null; // Can be null based on your schema
    type: 'Credit' | 'Debit' | 'Adjustment'; // Should match backend transactionTypeEnum
    amount: number; // Or string if your API returns numeric as string
    timestamp: string; // ISO Date String
    description?: string | null;
    status: 'Completed' | 'Pending' | 'Failed' | 'Declined'; // Should match backend transactionStatusEnum
    declineReason?: string | null;
}

// --- AdminLog Interface ---
export interface AdminLog {
    id: string;
    timestamp: string; // ISO Date String
    adminUsername: string; // Or adminId/adminEmail
    action: string;
    targetId?: string;
    targetType?: 'Account' | 'Merchant' | 'Registration' | 'Transaction' | 'System';
    details?: string;
}

// --- PendingRegistration Interface ---
export interface PendingRegistration {
    id: string;
    displayId: string;
    guardianName: string;
    guardianDob: string; // "YYYY-MM-DD"
    guardianContact: string;
    address: string;
    childName: string;
    pin: string; // Raw PIN, for mock purposes only
    createdAt: string; // ISO Date String
    status: 'Pending' | 'Approved' | 'Rejected'; // This seems like a separate status enum
    submissionLanguage?: 'en' | 'th';
}

// --- AppData Interface ---
export interface AppData {
    accounts: Account[];
    merchants: MockMerchant[]; // Use the aligned MockMerchant type
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
    pendingRegistrations: PendingRegistration[];
    admins: AdminUser[];
}

// --- Helper Functions ---
const generateMockQrCodeUrl = (accountId: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`account-id:${accountId}`)}`;
};

const getDateString = (offsetDays: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

// --- Mock Data Instance ---
const mockDataInstance: AppData = {
    admins: [
        // ... your admin data ...
        { id: 'ADM-001', email: 'admin@example.com', passwordHash: 'password', name: 'Default Admin', role: 'Admin', isActive: true, createdAt: '2023-01-01T00:00:00Z', },
    ],
    accounts: [
        // ... your account data ...
        { id: 'ACC-001', displayId: 'ACC-001', guardianName: 'Alice Wonderland', childName: 'Caterpillar Jr.', balance: 150.75, status: 'Active', createdAt: '2023-01-15T10:30:00Z', lastActivity: '2024-03-10T14:00:00Z', updatedAt: '2023-01-15T10:30:00Z', pin: '1234', currentQrToken: generateMockQrCodeUrl('ACC-001'), guardianDob: '1985-05-20', guardianContact: '555-1234', address: '123 Rabbit Hole Lane, Wonderland', },
    ],
    // MODIFIED: merchants array now uses MockMerchant type and aligned field names/statuses
    merchants: [
        { id: 'MER-001', businessName: 'General Groceries', storeAddress: 'Main Street Plaza', category: 'Groceries', status: 'active', submittedAt: '2022-11-01T00:00:00Z', contactEmail: 'groceries@example.com', updatedAt: '2022-11-01T00:00:00Z', createdAt: '2022-11-01T00:00:00Z' },
        { id: 'MER-002', businessName: 'School Supply Station', storeAddress: 'Near Central School', category: 'School Supplies', status: 'active', submittedAt: '2023-01-10T00:00:00Z', contactEmail: 'supplies@example.com', updatedAt: '2023-01-10T00:00:00Z', createdAt: '2023-01-10T00:00:00Z' },
        { id: 'MER-003', businessName: 'Healthy Habits Clinic', storeAddress: 'Community Health Center', category: 'Healthcare', status: 'active', submittedAt: '2023-03-15T00:00:00Z', contactEmail: 'clinic@example.com', updatedAt: '2023-03-15T00:00:00Z', createdAt: '2023-03-15T00:00:00Z' },
        { id: 'MER-004', businessName: 'Corner Store', storeAddress: 'Oak Street Corner', category: 'Groceries', status: 'active', submittedAt: '2022-12-01T00:00:00Z', contactEmail: 'corner@example.com', updatedAt: '2023-05-20T10:00:00Z', createdAt: '2022-12-01T00:00:00Z' },
        { id: 'MER-P01', businessName: 'New Book Nook', storeAddress: '12 River Road', category: 'Books', status: 'pending_approval', submittedAt: '2024-03-12T09:30:00Z', contactEmail: 'books@example.net', createdAt: '2024-03-12T09:30:00Z' },
        { id: 'MER-P02', businessName: 'Artisan Cafe', storeAddress: '45 Creative Lane', category: 'Cafe', status: 'pending_approval', submittedAt: '2024-03-13T11:00:00Z', contactEmail: 'cafe.art@example.org', createdAt: '2024-03-13T11:00:00Z' },
        { id: 'MER-005', businessName: 'Old Tech Shop', storeAddress: 'Basement Circuit', category: 'Electronics', status: 'suspended', submittedAt: '2022-08-01T00:00:00Z', contactEmail: 'oldtech@example.com', updatedAt: '2024-02-01T14:00:00Z', createdAt: '2022-08-01T00:00:00Z' },
    ],
    transactions: [
        // ... your transaction data, ensure fields match Transaction interface above ...
       { id: 'TX-2024-0001', accountId: 'ACC-001', merchantId: 'MER-001', type: 'Debit', amount: 50.25, timestamp: '2024-03-10T14:00:00Z', description: 'Grocery purchase', status: 'Completed', },
    ],
    adminActivityLog: [
        // ... your admin log data ...
        { id: uuidv4(), timestamp: getDateString(-2), adminUsername: 'admin@example.com', action: 'Login Success', targetType: 'System'},
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as AdminLog[],
    pendingRegistrations: [
        // ... your pending registration data ...
        { id: 'PEN-1700000000000-abc12', displayId: 'PEN-1700000000000-abc12', guardianName: 'Fiona Shrek', guardianDob: '1988-08-15', guardianContact: '555-1111', address: 'The Swamp, Far Far Away', childName: 'Fergus Ogre', pin: '1111', createdAt: '2024-03-10T08:00:00Z', status: 'Pending', submissionLanguage: 'en', },
    ],
};

export default mockDataInstance;