ALTER TABLE "table" ADD COLUMN "nfc_scan_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "table" ADD COLUMN "last_nfc_scan_at" timestamp with time zone;