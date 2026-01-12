import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { table } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updateNFCSchema = z.object({
  isNFCEnabled: z.boolean().optional(),
});

/**
 * GET /api/tables/[tableId]/qr
 * Gets the NFC/QR settings for a table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get table NFC data
    const tableData = await db
      .select({
        id: table.id,
        tableNumber: table.tableNumber,
        isNFCEnabled: table.isNFCEnabled,
        nfcScanCount: table.nfcScanCount,
        lastNfcScanAt: table.lastNfcScanAt,
      })
      .from(table)
      .where(eq(table.id, tableId))
      .limit(1);

    if (!tableData.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tableData[0],
    });
  } catch (error) {
    console.error("Error fetching table NFC data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tables/[tableId]/qr
 * Updates NFC settings for a table
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateNFCSchema.parse(body);

    // Build update object
    const updateData: Partial<typeof table.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (validatedData.isNFCEnabled !== undefined) {
      updateData.isNFCEnabled = validatedData.isNFCEnabled;
    }

    // Update table
    const updatedTable = await db
      .update(table)
      .set(updateData)
      .where(eq(table.id, tableId))
      .returning();

    if (!updatedTable.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      table: updatedTable[0],
    });
  } catch (error) {
    console.error("Error updating table NFC settings:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
