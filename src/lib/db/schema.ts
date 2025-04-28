import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
  numeric,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ENUMs
export const accountStatusEnum = pgEnum("account_status", [
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

// Define the administrators table
export const administrators = pgTable("administrators", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define the accounts table
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  childName: text("child_name").notNull(),
  guardianName: text("guardian_name").notNull(),
  status: accountStatusEnum("status").default("Active").notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  hashedPin: text("hashed_pin"),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  currentQrToken: text("current_qr_token").unique(),
  guardianDob: text("guardian_dob"),
  guardianContact: text("guardian_contact"),
  address: text("address"),
});

// Define the merchants table
export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person"),
  contactEmail: text("contact_email").unique(),
  contactPhone: text("contact_phone"),
  storeAddress: text("store_address"),
  hashedPassword: text("hashed_password"),
  status: merchantStatusEnum("status").default("pending_approval").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  declineReason: text("decline_reason"),
  pinVerified: boolean("pin_verified").default(false),
  category: text("category"),
});

// Define the transactions table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  merchantId: text("merchant_id").references(() => merchants.id, {
    onDelete: "set null",
  }),
  status: transactionStatusEnum("status").notNull(),
  declineReason: text("decline_reason"),
  pinVerified: boolean("pin_verified"),
  description: text("description"),
});

// Define the admin logs table
export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  adminEmail: text("admin_email")
    .notNull()
    .references(() => administrators.email, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: text("details"),
});

// Define relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
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
  })
);

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  administrator: one(administrators, {
    fields: [adminLogs.adminEmail],
    references: [administrators.email],
  }),
}));

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

// Custom schemas with additional validation
export const createAdministratorSchema = insertAdministratorSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    email: z.string().email(),
    password: z.string().min(8),
  });

export const createAccountSchema = insertAccountSchema.omit({
  createdAt: true,
  updatedAt: true,
  balance: true,
  lastActivity: true,
});

export const createMerchantSchema = insertMerchantSchema
  .omit({
    submittedAt: true,
    updatedAt: true,
    pinVerified: true,
    declineReason: true,
  })
  .extend({
    contactEmail: z.string().email().optional(),
    password: z.string().min(8).optional(),
  });

export const createTransactionSchema = insertTransactionSchema.omit({
  timestamp: true,
});

export const createAdminLogSchema = insertAdminLogSchema.omit({
  timestamp: true,
  id: true,
});
