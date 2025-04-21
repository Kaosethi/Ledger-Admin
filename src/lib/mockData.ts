// src/lib/mockData.ts

export interface Account {
  id: string;
  name: string; // Child's Name
  email?: string; // Optional email if collected
  guardianName?: string; // <<< ADDED (Make optional '?' if not always present)
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended'; // Added 'Suspended' based on potential usage
  balance: number;
  pin?: string; // Keep internal? NOTE: Storing PINs directly is insecure in real apps.
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
  status: 'active' | 'pending_approval' | 'suspended' | 'rejected';
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
const mockDataInstance: AppData = {
  accounts: [
    // Existing Example:
    { id: 'STC-2023-0001', name: "John Doe", guardianName: "Alice Doe", balance: 150.00, createdAt: "2023-01-15T09:30:00Z", lastTransactionAt: "2024-03-20T14:45:00Z", pin: "1234", status: "Active", updatedAt: "2024-03-20T14:45:00Z", email: "john.doe@example.com" },

    // --- ADDED: 4 new mock accounts ---
    {
        id: 'STC-2023-0002',
        name: "Jane Smith",
        guardianName: "Bob Smith",
        balance: 75.50,
        createdAt: "2023-02-10T11:00:00Z",
        lastTransactionAt: "2024-03-18T08:20:00Z",
        pin: "5678", // Example PIN - insecure
        status: "Active",
        updatedAt: "2024-03-18T08:20:00Z",
        email: "jane.s@example.com"
    },
    {
        id: 'STC-2023-0003',
        name: "Michael Chen",
        guardianName: "Emily Chen",
        balance: 0.00,
        createdAt: "2023-05-22T16:15:00Z",
        lastTransactionAt: null, // No transactions yet
        pin: "1122", // Example PIN - insecure
        status: "Active",
        updatedAt: "2023-05-22T16:15:00Z",
        email: undefined // Optional field
    },
    {
        id: 'STC-2024-0004',
        name: "Sarah Davis",
        guardianName: "David Davis",
        balance: 210.75,
        createdAt: "2024-01-30T10:00:00Z",
        lastTransactionAt: "2024-03-25T11:55:00Z",
        pin: "3344", // Example PIN - insecure
        status: "Suspended", // Example of different status
        updatedAt: "2024-02-15T14:00:00Z", // Status updated later
        email: "sarah.d@example.com"
    },
    {
        id: 'STC-2024-0005',
        name: "Omar Garcia",
        guardianName: "Maria Garcia",
        balance: 500.00,
        createdAt: "2024-03-01T09:00:00Z",
        lastTransactionAt: "2024-03-10T12:00:00Z",
        pin: "9876", // Example PIN - insecure
        status: "Active",
        updatedAt: "2024-03-10T12:00:00Z",
        email: "omar.g@example.com"
    }
    // --- END ADDED accounts ---

  ] as Account[],
  merchants: [
    // Example (MUST match interface):
    { id: "M-001", contactEmail: "store1@example.com", businessName: "Food Market", password: "password", contactPerson: "Dave Grocer", contactPhone: "555-1111", storeAddress: "10 Market Plaza", status: 'active', submittedAt: "2023-01-09T10:00:00Z", updatedAt: "2023-01-10T08:00:00Z" },
    { id: "M-003", contactEmail: "newstore@example.com", businessName: "General Goods", password: "password", contactPerson: "Peter Trader", contactPhone: "555-3333", storeAddress: "30 Commerce Way", status: 'pending_approval', submittedAt: "2024-03-25T15:00:00Z", updatedAt: "2024-03-25T15:00:00Z" },
    // ... other merchants matching the Merchant interface ...
  ] as Merchant[],
  transactions: [
    // Example (MUST match interface):
     { id: "TX-2023-0001", accountId: "STC-2023-0001", merchantId: "M-001", amount: 15.00, timestamp: "2024-03-20T14:45:00Z", pinVerified: true, status: "Approved", description: "Food Aid", previousBalance: 165.00, newBalance: 150.00, type: 'Debit' }, // Updated timestamp
     // ADDED: More transactions for the new accounts
     { id: "TX-2024-0002", accountId: "STC-2023-0002", merchantId: "M-001", amount: 24.50, timestamp: "2024-03-18T08:20:00Z", pinVerified: true, status: "Approved", description: "Groceries", previousBalance: 100.00, newBalance: 75.50, type: 'Debit' },
     { id: "TX-2024-0003", accountId: "STC-2024-0004", merchantId: "M-001", amount: 10.25, timestamp: "2024-03-25T11:55:00Z", pinVerified: true, status: "Approved", description: "Supplies", previousBalance: 221.00, newBalance: 210.75, type: 'Debit' },
     { id: "TX-2024-0004", accountId: "STC-2024-0005", amount: 500.00, timestamp: "2024-03-01T09:00:00Z", pinVerified: false, status: "Approved", description: "Initial Deposit", previousBalance: 0.00, newBalance: 500.00, type: 'Credit' }, // Credit example
     { id: "TX-2024-0005", accountId: "STC-2024-0005", merchantId: "M-001", amount: 50.00, timestamp: "2024-03-10T12:00:00Z", pinVerified: true, status: "Approved", description: "Clothing", previousBalance: 550.00, newBalance: 500.00, type: 'Debit' }, // Corrected balance calculation for example

  ] as Transaction[],
  adminActivityLog: [
    // Example (MUST match interface):
     { id: "LOG-000", timestamp: "2024-03-26T09:55:00Z", adminEmail: "admin@example.com", action: "Login", targetType: "System", targetId: "-", details: "Admin logged in successfully." },
     // ADDED: Logs for new accounts
     { id: "LOG-001", timestamp: "2023-02-10T11:00:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2023-0002", details: "Registered Jane Smith (Guardian: Bob Smith) with initial balance $100.00" }, // Assuming initial balance was 100
     { id: "LOG-002", timestamp: "2023-05-22T16:15:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2023-0003", details: "Registered Michael Chen (Guardian: Emily Chen) with initial balance $0.00" },
     { id: "LOG-003", timestamp: "2024-01-30T10:00:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2024-0004", details: "Registered Sarah Davis (Guardian: David Davis) with initial balance $221.00" }, // Assuming initial balance
     { id: "LOG-004", timestamp: "2024-02-15T14:00:00Z", adminEmail: "admin@example.com", action: "Update Account Status", targetType: "Account", targetId: "STC-2024-0004", details: "Changed status from Active to Suspended" },
     { id: "LOG-005", timestamp: "2024-03-01T09:00:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2024-0005", details: "Registered Omar Garcia (Guardian: Maria Garcia) with initial balance $550.00" }, // Assuming initial balance before TXN
  ] as AdminLog[],
};

export default mockDataInstance;