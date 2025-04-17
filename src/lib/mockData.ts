// src/lib/mockData.ts

// --- EXPORT INTERFACES ---  <<< Make sure 'export' is here!
export interface Account {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
  // Add other account properties as needed
}

export interface Merchant {
  id: string;
  businessName: string;
  contactEmail: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  // Add other merchant properties as needed
}

export interface Transaction {
  id: string;
  timestamp: string; // Or Date object
  type: string;
  amount: number;
  accountId?: string; // Link to Account
  merchantId?: string; // Link to Merchant
  // Add other transaction properties
}

export interface AdminLog {
  id: string;       // Standardized ID
  timestamp: string; // Or Date object
  adminEmail: string; // Standardized property name
  action: string;
  targetType?: string; // Optional details
  targetId?: string;   // Optional details
  details?: string;
}

// Define AppData type here for central organization
export interface AppData {
    accounts: Account[]; // Use the defined types
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
}

// --- Mock Data Instance ---
const mockDataInstance: AppData = { // Add type annotation for safety
  accounts: [
    { id: 'acc001', name: 'Alice Johnson', email: 'alice@example.com', status: 'Active' },
    { id: 'acc002', name: 'Bob Williams', email: 'bob@example.com', status: 'Inactive' },
    { id: 'acc003', name: 'Charlie Brown', email: 'charlie@example.com', status: 'Pending' },
  ] as Account[], // Type assertion still okay
  merchants: [
    { id: 'mer001', businessName: 'Good Grocer', contactEmail: 'grocer@example.com', status: 'Approved' },
    { id: 'mer002', businessName: 'Tech Solutions', contactEmail: 'tech@example.com', status: 'Pending' },
  ] as Merchant[],
  transactions: [
    { id: 'trn001', timestamp: new Date().toISOString(), type: 'Credit', amount: 50, accountId: 'acc001' },
    { id: 'trn002', timestamp: new Date().toISOString(), type: 'Debit', amount: 20, merchantId: 'mer001' },
  ] as Transaction[],
  adminActivityLog: [ // Key matches AppData interface
    { id: 'log001', timestamp: new Date().toISOString(), adminEmail: 'admin@example.com', action: 'Approved Merchant mer001', targetType: 'Merchant', targetId: 'mer001' },
  ] as AdminLog[],
};

// --- EXPORT THE INSTANCE ---
export default mockDataInstance;