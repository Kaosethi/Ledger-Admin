ALTER TABLE "merchants" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "status" SET DEFAULT 'pending_approval'::text;--> statement-breakpoint
DROP TYPE "public"."merchant_status";--> statement-breakpoint
CREATE TYPE "public"."merchant_status" AS ENUM('pending_approval', 'active', 'rejected', 'suspended');--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "status" SET DEFAULT 'pending_approval'::"public"."merchant_status";--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "status" SET DATA TYPE "public"."merchant_status" USING "status"::"public"."merchant_status";