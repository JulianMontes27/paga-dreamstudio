import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { restaurantTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Update Table Status Schema
 */
const updateStatusSchema = z.object({
  status: z.enum(["available", "occupied", "reserved", "cleaning"]),
});

/**
 * PATCH /api/tables/[tableId]/status
 * Updates the status of a specific table
 * Requires authentication and table access permissions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { tableId } = await params;
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Update table status
    const updatedTable = await db
      .update(restaurantTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(restaurantTable.id, tableId))
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
    console.error("Error updating table status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status value", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}