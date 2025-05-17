// src/lib/mockData.ts
import { v4 as uuidv4 } from 'uuid';

// --- Helper Functions ---
// getDateObject will be the primary helper for Date fields
const getDateObject = (offsetDays: number = 0, sameTimeAsOffsetRoot: boolean = false): Date => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    if (!sameTimeAsOffsetRoot) {
        // Add some randomness to time for more varied mock data
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        date.setSeconds(Math.floor(Math.random() * 60));
        date.setMilliseconds(Math.floor(Math.random() * 1000));
    }
    return date;
};

// getDateString might still be useful if some legacy part expects ISO strings directly,
// but for new data and interfaces, Date objects are preferred.
const getDateString = (offsetDays: number = 0): string => {
    return getDateObject(offsetDays).toISOString();
};

const generateMockQrCodeUrl = (accountId: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`account-id:${accountId}`)}`;
};


// --- Admin User Interface ---
export interface AdminUser {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'Admin' | 'Supervisor';
    isActive: boolean;
    createdAt: Date; // MODIFIED
}

// --- Account Interface ---
export interface Account {
    id: string;
    displayId: string;
    guardianName: string;
    childName: string;
    balance: number; // Consider string if aligning with Drizzle numeric which often comes as string
    status: 'Active' | 'Inactive' | 'Suspended';
    createdAt: Date; // MODIFIED
    lastActivity: Date; // MODIFIED
    updatedAt?: Date; // MODIFIED
    pin?: string;
    guardianDob?: string; // Could also be Date if you parse/store it that way
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

export interface Merchant { 
    id: string;
    businessName: string;
    contactEmail?: string | null;
    storeAddress?: string | null;
    category?: string | null;
    status: BackendMerchantStatus;
    submittedAt: Date; // MODIFIED
    updatedAt?: Date; // MODIFIED
    contactPerson?: string | null;
    contactPhone?: string | null;
    declineReason?: string | null;
    pinVerified?: boolean | null;
    website?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    createdAt?: Date; // MODIFIED
}

// --- Transaction Interface (RICH VERSION) ---
export interface Transaction {
    id: string; 
    paymentId: string; 
    accountId: string;
    merchantId?: string | null;
    type: "Debit" | "Credit" | "Adjustment";
    amount: string; 
    timestamp: Date; 
    description?: string | null;
    status: "Pending" | "Completed" | "Failed" | "Declined";
    declineReason?: string | null;
    createdAt: Date; 
    updatedAt: Date; 
    pinVerified: boolean | null;
    metadata: string | null; 
    reference?: string | null;
}

// --- AdminLog Interface ---
export interface AdminLog {
    id: string;
    timestamp: Date; // MODIFIED
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
    guardianDob: string; // Could be Date if parsed
    guardianContact: string;
    address: string;
    childName: string;
    pin: string;
    createdAt: Date; // MODIFIED
    status: 'Pending' | 'Approved' | 'Rejected';
    submissionLanguage?: 'en' | 'th';
}

// --- AppData Interface ---
export interface AppData {
    accounts: Account[];
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
    pendingRegistrations: PendingRegistration[];
    admins: AdminUser[];
}

// --- Mock Data Instance ---
const mockDataInstance: AppData = {
    admins: [
        { 
            id: 'ADM-001', 
            email: 'admin@example.com', 
            passwordHash: 'password123', // Changed from 'password' for slight security realism
            name: 'Default Admin', 
            role: 'Admin', 
            isActive: true, 
            createdAt: getDateObject(-365) // MODIFIED
        },
    ],
    accounts: [
        { 
            id: 'ACC-001', 
            displayId: 'STC-2025-685V', 
            guardianName: 'Alice Wonderland', 
            childName: 'Caterpillar Jr.', 
            balance: 150.75, 
            status: 'Active', 
            createdAt: getDateObject(-60), // MODIFIED
            lastActivity: getDateObject(-1), // MODIFIED
            updatedAt: getDateObject(-5), // MODIFIED
            pin: '1234', 
            currentQrToken: generateMockQrCodeUrl('ACC-001'), 
            guardianDob: '1985-05-20', 
            guardianContact: '555-1234', 
            address: '123 Rabbit Hole Lane, Wonderland', 
        },
        { 
            id: 'ACC-002', 
            displayId: 'STC-2025-C5XU', 
            guardianName: 'Bob The Builder', 
            childName: 'Wendy Tool', 
            balance: 300.00, 
            status: 'Active', 
            createdAt: getDateObject(-90), // MODIFIED
            lastActivity: getDateObject(-2), // MODIFIED
            updatedAt: getDateObject(-2), // MODIFIED
            pin: '5678', 
            currentQrToken: generateMockQrCodeUrl('ACC-002'),
            guardianDob: '1975-03-10', 
            guardianContact: '555-5678', 
            address: '456 Fixit Felix St, Builderville', 
        },
         { 
            id: 'ACC-003', 
            displayId: 'a4141f11...2424', // Example from image 
            guardianName: 'Mad Hatter', 
            childName: 'N/A', // Example from image where Child Name is N/A
            balance: 0.00, 
            status: 'Suspended', 
            createdAt: getDateObject(-120), // MODIFIED
            lastActivity: getDateObject(-10), // MODIFIED
            updatedAt: getDateObject(-10), // MODIFIED
            pin: '0000', 
            guardianDob: '1960-01-01', 
            guardianContact: '555-0000', 
            address: 'Tea Party Table, Wonderland', 
        },
    ],
    merchants: [
        { 
            id: 'MER-001', // 8f2be1ef...8b84 in image
            businessName: 'The Testy Teapot', // From image
            storeAddress: 'Main Street Plaza', 
            category: 'Groceries', 
            status: 'active', 
            submittedAt: getDateObject(-100), // MODIFIED
            contactEmail: 'teapot@example.com', 
            updatedAt: getDateObject(-90), // MODIFIED
            createdAt: getDateObject(-100) // MODIFIED
        },
        { 
            id: 'MER-002', 
            businessName: 'School Supply Station', 
            storeAddress: 'Near Central School', 
            category: 'School Supplies', 
            status: 'active', 
            submittedAt: getDateObject(-80), // MODIFIED
            contactEmail: 'supplies@example.com', 
            updatedAt: getDateObject(-70), // MODIFIED
            createdAt: getDateObject(-80) // MODIFIED
        },
        { 
            id: 'MER-P01', 
            businessName: 'New Book Nook', 
            storeAddress: '12 River Road', 
            category: 'Books', 
            status: 'pending_approval', 
            submittedAt: getDateObject(-2), // MODIFIED
            contactEmail: 'books@example.net', 
            createdAt: getDateObject(-2) // MODIFIED
        },
    ],
    transactions: [ // Using data from your image for better testing
       { 
           id: 'tx_db_id_001', 
           paymentId: '1b6bfe81...1e82', 
           accountId: 'ACC-001', // STC-2025-685V
           merchantId: 'MER-001', // The Testy Teapot
           type: 'Debit', 
           amount: '50.75', 
           timestamp: getDateObject(0, true), // Assuming today, set time specifically if needed
           description: 'Purchase at The Testy Teapot', 
           status: 'Completed', 
           declineReason: null,
           createdAt: getDateObject(0, true), 
           updatedAt: getDateObject(0, true), 
           pinVerified: true, 
           metadata: null, 
           reference: null,
        },
        { 
           id: 'tx_db_id_002', 
           paymentId: '1b6bfe81...1e82', // Same payment ID? Could be split legs of one payment
           accountId: 'ACC-003', // a4141f11...2424
           merchantId: 'MER-001', 
           type: 'Credit', 
           amount: '50.75', 
           timestamp: getDateObject(0, true), 
           description: 'Credit from The Testy Teapot', 
           status: 'Completed', 
           declineReason: null,
           createdAt: getDateObject(0, true), 
           updatedAt: getDateObject(0, true), 
           pinVerified: null, 
           metadata: null, 
           reference: null,
        },
        { 
           id: 'tx_db_id_003', 
           paymentId: 'a0b49c57...a550', 
           accountId: 'ACC-002', // STC-2025-C5XU
           merchantId: 'MER-001', 
           type: 'Debit', 
           amount: '25.00', 
           timestamp: getDateObject(0, true), 
           description: 'Morning Coffee', 
           status: 'Completed', 
           declineReason: null,
           createdAt: getDateObject(0, true), 
           updatedAt: getDateObject(0, true), 
           pinVerified: true, 
           metadata: null, 
           reference: null,
        },
        { 
           id: 'tx_db_id_004', 
           paymentId: 'eae43ff8...e0ba', 
           accountId: 'ACC-001', 
           merchantId: 'MER-001', 
           type: 'Debit', 
           amount: '10.00', 
           timestamp: getDateObject(0, true), 
           description: 'Snack', 
           status: 'Failed', 
           declineReason: "Insufficient Funds",
           createdAt: getDateObject(0, true), 
           updatedAt: getDateObject(0, true), 
           pinVerified: false, 
           metadata: null, 
           reference: null,
        },
         // Add more transactions based on your image to ensure good test coverage
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) as Transaction[],
    adminActivityLog: [
        { 
            id: uuidv4(), 
            timestamp: getDateObject(-2), // MODIFIED
            adminUsername: 'admin@example.com', 
            action: 'Login Success', 
            targetType: 'System'
        },
        { 
            id: uuidv4(), 
            timestamp: getDateObject(-1), // MODIFIED
            adminUsername: 'admin@example.com', 
            action: 'View Account', 
            targetType: 'Account', 
            targetId: 'ACC-001', 
            details: 'Viewed details for ACC-001'
        },
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) as AdminLog[],
    pendingRegistrations: [
        { 
            id: 'PEN-1700000000000-abc12', 
            displayId: 'PEN-1700000000000-abc12', 
            guardianName: 'Fiona Shrek', 
            guardianDob: '1988-08-15', 
            guardianContact: '555-1111', 
            address: 'The Swamp, Far Far Away', 
            childName: 'Fergus Ogre', 
            pin: '1111', 
            createdAt: getDateObject(-3), // MODIFIED
            status: 'Pending', 
            submissionLanguage: 'en', 
        },
    ],
};

export default mockDataInstance;