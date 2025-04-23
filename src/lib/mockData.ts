// src/lib/mockData.ts
// FIXED: Corrected getDateString calls to match function signature.
// FIXED: Explicitly typed adminActivityLog array to satisfy targetType union.

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
    guardianName: string;
    childName: string;
    balance: number;
    status: 'Active' | 'Inactive' | 'Suspended';
    createdAt: string;
    lastActivity: string;
    updatedAt?: string; // Optional date of last status change/update
    pin?: string;
    qrCodeUrl?: string;
    guardianDob?: string;
    guardianContact?: string;
    address?: string;
}

// --- Merchant Interface & Status Type ---
export type MerchantStatus = 'Pending' | 'Active' | 'Suspended' | 'Rejected';

export interface Merchant {
    id: string;
    name: string;
    location: string;
    category: string;
    status: MerchantStatus;
    submittedAt: string;
    updatedAt?: string;
    contactEmail?: string;
}

// --- Transaction Interface ---
export interface Transaction {
    id: string;
    accountId: string;
    merchantId?: string;
    type: 'Credit' | 'Debit' | 'Adjustment';
    amount: number;
    timestamp: string;
    description: string;
    status: 'Completed' | 'Pending' | 'Failed' | 'Declined';
    declineReason?: string;
}

// --- AdminLog Interface ---
export interface AdminLog {
    id: string;
    timestamp: string;
    adminUsername: string;
    action: string;
    targetId?: string;
    // Correct type definition for targetType
    targetType?: 'Account' | 'Merchant' | 'Registration' | 'Transaction' | 'System';
    details?: string;
}

// --- PendingRegistration Interface ---
export interface PendingRegistration {
    id: string;
    guardianName: string;
    guardianDob: string;
    guardianContact: string;
    address: string;
    childName: string;
    pin: string;
    submittedAt: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    submissionLanguage?: 'en' | 'th';
}

// --- AppData Interface ---
export interface AppData {
    accounts: Account[];
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[]; // Expects AdminLog array
    pendingRegistrations: PendingRegistration[];
    admins: AdminUser[];
}

// --- Helper Functions ---
const generateMockQrCodeUrl = (accountId: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`account-id:${accountId}`)}`;
};

// FIXED: Function definition only takes offsetDays
const getDateString = (offsetDays: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    // Keep random time generation within the function
    const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    // Construct ISO string manually to include random time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}


// --- Mock Data Instance ---
const mockDataInstance: AppData = {
    admins: [
        { id: 'ADM-001', email: 'admin@example.com', passwordHash: 'password', name: 'Default Admin', role: 'Admin', isActive: true, createdAt: '2023-01-01T00:00:00Z', },
        { id: 'ADM-002', email: 'supervisor@example.com', passwordHash: 'password123', name: 'Jane Supervisor', role: 'Supervisor', isActive: true, createdAt: '2023-02-01T00:00:00Z', },
        { id: 'ADM-003', email: 'inactive@example.com', passwordHash: 'test', name: 'Inactive User', role: 'Admin', isActive: false, createdAt: '2023-03-01T00:00:00Z', },
    ],
    accounts: [
        { id: 'ACC-001', guardianName: 'Alice Wonderland', childName: 'Caterpillar Jr.', balance: 150.75, status: 'Active', createdAt: '2023-01-15T10:30:00Z', lastActivity: '2024-03-10T14:00:00Z', updatedAt: '2023-01-15T10:30:00Z', pin: '1234', qrCodeUrl: generateMockQrCodeUrl('ACC-001'), guardianDob: '1985-05-20', guardianContact: '555-1234', address: '123 Rabbit Hole Lane, Wonderland', },
        { id: 'ACC-002', guardianName: 'Bob The Builder', childName: 'Wendy Tool', balance: 320.00, status: 'Active', createdAt: '2023-02-20T09:00:00Z', lastActivity: '2024-03-11T11:25:00Z', updatedAt: '2023-02-20T09:00:00Z', pin: '5678', qrCodeUrl: generateMockQrCodeUrl('ACC-002'), guardianDob: '1978-11-30', guardianContact: '555-5678', address: '456 Construction Way, Builderville', },
        { id: 'ACC-003', guardianName: 'Charlie Chaplin', childName: 'Little Tramp', balance: 0.00, status: 'Inactive', createdAt: '2023-03-01T11:00:00Z', lastActivity: '2023-09-01T11:00:00Z', updatedAt: '2023-09-01T11:00:00Z', pin: '9012', qrCodeUrl: generateMockQrCodeUrl('ACC-003'), guardianDob: '1980-01-01', guardianContact: '555-9012', address: '789 Silent Film St, Hollywood', },
        { id: 'ACC-004', guardianName: 'Diana Prince', childName: 'Steve Trevor Jr.', balance: 500.50, status: 'Active', createdAt: '2023-04-10T08:15:00Z', lastActivity: '2024-03-09T16:45:00Z', updatedAt: '2023-04-10T08:15:00Z', pin: '3456', qrCodeUrl: generateMockQrCodeUrl('ACC-004'), guardianDob: '1975-03-08', guardianContact: '555-3456', address: '1 Wonder Way, Themyscira', },
        { id: 'ACC-005', guardianName: 'Ethan Hunt', childName: 'Benji Dunn', balance: 10.00, status: 'Suspended', createdAt: '2023-05-22T13:00:00Z', lastActivity: '2024-01-15T10:00:00Z', updatedAt: '2024-03-12T16:00:00Z', pin: '7890', qrCodeUrl: generateMockQrCodeUrl('ACC-005'), guardianDob: '1982-07-18', guardianContact: '555-7890', address: '1 Impossible Mission Ln, Langley', }
    ],
    merchants: [
        { id: 'MER-001', name: 'General Groceries', location: 'Main Street Plaza', category: 'Groceries', status: 'Active', submittedAt: '2022-11-01T00:00:00Z', contactEmail: 'groceries@example.com', updatedAt: '2022-11-01T00:00:00Z', },
        { id: 'MER-002', name: 'School Supply Station', location: 'Near Central School', category: 'School Supplies', status: 'Active', submittedAt: '2023-01-10T00:00:00Z', contactEmail: 'supplies@example.com', updatedAt: '2023-01-10T00:00:00Z', },
        { id: 'MER-003', name: 'Healthy Habits Clinic', location: 'Community Health Center', category: 'Healthcare', status: 'Active', submittedAt: '2023-03-15T00:00:00Z', contactEmail: 'clinic@example.com', updatedAt: '2023-03-15T00:00:00Z', },
        { id: 'MER-004', name: 'Corner Store', location: 'Oak Street Corner', category: 'Groceries', status: 'Active', submittedAt: '2022-12-01T00:00:00Z', contactEmail: 'corner@example.com', updatedAt: '2023-05-20T10:00:00Z', },
        { id: 'MER-P01', name: 'New Book Nook', location: '12 River Road', category: 'Books', status: 'Pending', submittedAt: '2024-03-12T09:30:00Z', contactEmail: 'books@example.net', },
        { id: 'MER-P02', name: 'Artisan Cafe', location: '45 Creative Lane', category: 'Cafe', status: 'Pending', submittedAt: '2024-03-13T11:00:00Z', contactEmail: 'cafe.art@example.org', },
        { id: 'MER-005', name: 'Old Tech Shop', location: 'Basement Circuit', category: 'Electronics', status: 'Suspended', submittedAt: '2022-08-01T00:00:00Z', contactEmail: 'oldtech@example.com', updatedAt: '2024-02-01T14:00:00Z', },
    ],
    transactions: [
       { id: 'TX-2024-0001', accountId: 'ACC-001', merchantId: 'MER-001', type: 'Debit', amount: 50.25, timestamp: '2024-03-10T14:00:00Z', description: 'Grocery purchase', status: 'Completed', },
       { id: 'TX-2024-0002', accountId: 'ACC-002', merchantId: 'MER-002', type: 'Debit', amount: 25.00, timestamp: '2024-03-11T11:25:00Z', description: 'Notebooks and pens', status: 'Completed', },
       { id: 'TX-2024-0003', accountId: 'ACC-001', type: 'Credit', amount: 100.00, timestamp: '2024-03-01T09:00:00Z', description: 'Monthly Top-up', status: 'Completed', },
       { id: 'TX-2024-0004', accountId: 'ACC-004', merchantId: 'MER-003', type: 'Debit', amount: 75.00, timestamp: '2024-03-09T16:45:00Z', description: 'Clinic Visit Co-pay', status: 'Completed', },
       { id: 'TX-2024-0005', accountId: 'ACC-002', merchantId: 'MER-001', type: 'Debit', amount: 15.50, timestamp: '2024-03-12T10:00:00Z', description: 'Snacks', status: 'Pending', },
       { id: 'TX-2024-0006', accountId: 'ACC-005', merchantId: 'MER-001', type: 'Debit', amount: 30.00, timestamp: '2024-03-12T11:00:00Z', description: 'Attempted grocery purchase', status: 'Failed', declineReason: 'Account Suspended', },
       { id: 'TX-2024-0007', accountId: 'ACC-001', merchantId: 'MER-004', type: 'Debit', amount: 12.00, timestamp: '2024-03-12T12:00:00Z', description: 'Beverage purchase', status: 'Completed', declineReason: undefined, },
       { id: 'TX-2024-0008', accountId: 'ACC-002', type: 'Adjustment', amount: -10.00, timestamp: '2024-03-12T15:00:00Z', description: 'Admin correction for previous error', status: 'Completed', },
    ],
    // FIXED: Explicitly type the array as AdminLog[] and use correct getDateString calls
    adminActivityLog: [
        { id: uuidv4(), timestamp: getDateString(-2), adminUsername: 'admin@example.com', action: 'Login Success', targetType: 'System'},
        { id: uuidv4(), timestamp: getDateString(-1), adminUsername: 'supervisor@example.com', action: 'Login Success', targetType: 'System' },
        { id: uuidv4(), timestamp: getDateString(-1), adminUsername: 'admin@example.com', action: 'Viewed Account Details', targetType: 'Account', targetId: 'ACC-001', details: 'Accessed details page for Alice Wonderland.' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Approved Merchant Application', targetType: 'Merchant', targetId: 'MER-P01', details: 'Approved merchant: New Book Nook' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'supervisor@example.com', action: 'Suspended Merchant', targetType: 'Merchant', targetId: 'MER-002', details: 'Suspended merchant: School Supply Station due to terms violation.' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Rejected Registration', targetType: 'Registration', targetId: 'PEN-1700000000000-abc12', details: 'Rejected registration for Fiona Shrek: Incomplete documentation.' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Updated Account Balance', targetType: 'Account', targetId: 'ACC-002', details: 'Manually adjusted balance for Bob The Builder by +$50.00.' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'supervisor@example.com', action: 'Reactivated Merchant', targetType: 'Merchant', targetId: 'MER-005', details: 'Reactivated merchant: Old Tech Shop after review.' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Performed Transaction Adjustment', targetType: 'Transaction', targetId: 'TX-2024-0008', details: 'Corrected amount for TX-2024-0005, reduced balance by 10.00', },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'supervisor@example.com', action: 'Updated Account Status', targetType: 'Account', targetId: 'ACC-005', details: 'Changed status from Active to Suspended due to policy violation.', },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Viewed Merchant Details', targetType: 'Merchant', targetId: 'MER-001', details: 'Viewed details for General Groceries.'},
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Approved Registration', targetType: 'Registration', targetId: 'PEN-1710000000000-def34', details: 'Approved registration for สมชาย ใจดี. New account created.'},
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'admin@example.com', action: 'Logout', targetType: 'System' },
        { id: uuidv4(), timestamp: getDateString(0), adminUsername: 'supervisor@example.com', action: 'Failed Login Attempt', targetType: 'System', details: 'Incorrect password entered for supervisor@example.com' },
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as AdminLog[], // Assert type here after sort
    pendingRegistrations: [
        { id: 'PEN-1700000000000-abc12', guardianName: 'Fiona Shrek', guardianDob: '1988-08-15', guardianContact: '555-1111', address: 'The Swamp, Far Far Away', childName: 'Fergus Ogre', pin: '1111', submittedAt: '2024-03-10T08:00:00Z', status: 'Pending', submissionLanguage: 'en', },
        { id: 'PEN-1710000000000-def34', guardianName: 'สมชาย ใจดี', guardianDob: '1990-02-20', guardianContact: '081-234-5678', address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110', childName: 'สมหญิง ตามมา', pin: '2222', submittedAt: '2024-03-11T10:30:00Z', status: 'Pending', submissionLanguage: 'th', },
    ],
};

export default mockDataInstance;