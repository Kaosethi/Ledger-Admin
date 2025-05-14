// src/lib/mockData.ts
// MODIFIED: Renamed MockMerchant to Merchant and updated AppData to use it.

import { v4 as uuidv4 } from 'uuid';

// --- Admin User Interface ---
export interface AdminUser {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'Admin' | 'Supervisor';
    isActive: boolean;
    createdAt: string;
}

// --- Account Interface ---
export interface Account {
    id: string;
    displayId: string;
    guardianName: string;
    childName: string;
    balance: number;
    status: 'Active' | 'Inactive' | 'Suspended';
    createdAt: string;
    lastActivity: string;
    updatedAt?: string;
    pin?: string;
    guardianDob?: string;
    guardianContact?: string;
    address?: string;
    currentQrToken?: string;
}

// --- Merchant Interface & Status Type (ALIGNED WITH BACKEND) ---
export type BackendMerchantStatus = 
  | "pending_approval"
  | "active"
  | "rejected"
  | "suspended";

// MODIFIED: Renamed from MockMerchant to Merchant
// This interface reflects fields your backend's /api/merchants GET returns
export interface Merchant { 
    id: string;
    businessName: string;
    contactEmail?: string | null;
    storeAddress?: string | null;
    category?: string | null;
    status: BackendMerchantStatus;
    submittedAt: string;
    updatedAt?: string;
    contactPerson?: string | null;
    contactPhone?: string | null;
    declineReason?: string | null;
    pinVerified?: boolean | null;
    website?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    createdAt?: string;
}

// --- Transaction Interface ---
export interface Transaction {
    id: string;
    accountId: string;
    merchantId?: string | null;
    type: 'Credit' | 'Debit' | 'Adjustment';
    amount: number;
    timestamp: string;
    description?: string | null;
    status: 'Completed' | 'Pending' | 'Failed' | 'Declined';
    declineReason?: string | null;
}

// --- AdminLog Interface ---
export interface AdminLog {
    id: string;
    timestamp: string;
    adminUsername: string;
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
    guardianDob: string;
    guardianContact: string;
    address: string;
    childName: string;
    pin: string;
    createdAt: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    submissionLanguage?: 'en' | 'th';
}

// --- AppData Interface ---
export interface AppData {
    accounts: Account[];
    merchants: Merchant[]; // MODIFIED: Use the Merchant type
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
        { id: 'ADM-001', email: 'admin@example.com', passwordHash: 'password', name: 'Default Admin', role: 'Admin', isActive: true, createdAt: '2023-01-01T00:00:00Z', },
    ],
    accounts: [
        { id: 'ACC-001', displayId: 'ACC-001', guardianName: 'Alice Wonderland', childName: 'Caterpillar Jr.', balance: 150.75, status: 'Active', createdAt: '2023-01-15T10:30:00Z', lastActivity: '2024-03-10T14:00:00Z', updatedAt: '2023-01-15T10:30:00Z', pin: '1234', currentQrToken: generateMockQrCodeUrl('ACC-001'), guardianDob: '1985-05-20', guardianContact: '555-1234', address: '123 Rabbit Hole Lane, Wonderland', },
    ],
    // MODIFIED: Ensure merchant objects match the 'Merchant' interface structure
    merchants: [
        { id: 'MER-001', businessName: 'General Groceries', storeAddress: 'Main Street Plaza', category: 'Groceries', status: 'active', submittedAt: '2022-11-01T00:00:00Z', contactEmail: 'groceries@example.com', updatedAt: '2022-11-01T00:00:00Z', createdAt: '2022-11-01T00:00:00Z' },
        { id: 'MER-002', businessName: 'School Supply Station', storeAddress: 'Near Central School', category: 'School Supplies', status: 'active', submittedAt: '2023-01-10T00:00:00Z', contactEmail: 'supplies@example.com', updatedAt: '2023-01-10T00:00:00Z', createdAt: '2023-01-10T00:00:00Z' },
        { id: 'MER-P01', businessName: 'New Book Nook', storeAddress: '12 River Road', category: 'Books', status: 'pending_approval', submittedAt: '2024-03-12T09:30:00Z', contactEmail: 'books@example.net', createdAt: '2024-03-12T09:30:00Z' },
        // ... other merchant objects ...
    ],
    transactions: [
       { id: 'TX-2024-0001', accountId: 'ACC-001', merchantId: 'MER-001', type: 'Debit', amount: 50.25, timestamp: '2024-03-10T14:00:00Z', description: 'Grocery purchase', status: 'Completed', },
    ],
    adminActivityLog: [
        { id: uuidv4(), timestamp: getDateString(-2), adminUsername: 'admin@example.com', action: 'Login Success', targetType: 'System'},
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as AdminLog[],
    pendingRegistrations: [
        { id: 'PEN-1700000000000-abc12', displayId: 'PEN-1700000000000-abc12', guardianName: 'Fiona Shrek', guardianDob: '1988-08-15', guardianContact: '555-1111', address: 'The Swamp, Far Far Away', childName: 'Fergus Ogre', pin: '1111', createdAt: '2024-03-10T08:00:00Z', status: 'Pending', submissionLanguage: 'en', },
    ],
};

export default mockDataInstance;