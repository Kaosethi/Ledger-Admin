CREATE TYPE "public"."account_type" AS ENUM('CHILD_DISPLAY', 'MERCHANT_INTERNAL', 'SYSTEM');--> statement-breakpoint
DROP INDEX "account_permission_account_id_idx";--> statement-breakpoint
DROP INDEX "account_permission_admin_id_idx";--> statement-breakpoint
ALTER TABLE "account_permissions" DROP CONSTRAINT "account_permissions_account_id_admin_id_permission_pk";--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "contact_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "hashed_password" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "merchant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account_permissions" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "account_type" "account_type" DEFAULT 'CHILD_DISPLAY' NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "internal_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "settlement_bank_account_name" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "settlement_bank_name" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "settlement_bank_account_number" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "settlement_bank_swift_code" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "settlement_bank_branch_name" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_internal_account_id_accounts_id_fk" FOREIGN KEY ("internal_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_permissions_account_id_idx" ON "account_permissions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_permissions_admin_id_idx" ON "account_permissions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "account_permissions_permission_idx" ON "account_permissions" USING btree ("permission");--> statement-breakpoint
CREATE INDEX "account_account_type_idx" ON "accounts" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "merchant_internal_account_id_idx" ON "merchants" USING btree ("internal_account_id");--> statement-breakpoint
CREATE INDEX "transaction_payment_id_idx" ON "transactions" USING btree ("payment_id");--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_internal_account_id_unique" UNIQUE("internal_account_id");