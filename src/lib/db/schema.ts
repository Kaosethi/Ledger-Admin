// FULL SCHEMA: src/lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  boolean,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod"; // Assuming you use Zod elsewhere, keep if needed
import { relations } from "drizzle-orm";

// ENUMs
export const accountStatusEnum = pgEnum("account_status", [
  "Pending",
  "Active",
  "Inactive",
  "Suspended",
]);

export const merchantStatusEnum = pgEnum("merchant_status", [
  "pending_approval",
  "active",
  "rejected",
  "suspended",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "Completed", // Index 0
  "Pending",   // Index 1
  "Failed",    // Index 2
  "Declined",  // Index 3
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "Debit",     // Index 0
  "Credit",    // Index 1
  "Adjustment",// Index 2
]);

// --- NEW ENUM for Account Types ---
export const accountTypeEnum = pgEnum("account_type", [
  "CHILD_DISPLAY",    // For existing customer/child accounts
  "MERCHANT_INTERNAL", // For merchants' internal ledger/wallet accounts
  "SYSTEM"             // For potential future system-level accounts
]);
// --- END NEW ENUM ---


// Base timestamp mixin
const timestampFields = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
};

// Soft delete mixin
const softDeleteField = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// Define the administrators table
export const administrators = pgTable(
  "administrators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    role: text("role").default("admin").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestampFields,
    ...softDeleteField,
  },
  (table) => {
    return {
      emailIdx: index("admin_email_idx").on(table.email),
    };
  }
);

// --- MODIFIED 'accounts' TABLE ---
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayId: text("display_id").notNull().unique(),
    childName: text("child_name").notNull(),
    guardianName: text("guardian_name").notNull(),
    status: accountStatusEnum("status").default("Active").notNull(),
    balance: numeric("balance", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    hashedPin: text("hashed_pin"),
    lastActivity: timestamp("last_activity", { withTimezone: true })
      .defaultNow()
      .notNull(),
    currentQrToken: text("current_qr_token"),
    guardianDob: text("guardian_dob"),
    guardianContact: text("guardian_contact"),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),

    // ADDED: Account Type column
    accountType: accountTypeEnum("account_type")
      .notNull()
      .default("CHILD_DISPLAY"),

    ...timestampFields,
    ...softDeleteField,
  },
  (table) => {
    return {
      displayIdIdx: index("account_display_id_idx").on(table.displayId),
      statusIdx: index("account_status_idx").on(table.status),
      lastActivityIdx: index("account_last_activity_idx").on(table.lastActivity),
      accountTypeIdx: index("account_account_type_idx").on(table.accountType), // ADDED Index
    };
  }
);

// --- MODIFIED 'merchants' TABLE ---
export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: text("business_name").notNull(),
    contactPerson: text("contact_person"),
    contactEmail: text("contact_email").notNull().unique(), // Made notNull as it's login email
    contactPhone: text("contact_phone"),
    storeAddress: text("store_address"),
    hashedPassword: text("hashed_password").notNull(),
    status: merchantStatusEnum("status").default("pending_approval").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    declineReason: text("decline_reason"),
    pinVerified: boolean("pin_verified").default(false),
    category: text("category"),
    website: text("website"),
    description: text("description"),
    logoUrl: text("logo_url"),

    // ADDED: Link to the merchant's internal ledger account
    internalAccountId: uuid("internal_account_id")
      .references(() => accounts.id, { onDelete: "restrict" })
      .notNull()
      .unique(),

    // ADDED: Settlement Payout Information
    settlementBankAccountName: text("settlement_bank_account_name"),
    settlementBankName: text("settlement_bank_name"),
    settlementBankAccountNumber: text("settlement_bank_account_number"),
    settlementBankSwiftCode: text("settlement_bank_swift_code"),
    settlementBankBranchName: text("settlement_bank_branch_name"),

    ...timestampFields,
    ...softDeleteField,
  },
  (table) => {
    return {
      businessNameIdx: index("merchant_business_name_idx").on(table.businessName),
      statusIdx: index("merchant_status_idx").on(table.status),
      categoryIdx: index("merchant_category_idx").on(table.category),
      internalAccountIdIdx: index("merchant_internal_account_id_idx").on(table.internalAccountId), // ADDED Index
    };
  }
);

// --- MODIFIED 'transactions' TABLE ---
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(), // Unique ID for THIS transaction leg

    // ADDED: paymentId to group debit and credit legs
    paymentId: uuid("payment_id").notNull(),

    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    type: transactionTypeEnum("type").notNull(),
    accountId: uuid("account_id") // FK to accounts.id (customer OR merchant's internal account)
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    merchantId: uuid("merchant_id") // FK to merchants.id (merchant facilitating transaction)
      .notNull() // Assuming a merchant is always involved in these app transactions
      .references(() => merchants.id, { onDelete: "set null" }), // or restrict
    status: transactionStatusEnum("status").notNull(),
    declineReason: text("decline_reason"),
    pinVerified: boolean("pin_verified"),
    description: text("description"),
    reference: text("reference"),
    metadata: text("metadata"),

    ...timestampFields,
  },
  (table) => {
    return {
      accountIdIdx: index("transaction_account_id_idx").on(table.accountId),
      merchantIdIdx: index("transaction_merchant_id_idx").on(table.merchantId),
      timestampIdx: index("transaction_timestamp_idx").on(table.timestamp),
      statusIdx: index("transaction_status_idx").on(table.status),
      typeIdx: index("transaction_type_idx").on(table.type),
      paymentIdIdx: index("transaction_payment_id_idx").on(table.paymentId), // ADDED Index
    };
  }
);

// Define the admin logs table
export const adminLogs = pgTable(
  "admin_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => administrators.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      adminIdIdx: index("admin_logs_admin_id_idx").on(table.adminId),
      createdAtIdx: index("admin_logs_created_at_idx").on(table.createdAt),
    };
  }
);

// Many-to-many relationship for account permissions
export const accountPermissions = pgTable(
  "account_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => administrators.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    ...timestampFields,
    ...softDeleteField,
  },
  (table) => {
    return {
      accountIdIdx: index("account_permissions_account_id_idx").on(table.accountId),
      adminIdIdx: index("account_permissions_admin_id_idx").on(table.adminId),
      permissionIdx: index("account_permissions_permission_idx").on(table.permission),
      uniqueAccountAdmin: primaryKey(table.accountId, table.adminId),
    };
  }
);


// --- Define relations (Updated for new links) ---
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  transactions: many(transactions, { relationName: "accountTransactions" }),
  permissions: many(accountPermissions),
  merchantDetailsForInternalAccount: one(merchants, {
    fields: [accounts.id],
    references: [merchants.internalAccountId]
  })
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  facilitatedTransactions: many(transactions, { relationName: "merchantFacilitatedTransactions" }),
  internalLedgerAccount: one(accounts, {
    fields: [merchants.internalAccountId],
    references: [accounts.id]
  })
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: "accountTransactions"
  }),
  merchant: one(merchants, {
    fields: [transactions.merchantId],
    references: [merchants.id],
    relationName: "merchantFacilitatedTransactions"
  }),
}));

export const administratorsRelations = relations(administrators, ({ many }) => ({
  adminLogs: many(adminLogs),
  accountPermissions: many(accountPermissions),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  administrator: one(administrators, {
    fields: [adminLogs.adminId],
    references: [administrators.id],
  }),
}));

export const accountPermissionsRelations = relations(accountPermissions, ({ one }) => ({
  account: one(accounts, {
    fields: [accountPermissions.accountId],
    references: [accounts.id],
  }),
  administrator: one(administrators, {
    fields: [accountPermissions.adminId],
    references: [administrators.id],
  }),
}));


// --- Zod schemas for type validation ---
// IMPORTANT: After schema changes, these need to be regenerated or manually updated.
// The createInsertSchema/createSelectSchema will pick up new fields,
// but your custom .omit().extend() schemas will need careful review.

export const insertAdministratorSchema = createInsertSchema(administrators);
export const selectAdministratorSchema = createSelectSchema(administrators);

export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);

export const insertMerchantSchema = createInsertSchema(merchants);
export const selectMerchantSchema = createSelectSchema(merchants);

export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export const insertAdminLogSchema = createInsertSchema(adminLogs);
export const selectAdminLogSchema = createSelectSchema(adminLogs);

export const insertAccountPermissionSchema = createInsertSchema(accountPermissions);
export const selectAccountPermissionSchema = createSelectSchema(accountPermissions);


// --- Custom Zod schemas (REVIEW AND UPDATE THESE CAREFULLY) ---
export const createAdministratorSchema = insertAdministratorSchema
  .omit({ /* ... as you had ... */ })
  .extend({ /* ... as you had ... */ });

// Example: Update createAccountSchema
export const createAccountSchema = insertAccountSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    balance: true, // Typically set by system, not user input
    lastActivity: true,
    // accountType: true, // You might set this programmatically, not from user input for general accounts
  })
  .extend({
    childName: z.string().min(1, "Child name is required"),
    guardianName: z.string().min(1, "Guardian name is required"),
    email: z.string().email("Invalid email address").optional().nullable(),
    guardianContact: z.string().optional().nullable(),
    currentQrToken: z.string().optional().nullable(),
    displayId: z.string().optional(),
    guardianDob: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    // If accountType is part of creation form, add it here.
    // accountType: z.enum(accountTypeEnum.enumValues).optional() // Example
  });

export const createPublicRegistrationSchema = createAccountSchema
  .omit({ /* ... as you had, but review with new accountType ... */ })
  .extend({ /* ... as you had ... */ });


// Example: Update createMerchantSchema
// This will need significant update if internalAccountId needs to be handled during merchant creation.
// Typically, an internal account record in 'accounts' would be created first, then its ID linked here.
// Or, the merchant record is created, then an account record, then the merchant record is updated.
// Settlement details might also be collected here or later.
export const createMerchantSchema = insertMerchantSchema
  .omit({
    id: true,
    submittedAt: true,
    updatedAt: true,
    createdAt: true,
    deletedAt: true,
    pinVerified: true,
    declineReason: true,
    internalAccountId: true, // Usually set programmatically after creating the linked account
    // Omit settlement fields if they are added later
    settlementBankAccountName: true,
    settlementBankName: true,
    settlementBankAccountNumber: true,
    settlementBankSwiftCode: true,
    settlementBankBranchName: true,
  })
  .extend({
    businessName: z.string().min(1, "Business name is required"),
    contactEmail: z.string().email("Invalid email address").optional(), // Should match merchants.contactEmail nullability
    password: z.string().min(8, "Password must be at least 8 characters").optional(), // For initial password set?
    category: z.string().optional(),
    // You might add settlement fields here if collected during initial creation and they are required.
    // settlementBankAccountNumber: z.string().min(1, "Bank account number is required").optional(), // etc.
  });

// Example: Update createTransactionSchema
export const createTransactionSchema = insertTransactionSchema
  .omit({
    id: true,
    timestamp: true,
    createdAt: true,
    updatedAt: true,
    paymentId: true, // paymentId will be generated by the system
    // merchantId: true, // merchantId will come from authenticated user (JWT)
    // status: true, // status will be set by the system
  })
  .extend({
    amount: z.number().positive("Amount must be positive"), // Or z.string() if you handle numeric as string
    accountId: z.string().uuid("Invalid account ID for transaction leg"), // The account being debited/credited
    // beneficiaryDisplayId might be part of the request to the API endpoint, not directly in createTransactionSchema
    // The API route would use beneficiaryDisplayId to find the actual accountId.
    merchantId: z.string().uuid("Merchant ID is required for this transaction").optional(), // This is the FACILITATING merchant.
    type: z.enum(transactionTypeEnum.enumValues), // Ensure type is one of the enum values
  });


export const createAdminLogSchema = insertAdminLogSchema
  .omit({ /* ... as you had ... */ })
  .extend({ /* ... as you had ... */ });

export const createAccountPermissionSchema = insertAccountPermissionSchema
  .extend({ /* ... as you had ... */ });