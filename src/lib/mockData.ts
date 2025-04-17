// src/lib/mockData.ts

export interface Account {
  id: string;
  name: string; // Child's Name
  email?: string; // Optional email if collected
  guardianName?: string; // <<< ADDED (Make optional '?' if not always present)
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended'; // Added 'Suspended' based on potential usage
  balance: number;
  pin?: string; // Keep internal?
  // Add other guardian fields if needed directly, e.g., guardianContact, guardianAddress
  createdAt?: string; // Standardized name
  lastTransactionAt?: string | null; // <<< ADDED (Make optional/nullable)
  updatedAt?: string | null; // Standardized name
}

export interface Merchant {
  id: string;
  businessName: string; // Standardized name
  contactEmail: string; // Standardized name
  // Add other fields from demo: contactPerson, contactPhone, storeAddress, password
  contactPerson?: string;
  contactPhone?: string;
  storeAddress?: string;
  password?: string; // Store passwords securely in a real app!
  // --- CORRECTED STATUS UNION ---
  status: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  // --- ADDED TIMESTAMPS ---
  submittedAt?: string; // <<< ADDED (Make optional)
  updatedAt?: string | null; // <<< ADDED (Make optional/nullable)
}

export interface Transaction {
  id: string;
  timestamp: string; // Or Date
  type: string;
  amount: number;
  accountId?: string;
  merchantId?: string;
  status: 'Approved' | 'Declined';
  description?: string;
  // Adjust naming if needed based on mock data consistency:
  previousBalance?: number; // previous_balance
  newBalance?: number;      // new_balance
  pinVerified?: boolean;    // pin_verified
}

export interface AdminLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
}

// AppData should use the corrected interfaces
export interface AppData {
    accounts: Account[];
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
}

// --- Mock Data Instance ---
// IMPORTANT: Ensure the *actual data objects* in mockDataInstance use the *exact*
// property names defined in the interfaces above (e.g., guardianName, submittedAt, status: 'active').
const mockDataInstance: AppData = {
  accounts: [
    // Example (MUST match interface):
    { id: 'STC-2023-0001', name: "John Doe", guardianName: "Alice Doe", balance: 150.00, createdAt: "2023-01-15T09:30:00Z", lastTransactionAt: "2023-03-20T14:45:00Z", pin: "1234", status: "Active", updatedAt: null, email: undefined },
    // ... other accounts matching the Account interface ...
  ] as Account[], // Use type assertion if needed, but ensure data matches
  merchants: [
    // Example (MUST match interface):
    { id: "M-001", contactEmail: "store1@example.com", businessName: "Food Market", password: "password", contactPerson: "Dave Grocer", contactPhone: "555-1111", storeAddress: "10 Market Plaza", status: 'active', submittedAt: "2023-01-09T10:00:00Z", updatedAt: "2023-01-10T08:00:00Z" },
    { id: "M-003", contactEmail: "newstore@example.com", businessName: "General Goods", password: "password", contactPerson: "Peter Trader", contactPhone: "555-3333", storeAddress: "30 Commerce Way", status: 'pending_approval', submittedAt: "2024-03-25T15:00:00Z", updatedAt: "2024-03-25T15:00:00Z" },
    // ... other merchants matching the Merchant interface ...
  ] as Merchant[],
  transactions: [
    // Example (MUST match interface):
     { id: "TX-2023-0001", accountId: "STC-2023-0001", merchantId: "M-001", amount: 15.00, timestamp: "2023-03-15T10:30:00Z", pinVerified: true, status: "Approved", description: "Food Aid", previousBalance: 165.00, newBalance: 150.00, type: 'Debit' }, // Added type example
     // ... other transactions matching the Transaction interface ...
  ] as Transaction[],
  adminActivityLog: [
    // Example (MUST match interface):
     { id: "LOG-000", timestamp: "2024-03-26T09:55:00Z", adminEmail: "admin@example.com", action: "Login", targetType: "System", targetId: "-", details: "Admin logged in successfully." },
     // ... other logs matching the AdminLog interface ...
  ] as AdminLog[],
};

export default mockDataInstance;