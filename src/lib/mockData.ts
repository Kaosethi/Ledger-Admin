// src/lib/mockData.ts
// *** ONLY MODIFYING THE INTERFACE ***

import { v4 as uuidv4 } from 'uuid';

// Data Interfaces
export interface Account {
    id: string;
    guardianName: string;
    childName: string;
    balance: number;
    status: 'Active' | 'Inactive' | 'Suspended';
    createdAt: string; // ISO 8601 date string
    lastActivity: string; // ISO 8601 date string
    pin?: string; // Optional: Store securely (hashed) in real DB
    qrCodeUrl?: string; // URL to the generated QR code image
    // Optional fields based on pending registration
    guardianDob?: string;
    guardianContact?: string;
    address?: string;
}

export interface Merchant {
    id: string;
    name: string;
    location: string;
    category: string; // e.g., 'Groceries', 'School Supplies', 'Healthcare'
    isActive: boolean;
    joinedDate: string; // ISO 8601 date string
}

export interface Transaction {
    id: string;
    accountId: string;
    merchantId?: string; // Optional: Transactions might not involve a merchant (e.g., admin adjustment)
    type: 'Credit' | 'Debit' | 'Adjustment';
    amount: number;
    timestamp: string; // ISO 8601 date string
    description: string;
    status: 'Completed' | 'Pending' | 'Failed' | 'Declined'; // Added Declined
    declineReason?: string; // Optional reason for decline
}

export interface AdminLog {
    id: string;
    timestamp: string; // ISO 8601 date string
    adminUsername: string; // Or Admin ID
    action: string; // e.g., "Approved Registration", "Updated Account Status", "Rejected Transaction"
    targetId?: string; // ID of the account, transaction, merchant, etc. affected
    details?: string; // Optional additional details
}

export interface PendingRegistration {
    id: string;
    guardianName: string;
    guardianDob: string; // Store as string (YYYY-MM-DD) or Date
    guardianContact: string;
    address: string;
    childName: string;
    pin: string; // Store securely in a real app (e.g., hashed)
    submittedAt: string; // ISO 8601 date string
    status: 'Pending' | 'Approved' | 'Rejected'; // Add more statuses if needed
    submissionLanguage?: 'en' | 'th'; // ADDED: Track language used for submission
}


// Combined App Data Interface
export interface AppData {
    accounts: Account[];
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
    pendingRegistrations: PendingRegistration[];
}

// Function to generate mock QR code URLs (replace with actual generation/storage later)
const generateMockQrCodeUrl = (accountId: string): string => {
    // In a real app, this would involve generating a QR code image (e.g., using qrcode library)
    // and storing it, then returning the URL. For now, just a placeholder.
    // Using a placeholder image service that includes the ID in the URL for differentiation.
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`account-id:${accountId}`)}`;
};

// Mock Data Instance
const mockDataInstance: AppData = {
    accounts: [
        {
            id: 'ACC-001',
            guardianName: 'Alice Wonderland',
            childName: 'Caterpillar Jr.',
            balance: 150.75,
            status: 'Active',
            createdAt: '2023-01-15T10:30:00Z',
            lastActivity: '2024-03-10T14:00:00Z',
            pin: '1234', // Example - Hash in real DB
            qrCodeUrl: generateMockQrCodeUrl('ACC-001'),
            guardianDob: '1985-05-20',
            guardianContact: '555-1234',
            address: '123 Rabbit Hole Lane, Wonderland',
        },
        {
            id: 'ACC-002',
            guardianName: 'Bob The Builder',
            childName: 'Wendy Tool',
            balance: 320.00,
            status: 'Active',
            createdAt: '2023-02-20T09:00:00Z',
            lastActivity: '2024-03-11T11:25:00Z',
            pin: '5678',
            qrCodeUrl: generateMockQrCodeUrl('ACC-002'),
            guardianDob: '1978-11-30',
            guardianContact: '555-5678',
            address: '456 Construction Way, Builderville',
        },
        {
            id: 'ACC-003',
            guardianName: 'Charlie Chaplin',
            childName: 'Little Tramp',
            balance: 0.00,
            status: 'Inactive',
            createdAt: '2023-03-01T11:00:00Z',
            lastActivity: '2023-09-01T11:00:00Z',
            pin: '9012',
            qrCodeUrl: generateMockQrCodeUrl('ACC-003'),
            guardianDob: '1980-01-01',
            guardianContact: '555-9012',
            address: '789 Silent Film St, Hollywood',
        },
         {
            id: 'ACC-004',
            guardianName: 'Diana Prince',
            childName: 'Steve Trevor Jr.',
            balance: 500.50,
            status: 'Active',
            createdAt: '2023-04-10T08:15:00Z',
            lastActivity: '2024-03-09T16:45:00Z',
            pin: '3456',
            qrCodeUrl: generateMockQrCodeUrl('ACC-004'),
            guardianDob: '1975-03-08',
            guardianContact: '555-3456',
            address: '1 Wonder Way, Themyscira',
        },
         {
            id: 'ACC-005',
            guardianName: 'Ethan Hunt',
            childName: 'Benji Dunn', // Just for fun
            balance: 10.00,
            status: 'Suspended',
            createdAt: '2023-05-22T13:00:00Z',
            lastActivity: '2024-01-15T10:00:00Z',
            pin: '7890',
            qrCodeUrl: generateMockQrCodeUrl('ACC-005'),
            guardianDob: '1982-07-18',
            guardianContact: '555-7890',
            address: '1 Impossible Mission Ln, Langley',
        }
    ],
    merchants: [
        {
            id: 'MER-001',
            name: 'General Groceries',
            location: 'Main Street Plaza',
            category: 'Groceries',
            isActive: true,
            joinedDate: '2022-11-01T00:00:00Z',
        },
        {
            id: 'MER-002',
            name: 'School Supply Station',
            location: 'Near Central School',
            category: 'School Supplies',
            isActive: true,
            joinedDate: '2023-01-10T00:00:00Z',
        },
        {
            id: 'MER-003',
            name: 'Healthy Habits Clinic',
            location: 'Community Health Center',
            category: 'Healthcare',
            isActive: true,
            joinedDate: '2023-03-15T00:00:00Z',
        },
        {
            id: 'MER-004',
            name: 'Corner Store',
            location: 'Oak Street Corner',
            category: 'Groceries',
            isActive: false, // Example of inactive merchant
            joinedDate: '2022-12-01T00:00:00Z',
        },
    ],
    transactions: [
        {
            id: 'TX-2024-0001',
            accountId: 'ACC-001',
            merchantId: 'MER-001',
            type: 'Debit',
            amount: 50.25,
            timestamp: '2024-03-10T14:00:00Z',
            description: 'Grocery purchase',
            status: 'Completed',
        },
        {
            id: 'TX-2024-0002',
            accountId: 'ACC-002',
            merchantId: 'MER-002',
            type: 'Debit',
            amount: 25.00,
            timestamp: '2024-03-11T11:25:00Z',
            description: 'Notebooks and pens',
            status: 'Completed',
        },
        {
            id: 'TX-2024-0003',
            accountId: 'ACC-001',
            type: 'Credit', // Example Credit
            amount: 100.00,
            timestamp: '2024-03-01T09:00:00Z',
            description: 'Monthly Top-up',
            status: 'Completed',
        },
         {
            id: 'TX-2024-0004',
            accountId: 'ACC-004',
            merchantId: 'MER-003', // Corrected: Needs a valid merchantId
            type: 'Debit',
            amount: 75.00,
            timestamp: '2024-03-09T16:45:00Z',
            description: 'Clinic Visit Co-pay',
            status: 'Completed',
        },
        {
            id: 'TX-2024-0005',
            accountId: 'ACC-002',
            merchantId: 'MER-001',
            type: 'Debit',
            amount: 15.50,
            timestamp: '2024-03-12T10:00:00Z',
            description: 'Snacks',
            status: 'Pending', // Example Pending
        },
        {
            id: 'TX-2024-0006',
            accountId: 'ACC-005', // Suspended account
            merchantId: 'MER-001',
            type: 'Debit',
            amount: 30.00,
            timestamp: '2024-03-12T11:00:00Z',
            description: 'Attempted grocery purchase',
            status: 'Failed', // Example Failed
            declineReason: 'Account Suspended',
        },
         {
            id: 'TX-2024-0007',
            accountId: 'ACC-001',
            merchantId: 'MER-004', // Inactive Merchant
            type: 'Debit',
            amount: 12.00,
            timestamp: '2024-03-12T12:00:00Z',
            description: 'Beverage purchase',
            status: 'Declined', // Example Declined
            declineReason: 'Merchant Inactive',
        },
        {
            id: 'TX-2024-0008',
            accountId: 'ACC-002',
            type: 'Adjustment', // Example Adjustment
            amount: -10.00, // Negative for deduction
            timestamp: '2024-03-12T15:00:00Z',
            description: 'Admin correction for previous error',
            status: 'Completed',
        },
    ],
    adminActivityLog: [
        {
            id: uuidv4(),
            timestamp: '2024-03-11T09:00:00Z',
            adminUsername: 'admin_user',
            action: 'Logged In',
        },
        {
            id: uuidv4(),
            timestamp: '2024-03-12T15:00:10Z',
            adminUsername: 'admin_user',
            action: 'Performed Adjustment',
            targetId: 'TX-2024-0008',
            details: 'Corrected amount for TX-2024-0005, reduced balance by 10.00',
        },
         {
            id: uuidv4(),
            timestamp: '2024-03-12T16:00:00Z',
            adminUsername: 'supervisor_jane',
            action: 'Updated Account Status',
            targetId: 'ACC-005',
            details: 'Changed status from Active to Suspended due to policy violation.',
        }
    ],
    pendingRegistrations: [
        {
            id: 'PEN-1700000000000-abc12',
            guardianName: 'Fiona Shrek',
            guardianDob: '1988-08-15',
            guardianContact: '555-1111',
            address: 'The Swamp, Far Far Away',
            childName: 'Fergus Ogre',
            pin: '1111', // Store hashed
            submittedAt: '2024-03-10T08:00:00Z',
            status: 'Pending',
            submissionLanguage: 'en',
        },
        {
            id: 'PEN-1710000000000-def34',
            guardianName: 'สมชาย ใจดี', // Example Thai Name
            guardianDob: '1990-02-20',
            guardianContact: '081-234-5678',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110', // Example Thai Address
            childName: 'สมหญิง ตามมา', // Example Thai Name
            pin: '2222', // Store hashed
            submittedAt: '2024-03-11T10:30:00Z',
            status: 'Pending',
            submissionLanguage: 'th',
        },
    ],
};

export default mockDataInstance;