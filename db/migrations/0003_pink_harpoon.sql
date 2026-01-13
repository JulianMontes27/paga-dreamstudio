-- Drop the foreign key constraint first
ALTER TABLE "order" DROP CONSTRAINT IF EXISTS "order_table_id_table_id_fk";--> statement-breakpoint

-- Convert table.id to uuid
ALTER TABLE "table" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "table" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

-- Convert order.table_id to uuid
ALTER TABLE "order" ALTER COLUMN "table_id" SET DATA TYPE uuid USING table_id::uuid;--> statement-breakpoint

-- Recreate the foreign key constraint
ALTER TABLE "order" ADD CONSTRAINT "order_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE SET NULL;
