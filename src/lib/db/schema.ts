// src/lib/db/schema.ts
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
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  "Completed",
  "Pending",
  "Failed",
  "Declined",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "Debit",
  "Credit",
  "Adjustment",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "CHILD_DISPLAY",
  "MERCHANT_INTERNAL",
  "SYSTEM"
]);

const timestampFields = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
};

const softDeleteField = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

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
  (table) => ({ emailIdx: index("admin_email_idx").on(table.email) })
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayId: text("display_id").notNull().unique(),
    childName: text("child_name").notNull(),
    guardianName: text("guardian_name").notNull(),
    status: accountStatusEnum("status").default("Active").notNull(),
    balance: numeric("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
    hashedPin: text("hashed_pin"),
    lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow().notNull(),
    currentQrToken: text("current_qr_token"),
    guardianDob: text("guardian_dob"),
    guardianContact: text("guardian_contact"),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),
    accountType: accountTypeEnum("account_type").notNull().default("CHILD_DISPLAY"),
    ...timestampFields,
    ...softDeleteField,
  },
  (table) => ({
    displayIdIdx: index("account_display_id_idx").on(table.displayId),
    statusIdx: index("account_status_idx").on(table.status),
    lastActivityIdx: index("account_last_activity_idx").on(table.lastActivity),
    accountTypeIdx: index("account_account_type_idx").on(table.accountType),
  })
);

export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayId: text("display_id").notNull().unique(), // ADDED
    businessName: text("business_name").notNull(),
    contactPerson: text("contact_person"),
    contactEmail: text("contact_email").notNull().unique(),
    contactPhone: text("contact_phone"),
    storeAddress: text("store_address"),
    hashedPassword: text("hashed_password").notNull(),
    status: merchantStatusEnum("status").default("pending_approval").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    declineReason: text("decline_reason"),
    pinVerified: boolean("pin_verified").default(false),
    category: text("category"),
    website: text("website"),
    description: text("description"),
    logoUrl: text("logo_url"),
    internalAccountId: uuid("internal_account_id").references(() => accounts.id, { onDelete: "restrict" }).notNull().unique(),
    settlementBankAccountName: text("settlement_bank_account_name"),
    settlementBankName: text("settlement_bank_name"),
    settlementBankAccountNumber: text("settlement_bank_account_number"),
    settlementBankSwiftCode: text("settlement_bank_swift_code"),
    settlementBankBranchName: text("settlement_bank_branch_name"),
    ...timestampFields,
    ...softDeleteField,
  },
  (table) => ({
    displayIdIdx: index("merchant_display_id_idx").on(table.displayId), // ADDED
    businessNameIdx: index("merchant_business_name_idx").on(table.businessName),
    contactEmailIdx: index("merchant_contact_email_idx").on(table.contactEmail),
    statusIdx: index("merchant_status_idx").on(table.status),
    categoryIdx: index("merchant_category_idx").on(table.category),
    internalAccountIdIdx: index("merchant_internal_account_id_idx").on(table.internalAccountId),
  })
);

// NEW TABLE: payments
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(), // This is the conceptual "payment_id"
    displayId: text("display_id").notNull().unique(), // e.g., PAY-YYYY-NNNN
    // You can add other fields specific to the overall payment event here if needed
    // For example: initiatedBy (merchantId or accountId), overallStatus, etc.
    ...timestampFields,
  },
  (table) => ({
    displayIdIdx: index("payment_display_id_idx").on(table.displayId),
  })
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayId: text("display_id").notNull().unique(), // ADDED
    paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }), // UPDATED to reference payments table
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    type: transactionTypeEnum("type").notNull(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    merchantId: uuid("merchant_id").references(() => merchants.id, { onDelete: "set null" }), // onDelete changed to set null if merchant is deleted. Note: original had .notNull() which conflicts with set null. Making it nullable.
    status: transactionStatusEnum("status").notNull(),
    declineReason: text("decline_reason"),
    pinVerified: boolean("pin_verified"),
    description: text("description"),
    reference: text("reference"),
    metadata: text("metadata"),
    ...timestampFields,
  },
  (table) => ({
    displayIdIdx: index("transaction_display_id_idx").on(table.displayId), // ADDED
    accountIdIdx: index("transaction_account_id_idx").on(table.accountId),
    merchantIdIdx: index("transaction_merchant_id_idx").on(table.merchantId),
    timestampIdx: index("transaction_timestamp_idx").on(table.timestamp),
    statusIdx: index("transaction_status_idx").on(table.status),
    typeIdx: index("transaction_type_idx").on(table.type),
    paymentIdIdx: index("transaction_payment_id_idx").on(table.paymentId),
  })
);

export const adminLogs = pgTable(
  "admin_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    adminId: uuid("admin_id").references(() => administrators.id, { onDelete: "set null" }),
    adminEmail: text("admin_email").notNull().references(() => administrators.email, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestampFields,
  },
  (table) => ({
    timestampIdx: index("admin_log_timestamp_idx").on(table.timestamp),
    adminIdIdx: index("admin_log_admin_id_idx").on(table.adminId),
    actionIdx: index("admin_log_action_idx").on(table.action),
  })
);

export const accountPermissions = pgTable(
  "account_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    adminId: uuid("admin_id").notNull().references(() => administrators.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestampFields,
  },
  (table) => {
    return {
      accountIdIdx: index("account_permissions_account_id_idx").on(table.accountId),
      adminIdIdx: index("account_permissions_admin_id_idx").on(table.adminId),
      permissionIdx: index("account_permissions_permission_idx").on(table.permission),
    };
  }
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...timestampFields,
  },
  (table) => ({
    merchantIdIdx: index("prt_merchant_id_idx").on(table.merchantId),
    expiresAtIdx: index("prt_expires_at_idx").on(table.expiresAt),
  })
);

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
  }),
  passwordResetTokens: many(passwordResetTokens),
}));

// ADDED relations for payments
export const paymentsRelations = relations(payments, ({ many }) => ({
  transactions: many(transactions), // A payment can have many transaction legs
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
  payment: one(payments, { // ADDED relation to the payment
    fields: [transactions.paymentId],
    references: [payments.id],
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

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  merchant: one(merchants, {
    fields: [passwordResetTokens.merchantId],
    references: [merchants.id],
  }),
}));

export const insertAdministratorSchema = createInsertSchema(administrators);
export const selectAdministratorSchema = createSelectSchema(administrators);

export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);

export const insertMerchantSchema = createInsertSchema(merchants);
export const selectMerchantSchema = createSelectSchema(merchants);

// ADDED Zod schemas for payments
export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export const insertAdminLogSchema = createInsertSchema(adminLogs);
export const selectAdminLogSchema = createSelectSchema(adminLogs);

export const insertAccountPermissionSchema = createInsertSchema(accountPermissions);
export const selectAccountPermissionSchema = createSelectSchema(accountPermissions);

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const selectPasswordResetTokenSchema = createSelectSchema(passwordResetTokens);

export const createAdministratorSchema = insertAdministratorSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    lastLoginAt: true,
  })
  .extend({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
  });

export const createAccountSchema = insertAccountSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    balance: true,
    lastActivity: true,
  })
  .extend({
    childName: z.string().min(1, "Child name is required"),
    guardianName: z.string().min(1, "Guardian name is required"),
    email: z.string().email("Invalid email address").optional().nullable(),
    guardianContact: z.string().optional().nullable(),
    currentQrToken: z.string().optional().nullable(),
    displayId: z.string().min(1, "Display ID is required when creating an account via this schema."), // Made displayId required if this schema is used for creation where frontend sends it
    guardianDob: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  });

export const createPublicRegistrationSchema = createAccountSchema
  .omit({
    status: true,
    hashedPin: true,
    displayId: true, // Assuming public registration doesn't provide displayId initially
    currentQrToken: true,
  })
  .extend({
    pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
    guardianDob: z.string().min(1, "Guardian date of birth is required"),
    submissionLanguage: z.string().optional(),
  });

const displayIdRegex = /^[A-Z]{3}-\d{4}-\d{4}$/; // e.g., STC-2023-0001

export const createMerchantSchema = insertMerchantSchema
  .omit({
    id: true,
    submittedAt: true,
    updatedAt: true,
    createdAt: true,
    deletedAt: true,
    pinVerified: true,
    declineReason: true,
    // internalAccountId should be handled by service logic (create internal account first)
    // Omitting it here implies it's set by the service, not directly by client in this schema.
    // Or, if client is expected to provide an existing one, it should be uuid().
    internalAccountId: true, 
    settlementBankAccountName: true, 
    settlementBankName: true,
    settlementBankAccountNumber: true,
    settlementBankSwiftCode: true,
    settlementBankBranchName: true,
  })
  .extend({
    displayId: z.string().regex(displayIdRegex, "Invalid Display ID format. Expected PREFIX-YYYY-NNNN"), // ADDED
    businessName: z.string().min(1, "Business name is required"),
    contactEmail: z.string().email("Invalid email address"), 
    password: z.string().min(8, "Password must be at least 8 characters"), 
    category: z.string().optional(),
    // If client needs to provide an existing internalAccountId UUID:
    // internalAccountIdToLink: z.string().uuid("Valid Internal Account UUID is required to link.").optional(),
  });

// ADDED basic Zod schema for creating payments
export const createPaymentSchema = insertPaymentSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    displayId: z.string().regex(displayIdRegex, "Invalid Display ID format. Expected PREFIX-YYYY-NNNN"), // ADDED
    // Add any other fields the client must provide when creating a payment event
  });

export const createTransactionSchema = insertTransactionSchema
  .omit({
    id: true,
    timestamp: true,
    createdAt: true,
    updatedAt: true,
    // paymentId will be linked by service logic using the UUID of the created Payment record
  })
  .extend({
    displayId: z.string().regex(displayIdRegex, "Invalid Display ID format. Expected PREFIX-YYYY-NNNN"), // ADDED
    paymentId: z.string().uuid("Valid Payment UUID is required."), // Client provides UUID of parent Payment record
    amount: z.number().positive("Amount must be positive"), 
    accountId: z.string().uuid("Invalid account ID for transaction leg"), 
    merchantId: z.string().uuid("Merchant ID is required for this transaction").nullable(), // Made nullable to match schema's onDelete: 'set null'
    type: z.enum(transactionTypeEnum.enumValues), 
  });

export const createAdminLogSchema = insertAdminLogSchema
  .omit({
    id: true,
  })
  .extend({
    action: z.string().min(1, "Action is required"),
  });

export const createAccountPermissionSchema = insertAccountPermissionSchema
  .omit({
    grantedAt: true, 
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    accountId: z.string().uuid("Invalid account ID"),
    adminId: z.string().uuid("Invalid admin ID"),
    permission: z.string().min(1, "Permission is required"),
  });