import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Track NFC tag scans
 *
 * This endpoint is called when a customer taps their phone on an NFC tag.
 * It increments the scan count and updates the last scan timestamp.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId } = body;

    if (!tableId) {
      return NextResponse.json(
        { error: "tableId is required" },
        { status: 400 }
      );
    }

    // Update scan count and timestamp
    await db
      .update(table)
      .set({
        nfcScanCount: sql`${table.nfcScanCount} + 1`,
        lastNfcScanAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(table.id, tableId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking NFC scan:", error);
    return NextResponse.json(
      { error: "Failed to track scan" },
      { status: 500 }
    );
  }
}
