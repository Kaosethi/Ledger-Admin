CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "payments_display_id_unique" UNIQUE("display_id")
);
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "merchant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "display_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "display_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "payment_display_id_idx" ON "payments" USING btree ("display_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "merchant_display_id_idx" ON "merchants" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "transaction_display_id_idx" ON "transactions" USING btree ("display_id");--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_display_id_unique" UNIQUE("display_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_display_id_unique" UNIQUE("display_id");