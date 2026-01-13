ALTER TABLE "order" DROP CONSTRAINT "order_table_id_table_id_fk";
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE set null ON UPDATE no action;