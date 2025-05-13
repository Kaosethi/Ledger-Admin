CREATE TYPE "public"."account_status" AS ENUM('Pending', 'Active', 'Inactive', 'Suspended');--> statement-breakpoint
CREATE TYPE "public"."merchant_status" AS ENUM('pending_approval', 'active', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('Completed', 'Pending', 'Failed', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('Debit', 'Credit', 'Adjustment');--> statement-breakpoint
CREATE TABLE "account_permissions" (
	"account_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "account_permissions_account_id_admin_id_permission_pk" PRIMARY KEY("account_id","admin_id","permission")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_id" text NOT NULL,
	"child_name" text NOT NULL,
	"guardian_name" text NOT NULL,
	"status" "account_status" DEFAULT 'Active' NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"hashed_pin" text,
	"last_activity" timestamp with time zone DEFAULT now() NOT NULL,
	"current_qr_token" text,
	"guardian_dob" text,
	"guardian_contact" text,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "accounts_display_id_unique" UNIQUE("display_id")
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_id" uuid,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "administrators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "administrators_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"contact_person" text,
	"contact_email" text,
	"contact_phone" text,
	"store_address" text,
	"hashed_password" text,
	"status" "merchant_status" DEFAULT 'pending_approval' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decline_reason" text,
	"pin_verified" boolean DEFAULT false,
	"category" text,
	"website" text,
	"description" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "merchants_contact_email_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"account_id" uuid NOT NULL,
	"merchant_id" uuid,
	"status" "transaction_status" NOT NULL,
	"decline_reason" text,
	"pin_verified" boolean,
	"description" text,
	"reference" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_permissions" ADD CONSTRAINT "account_permissions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_permissions" ADD CONSTRAINT "account_permissions_admin_id_administrators_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."administrators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_administrators_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."administrators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_email_administrators_email_fk" FOREIGN KEY ("admin_email") REFERENCES "public"."administrators"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_permission_account_id_idx" ON "account_permissions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_permission_admin_id_idx" ON "account_permissions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "account_display_id_idx" ON "accounts" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "account_status_idx" ON "accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "account_last_activity_idx" ON "accounts" USING btree ("last_activity");--> statement-breakpoint
CREATE INDEX "admin_log_timestamp_idx" ON "admin_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "admin_log_admin_id_idx" ON "admin_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_log_action_idx" ON "admin_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_email_idx" ON "administrators" USING btree ("email");--> statement-breakpoint
CREATE INDEX "merchant_business_name_idx" ON "merchants" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "merchant_status_idx" ON "merchants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "merchant_category_idx" ON "merchants" USING btree ("category");--> statement-breakpoint
CREATE INDEX "transaction_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transaction_merchant_id_idx" ON "transactions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "transaction_timestamp_idx" ON "transactions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "transaction_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_type_idx" ON "transactions" USING btree ("type");