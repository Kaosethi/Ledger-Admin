// src/lib/hrPortalMockData.ts
import { v4 as uuidv4 } from 'uuid';

// --- Employee Interface ---
export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  joinDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  salary: number;
}

// --- Send Home Request Interface ---
export interface SendHomeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  requestDate: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  rmsId?: string;
  timestamp?: string;
  approverName?: string;
  approvalDate?: string;
}

// --- Withdraw Request Interface ---
export interface WithdrawRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  accountNumber: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  rmsId?: string;
  timestamp?: string;
  approverName?: string;
  approvalDate?: string;
}

// --- User Account Interface ---
export interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

// --- Activity Log Interface ---
export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  timestamp: string;
  details?: string;
}

// --- Payroll Record Interface ---
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  totalPaid: number;
  paymentDate: string;
  status: 'Paid' | 'Processing' | 'Failed';
}

// --- Salary Advance Interface ---
export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  requestDate: string;
  approvalDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

// --- HR Dashboard Data Interface ---
export interface HRDashboardData {
  employees: Employee[];
  sendHomeRequests: SendHomeRequest[];
  withdrawRequests: WithdrawRequest[];
  userAccounts: UserAccount[];
  activityLogs: ActivityLog[];
  totalPayrollProcessed: number;
  totalWithdrawn: number;
  payrollRecords: PayrollRecord[];
  salaryAdvances: SalaryAdvance[];
}

// Helper function to generate dates
function getDateString(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

// Mock HR Data Instance
const hrMockDataInstance: HRDashboardData = {
  employees: Array.from({ length: 125 }, (_, i) => ({
    id: `EMP-${String(i + 1).padStart(3, '0')}`,
    name: `Employee ${i + 1}`,
    position: i % 5 === 0 ? 'Manager' : i % 3 === 0 ? 'Supervisor' : 'Staff',
    department: ['HR', 'Finance', 'Operations', 'IT', 'Marketing'][i % 5],
    joinDate: getDateString(-Math.floor(Math.random() * 365 * 3)), // Random date within last 3 years
    status: i % 10 === 0 ? 'On Leave' : i % 15 === 0 ? 'Inactive' : 'Active',
    salary: Math.floor(15000 + Math.random() * 10000),
  })),
  
  payrollRecords: [
    {
      id: 'PR001',
      employeeId: 'EMP-001',
      employeeName: 'Employee 1',
      periodStart: '2025-05-01T00:00:00Z',
      periodEnd: '2025-05-31T23:59:59Z',
      baseSalary: 22500,
      overtime: 2000,
      bonus: 1500,
      deductions: 500,
      totalPaid: 25500,
      paymentDate: '2025-06-05T10:00:00Z',
      status: 'Paid',
    },
    {
      id: 'PR002',
      employeeId: 'EMP-002',
      employeeName: 'Employee 2',
      periodStart: '2025-05-01T00:00:00Z',
      periodEnd: '2025-05-31T23:59:59Z',
      baseSalary: 18000,
      overtime: 1200,
      bonus: 0,
      deductions: 300,
      totalPaid: 18900,
      paymentDate: '2025-06-05T10:15:00Z',
      status: 'Paid',
    },
    {
      id: 'PR003',
      employeeId: 'EMP-003',
      employeeName: 'Employee 3',
      periodStart: '2025-05-01T00:00:00Z',
      periodEnd: '2025-05-31T23:59:59Z',
      baseSalary: 19500,
      overtime: 800,
      bonus: 1000,
      deductions: 400,
      totalPaid: 20900,
      paymentDate: '2025-06-05T10:30:00Z',
      status: 'Paid',
    },
    {
      id: 'PR004',
      employeeId: 'EMP-004',
      employeeName: 'Employee 4',
      periodStart: '2025-06-01T00:00:00Z',
      periodEnd: '2025-06-30T23:59:59Z',
      baseSalary: 21000,
      overtime: 1500,
      bonus: 0,
      deductions: 450,
      totalPaid: 22050,
      paymentDate: '',
      status: 'Processing',
    },
    {
      id: 'PR005',
      employeeId: 'EMP-005',
      employeeName: 'Employee 5',
      periodStart: '2025-06-01T00:00:00Z',
      periodEnd: '2025-06-30T23:59:59Z',
      baseSalary: 25000,
      overtime: 2200,
      bonus: 2000,
      deductions: 600,
      totalPaid: 28600,
      paymentDate: '',
      status: 'Processing',
    },
  ],
  
  salaryAdvances: [
    {
      id: 'SA001',
      employeeId: 'EMP-010',
      employeeName: 'Employee 10',
      amount: 5000,
      requestDate: getDateString(-3),
      status: 'Approved',
      approvalDate: getDateString(-2),
      reason: 'Medical emergency',
    },
    {
      id: 'SA002',
      employeeId: 'EMP-023',
      employeeName: 'Employee 23',
      amount: 3000,
      requestDate: getDateString(-2),
      status: 'Pending',
      reason: 'Education expenses',
    },
    {
      id: 'SA003',
      employeeId: 'EMP-045',
      employeeName: 'Employee 45',
      amount: 2500,
      requestDate: getDateString(-5),
      status: 'Approved',
      approvalDate: getDateString(-3),
      reason: 'Family event',
    },
    {
      id: 'SA004',
      employeeId: 'EMP-072',
      employeeName: 'Employee 72',
      amount: 4000,
      requestDate: getDateString(-1),
      status: 'Pending',
      reason: 'Housing deposit',
    },
  ],
  sendHomeRequests: [
    {
      id: 'SHR-001',
      employeeId: 'EMP-012',
      employeeName: 'Employee 12',
      reason: 'Family emergency',
      requestDate: getDateString(-2),
      status: 'Completed',
      amount: 200000,
      rmsId: 'RMS-1204',
      timestamp: '2023-10-03T14:30:00Z',
    },
    {
      id: 'SHR-002',
      employeeId: 'EMP-034',
      employeeName: 'Employee 34',
      reason: 'Medical appointment',
      requestDate: getDateString(-1),
      status: 'Pending',
      amount: 300000,
      rmsId: 'RMS-3402',
      timestamp: '2023-10-02T11:00:00Z',
    },
    {
      id: 'SHR-003',
      employeeId: 'EMP-056',
      employeeName: 'Employee 56',
      reason: 'Personal emergency',
      requestDate: getDateString(-3),
      status: 'Pending',
      amount: 150000,
      rmsId: 'RMS-5610',
    },
    {
      id: 'SHR-004',
      employeeId: 'EMP-078',
      employeeName: 'Employee 78',
      reason: 'Family event',
      requestDate: getDateString(-1),
      status: 'Completed',
      amount: 250000,
      rmsId: 'RMS-7821',
      timestamp: '2023-09-28T16:45:00Z',
    },
    {
      id: 'SHR-005',
      employeeId: 'EMP-098',
      employeeName: 'Employee 98',
      reason: 'Health concerns',
      requestDate: getDateString(-4),
      status: 'Cancelled',
      amount: 100000,
      rmsId: 'RMS-9840',
      timestamp: '2023-10-01T09:45:00Z',
    },
    {
      id: 'SHR-006',
      employeeId: 'EMP-103',
      employeeName: 'Employee 103',
      reason: 'Transportation issues',
      requestDate: getDateString(-2),
      status: 'Pending',
      amount: 175000,
      rmsId: 'RMS-1035',
    },
    {
      id: 'SHR-007',
      employeeId: 'EMP-125',
      employeeName: 'Employee 125',
      reason: 'Family emergency',
      requestDate: getDateString(-1),
      status: 'Pending',
      amount: 225000,
      rmsId: 'RMS-1252',
    },
    {
      id: 'SHR-008',
      employeeId: 'EMP-119',
      employeeName: 'Employee 119',
      reason: 'Personal emergency',
      requestDate: getDateString(-1),
      status: 'Pending',
      amount: 180000,
      rmsId: 'RMS-1194',
    },
  ],

  withdrawRequests: [
    {
      id: 'WR-001',
      employeeId: 'EMP-023',
      employeeName: 'Employee 23',
      amount: 150000,
      accountNumber: '00123456789',
      requestDate: getDateString(-3),
      status: 'Completed',
      rmsId: 'RMS-2307',
      timestamp: '2023-10-03T15:30:00Z',
    },
    {
      id: 'WR-002',
      employeeId: 'EMP-045',
      employeeName: 'Employee 45',
      amount: 100000,
      accountNumber: '00234567890',
      requestDate: getDateString(-2),
      status: 'Cancelled',
      rmsId: 'RMS-4512',
      timestamp: '2023-10-01T09:45:00Z',
    },
    {
      id: 'WR-003',
      employeeId: 'EMP-067',
      employeeName: 'Employee 67',
      amount: 75000,
      accountNumber: '00345678901',
      requestDate: getDateString(-1),
      status: 'Pending',
      rmsId: 'RMS-6723',
    },
    {
      id: 'WR-004',
      employeeId: 'EMP-089',
      employeeName: 'Employee 89',
      amount: 200000,
      accountNumber: '00456789012',
      requestDate: getDateString(-4),
      status: 'Completed',
      rmsId: 'RMS-8945',
      timestamp: '2023-09-29T13:20:00Z',
    },
    {
      id: 'WR-005',
      employeeId: 'EMP-112',
      employeeName: 'Employee 112',
      amount: 300000,
      accountNumber: '00567890123',
      requestDate: getDateString(-2),
      status: 'Pending',
      rmsId: 'RMS-1126',
    },
  ],

  userAccounts: [
    {
      id: 'USR-001',
      username: 'johndoe',
      email: 'john.doe@hradminportal.com',
      role: 'HR Manager',
      lastLogin: getDateString(0),
      status: 'Active',
    },
    {
      id: 'USR-002',
      username: 'janesmith',
      email: 'jane.smith@hradminportal.com',
      role: 'Admin',
      lastLogin: getDateString(-1),
      status: 'Active',
    },
    {
      id: 'USR-003',
      username: 'mikebrown',
      email: 'mike.brown@hradminportal.com',
      role: 'Supervisor',
      lastLogin: getDateString(-2),
      status: 'Active',
    },
  ],
  
  activityLogs: [
    {
      id: uuidv4(),
      userId: 'USR-001',
      username: 'johndoe',
      action: 'Logged in',
      timestamp: getDateString(-0.1), // Today
      details: 'System login',
    },
    {
      id: uuidv4(),
      userId: 'USR-001',
      username: 'johndoe',
      action: 'Viewed employee records',
      timestamp: getDateString(-0.2), // Today
      details: 'Employee records accessed',
    },
    {
      id: uuidv4(),
      userId: 'USR-002',
      username: 'janesmith',
      action: 'Approved withdrawal request',
      timestamp: getDateString(-1),
      details: 'WR-006',
    },
  ],
  
  totalPayrollProcessed: 25000000, // 25 million MMK
  totalWithdrawn: 6500000, // 6.5 million MMK
};

export default hrMockDataInstance;
