CREATE TABLE "account_display_id_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"prefix" text NOT NULL,
	"year" text NOT NULL,
	"current_value" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "unique_prefix_year_idx" ON "account_display_id_sequence" USING btree ("prefix","year");