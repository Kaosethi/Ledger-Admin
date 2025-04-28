CREATE TYPE "public"."account_status" AS ENUM('Active', 'Inactive', 'Suspended');--> statement-breakpoint
CREATE TYPE "public"."merchant_status" AS ENUM('Pending', 'Active', 'Suspended', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('Completed', 'Pending', 'Failed', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('Debit', 'Credit', 'Adjustment');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"child_name" text NOT NULL,
	"guardian_name" text NOT NULL,
	"status" "account_status" DEFAULT 'Active' NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"hashed_pin" text,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"current_qr_token" text,
	"guardian_dob" text,
	"guardian_contact" text,
	"address" text,
	CONSTRAINT "accounts_current_qr_token_unique" UNIQUE("current_qr_token")
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text
);
--> statement-breakpoint
CREATE TABLE "administrators" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "administrators_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"contact_person" text,
	"contact_email" text,
	"contact_phone" text,
	"store_address" text,
	"hashed_password" text,
	"status" "merchant_status" DEFAULT 'Pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"decline_reason" text,
	"pin_verified" boolean DEFAULT false,
	"category" text,
	CONSTRAINT "merchants_contact_email_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"account_id" text NOT NULL,
	"merchant_id" text,
	"status" "transaction_status" NOT NULL,
	"decline_reason" text,
	"pin_verified" boolean,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_email_administrators_email_fk" FOREIGN KEY ("admin_email") REFERENCES "public"."administrators"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;