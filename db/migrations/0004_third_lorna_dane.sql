  CREATE TYPE "public"."table_status" AS ENUM('available', 'occupied', 'reserved', 'cleaning');
  ALTER TABLE "table" ALTER COLUMN "status" SET DEFAULT 'available'::"public"."table_status";
  ALTER TABLE "table" ALTER COLUMN "status" SET DATA TYPE "public"."table_status" USING "status"::"public"."table_status";