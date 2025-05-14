import {
  pgTable,
  serial,
  text,
  timestamp,
  time,
  uuid,
  varchar,
  numeric,
  boolean,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
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

// time2: time({ withTimezone: true }),

// Base timestamp mixin - use timestamp with timezone
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

// Define the accounts table
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
    ...timestampFields,
    ...softDeleteField,
  },
  (table) => {
    return {
      displayIdIdx: index("account_display_id_idx").on(table.displayId),
      statusIdx: index("account_status_idx").on(table.status),
      lastActivityIdx: index("account_last_activity_idx").on(
        table.lastActivity
      ),
    };
  }
);

// Define the merchants table
export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: text("business_name").notNull(),
    contactPerson: text("contact_person"),
    contactEmail: text("contact_email").unique(),
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
    ...timestampFields,
    ...softDeleteField,
  },
  (table) => {
    return {
      businessNameIdx: index("merchant_business_name_idx").on(
        table.businessName
      ),
      statusIdx: index("merchant_status_idx").on(table.status),
      categoryIdx: index("merchant_category_idx").on(table.category),
    };
  }
);

// Define the transactions table
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    type: transactionTypeEnum("type").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    merchantId: uuid("merchant_id").references(() => merchants.id, {
      onDelete: "set null",
    }),
    status: transactionStatusEnum("status").notNull(),
    declineReason: text("decline_reason"),
    pinVerified: boolean("pin_verified"),
    description: text("description"),
    reference: text("reference"),
    metadata: text("metadata"), // JSON stringified additional data
    ...timestampFields,
  },
  (table) => {
    return {
      accountIdIdx: index("transaction_account_id_idx").on(table.accountId),
      merchantIdIdx: index("transaction_merchant_id_idx").on(table.merchantId),
      timestampIdx: index("transaction_timestamp_idx").on(table.timestamp),
      statusIdx: index("transaction_status_idx").on(table.status),
      typeIdx: index("transaction_type_idx").on(table.type),
    };
  }
);

// Define the admin logs table
export const adminLogs = pgTable(
  "admin_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    adminId: uuid("admin_id").references(() => administrators.id, {
      onDelete: "set null",
    }),
    adminEmail: text("admin_email")
      .notNull()
      .references(() => administrators.email, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestampFields,
  },
  (table) => {
    return {
      timestampIdx: index("admin_log_timestamp_idx").on(table.timestamp),
      adminIdIdx: index("admin_log_admin_id_idx").on(table.adminId),
      actionIdx: index("admin_log_action_idx").on(table.action),
    };
  }
);

// Many-to-many relationship for account permissions
export const accountPermissions = pgTable(
  "account_permissions",
  {
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => administrators.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestampFields,
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.accountId, table.adminId, table.permission],
      }),
      accountIdIdx: index("account_permission_account_id_idx").on(
        table.accountId
      ),
      adminIdIdx: index("account_permission_admin_id_idx").on(table.adminId),
    };
  }
);

// Define relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  permissions: many(accountPermissions),
}));

export const merchantsRelations = relations(merchants, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  merchant: one(merchants, {
    fields: [transactions.merchantId],
    references: [merchants.id],
  }),
}));

export const administratorsRelations = relations(
  administrators,
  ({ many }) => ({
    adminLogs: many(adminLogs),
    accountPermissions: many(accountPermissions),
  })
);

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  administrator: one(administrators, {
    fields: [adminLogs.adminId],
    references: [administrators.id],
  }),
}));

export const accountPermissionsRelations = relations(
  accountPermissions,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accountPermissions.accountId],
      references: [accounts.id],
    }),
    administrator: one(administrators, {
      fields: [accountPermissions.adminId],
      references: [administrators.id],
    }),
  })
);

// Zod schemas for type validation
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

export const insertAccountPermissionSchema =
  createInsertSchema(accountPermissions);
export const selectAccountPermissionSchema =
  createSelectSchema(accountPermissions);

// Custom schemas with additional validation
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
    displayId: z.string().optional(),
    guardianDob: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  });

export const createPublicRegistrationSchema = createAccountSchema
  .omit({
    status: true,
    hashedPin: true,
    displayId: true,
    currentQrToken: true,
  })
  .extend({
    pin: z
      .string()
      .length(4, "PIN must be exactly 4 digits")
      .regex(/^\d+$/, "PIN must contain only digits"),
    guardianDob: z.string().min(1, "Guardian date of birth is required"),
    submissionLanguage: z.string().optional(),
  });

export const createMerchantSchema = insertMerchantSchema
  .omit({
    id: true,
    submittedAt: true,
    updatedAt: true,
    createdAt: true,
    deletedAt: true,
    pinVerified: true,
    declineReason: true,
  })
  .extend({
    businessName: z.string().min(1, "Business name is required"),
    contactEmail: z.string().email("Invalid email address").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    category: z.string().optional(),
  });

export const createTransactionSchema = insertTransactionSchema
  .omit({
    id: true,
    timestamp: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    amount: z.number().positive("Amount must be positive"),
    accountId: z.string().uuid("Invalid account ID"),
    merchantId: z.string().uuid("Invalid merchant ID").optional(),
  });

export const createAdminLogSchema = insertAdminLogSchema
  .omit({
    id: true,
    timestamp: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    adminId: z.string().uuid("Invalid admin ID"),
    action: z.string().min(1, "Action is required"),
  });

export const createAccountPermissionSchema =
  insertAccountPermissionSchema.extend({
    accountId: z.string().uuid("Invalid account ID"),
    adminId: z.string().uuid("Invalid admin ID"),
    permission: z.string().min(1, "Permission is required"),
  });
