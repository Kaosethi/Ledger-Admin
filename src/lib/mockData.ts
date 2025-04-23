// src/lib/mockData.ts

export interface Account {
  id: string;
  name: string; // Child's Name
  email?: string; // Optional email if collected
  guardianName?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  balance: number;
  pin?: string; // Hashed PIN in a real app
  createdAt?: string;
  lastTransactionAt?: string | null;
  updatedAt?: string | null;
}

export interface Merchant {
  id: string;
  businessName: string;
  contactEmail: string;
  contactPerson?: string;
  contactPhone?: string;
  storeAddress?: string;
  password?: string; // Hashed password in a real app
  status: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  submittedAt?: string;
  updatedAt?: string | null;
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
  previousBalance?: number;
  newBalance?: number;
  pinVerified?: boolean;
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

// Interface for pending remote registrations
export interface PendingRegistration {
    id: string; // Unique ID for the pending request itself
    guardianName: string;
    guardianDob: string; // Store as string for simplicity from form input
    guardianContact: string;
    address: string;
    childName: string;
    pin: string;
    submittedAt: string; // ISO string format recommended
    status: 'Pending' | 'Approved' | 'Rejected'; // Status of the registration request
    rejectionReason?: string; // Optional reason if rejected
}


// AppData interface to include pendingRegistrations
export interface AppData {
    accounts: Account[];
    merchants: Merchant[];
    transactions: Transaction[];
    adminActivityLog: AdminLog[];
    pendingRegistrations: PendingRegistration[];
}

// --- Mock Data Instance ---
const mockDataInstance: AppData = {
  accounts: [
    // Existing accounts...
    { id: 'STC-2023-0001', name: "John Doe", guardianName: "Alice Doe", balance: 150.00, createdAt: "2023-01-15T09:30:00Z", lastTransactionAt: "2024-03-20T14:45:00Z", pin: "1234", status: "Active", updatedAt: "2024-03-20T14:45:00Z", email: "john.doe@example.com" },
    { id: 'STC-2023-0002', name: "Jane Smith", guardianName: "Bob Smith", balance: 75.50, createdAt: "2023-02-10T11:00:00Z", lastTransactionAt: "2024-03-18T08:20:00Z", pin: "5678", status: "Active", updatedAt: "2024-03-18T08:20:00Z", email: "jane.s@example.com" },
    { id: 'STC-2023-0003', name: "Michael Chen", guardianName: "Emily Chen", balance: 0.00, createdAt: "2023-05-22T16:15:00Z", lastTransactionAt: null, pin: "1122", status: "Active", updatedAt: "2023-05-22T16:15:00Z", email: undefined },
    { id: 'STC-2024-0004', name: "Sarah Davis", guardianName: "David Davis", balance: 210.75, createdAt: "2024-01-30T10:00:00Z", lastTransactionAt: "2024-03-25T11:55:00Z", pin: "3344", status: "Suspended", updatedAt: "2024-02-15T14:00:00Z", email: "sarah.d@example.com" },
    { id: 'STC-2024-0005', name: "Omar Garcia", guardianName: "Maria Garcia", balance: 500.00, createdAt: "2024-03-01T09:00:00Z", lastTransactionAt: "2024-03-10T12:00:00Z", pin: "9876", status: "Active", updatedAt: "2024-03-10T12:00:00Z", email: "omar.g@example.com" }
  ] as Account[],
  merchants: [
    // Existing merchants...
    { id: "M-001", contactEmail: "store1@example.com", businessName: "Food Market", password: "password", contactPerson: "Dave Grocer", contactPhone: "555-1111", storeAddress: "10 Market Plaza", status: 'active', submittedAt: "2023-01-09T10:00:00Z", updatedAt: "2023-01-10T08:00:00Z" },
    { id: "M-003", contactEmail: "newstore@example.com", businessName: "General Goods", password: "password", contactPerson: "Peter Trader", contactPhone: "555-3333", storeAddress: "30 Commerce Way", status: 'pending_approval', submittedAt: "2024-03-25T15:00:00Z", updatedAt: "2024-03-25T15:00:00Z" },
  ] as Merchant[],
  transactions: [
    // Existing transactions...
     { id: "TX-2023-0001", accountId: "STC-2023-0001", merchantId: "M-001", amount: 15.00, timestamp: "2024-03-20T14:45:00Z", pinVerified: true, status: "Approved", description: "Food Aid", previousBalance: 165.00, newBalance: 150.00, type: 'Debit' },
     { id: "TX-2024-0002", accountId: "STC-2023-0002", merchantId: "M-001", amount: 24.50, timestamp: "2024-03-18T08:20:00Z", pinVerified: true, status: "Approved", description: "Groceries", previousBalance: 100.00, newBalance: 75.50, type: 'Debit' },
     { id: "TX-2024-0003", accountId: "STC-2024-0004", merchantId: "M-001", amount: 10.25, timestamp: "2024-03-25T11:55:00Z", pinVerified: true, status: "Approved", description: "Supplies", previousBalance: 221.00, newBalance: 210.75, type: 'Debit' },
     { id: "TX-2024-0004", accountId: "STC-2024-0005", amount: 500.00, timestamp: "2024-03-01T09:00:00Z", pinVerified: false, status: "Approved", description: "Initial Deposit", previousBalance: 0.00, newBalance: 500.00, type: 'Credit' },
     { id: "TX-2024-0005", accountId: "STC-2024-0005", merchantId: "M-001", amount: 50.00, timestamp: "2024-03-10T12:00:00Z", pinVerified: true, status: "Approved", description: "Clothing", previousBalance: 550.00, newBalance: 500.00, type: 'Debit' },
  ] as Transaction[],
  adminActivityLog: [
    // Existing logs...
     { id: "LOG-000", timestamp: "2024-03-26T09:55:00Z", adminEmail: "admin@example.com", action: "Login", targetType: "System", targetId: "-", details: "Admin logged in successfully." },
     { id: "LOG-001", timestamp: "2023-02-10T11:00:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2023-0002", details: "Registered Jane Smith (Guardian: Bob Smith) with initial balance $100.00" },
     { id: "LOG-002", timestamp: "2023-05-22T16:15:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2023-0003", details: "Registered Michael Chen (Guardian: Emily Chen) with initial balance $0.00" },
     { id: "LOG-003", timestamp: "2024-01-30T10:00:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2024-0004", details: "Registered Sarah Davis (Guardian: David Davis) with initial balance $221.00" },
     { id: "LOG-004", timestamp: "2024-02-15T14:00:00Z", adminEmail: "admin@example.com", action: "Update Account Status", targetType: "Account", targetId: "STC-2024-0004", details: "Changed status from Active to Suspended" },
     { id: "LOG-005", timestamp: "2024-03-01T09:00:00Z", adminEmail: "onboarding@example.com", action: "Onboard Account", targetType: "Account", targetId: "STC-2024-0005", details: "Registered Omar Garcia (Guardian: Maria Garcia) with initial balance $550.00" },
  ] as AdminLog[],

  // MODIFIED: Initialize pendingRegistrations with sample data
  pendingRegistrations: [
      {
          id: `PEN-${Date.now() - 86400000}`, // Submitted yesterday
          guardianName: "Aisha Khan",
          guardianDob: "1985-06-15",
          guardianContact: "555-123-4567",
          address: "123 Oasis Lane, Metropolis",
          childName: "Samir Khan",
          pin: "1111", // Remember security!
          submittedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          status: 'Pending',
      },
      {
          id: `PEN-${Date.now() - 3600000}`, // Submitted an hour ago
          guardianName: "Ben Carter",
          guardianDob: "1990-11-22",
          guardianContact: "555-987-6543",
          address: "456 River Road, Gotham",
          childName: "Chloe Carter",
          pin: "2222",
          submittedAt: new Date(Date.now() - 3600000).toISOString(), // An hour ago
          status: 'Pending',
      },
      {
          id: `PEN-${Date.now() - 600000}`, // Submitted 10 mins ago
          guardianName: "Elena Rodriguez",
          guardianDob: "1978-03-01",
          guardianContact: "555-555-5555",
          address: "789 Mountain View, Star City",
          childName: "Mateo Rodriguez",
          pin: "3333",
          submittedAt: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
          status: 'Pending',
      }
  ] as PendingRegistration[],
};

export default mockDataInstance;