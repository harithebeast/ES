CREATE TYPE "public"."bhk" AS ENUM('1', '2', '3', '4', 'Studio');--> statement-breakpoint
CREATE TYPE "public"."city" AS ENUM('Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('Apartment', 'Villa', 'Plot', 'Office', 'Retail');--> statement-breakpoint
CREATE TYPE "public"."purpose" AS ENUM('Buy', 'Rent');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('Website', 'Referral', 'Walk-in', 'Call', 'Other');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped');--> statement-breakpoint
CREATE TYPE "public"."timeline" AS ENUM('0-3m', '3-6m', '>6m', 'Exploring');--> statement-breakpoint
CREATE TABLE "buyer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"diff" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"city" "city" NOT NULL,
	"property_type" "property_type" NOT NULL,
	"bhk" "bhk",
	"purpose" "purpose" NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"timeline" timeline NOT NULL,
	"source" "source" NOT NULL,
	"status" "status" DEFAULT 'New' NOT NULL,
	"notes" text,
	"tags" text[],
	"owner_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buyer_history" ADD CONSTRAINT "buyer_history_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE cascade ON UPDATE no action;