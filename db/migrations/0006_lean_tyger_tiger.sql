CREATE TYPE "public"."order_status" AS ENUM('ordering', 'payment_started', 'partially_paid', 'paid', 'cancelled');--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "status" SET DEFAULT 'ordering'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";