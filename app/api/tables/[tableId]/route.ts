import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { restaurantTable, qrCode } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as z from "zod";

/**
 * Validation schema for updating a table
 */
const updateTableSchema = z.object({
  tableNumber: z
    .string()
    .min(1, "Table number is required")
    .max(10, "Table number must be 10 characters or less")
    .optional(),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity cannot exceed 20")
    .optional(),
  section: z.string().nullable().optional(),
  isQrEnabled: z.boolean().optional(),
  // Floor plan positioning fields
  floorId: z.string().nullable().optional(),
  xPosition: z.number().nullable().optional(),
  yPosition: z.number().nullable().optional(),
  width: z.number().min(40).max(200).optional(),
  height: z.number().min(40).max(200).optional(),
  shape: z.enum(["rectangular", "circular", "oval", "bar"]).optional(),
});

/**
 * PATCH /api/tables/[tableId]
 * Updates a specific table's details
 * Requires admin or owner permissions
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTableSchema.parse(body);

    // TODO: Add permission check for admin/owner role

    // Build update object with only provided fields
    const updateData: Partial<typeof restaurantTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (validatedData.tableNumber !== undefined) {
      updateData.tableNumber = validatedData.tableNumber;
    }
    if (validatedData.capacity !== undefined) {
      updateData.capacity = validatedData.capacity;
    }
    if (validatedData.section !== undefined) {
      updateData.section = validatedData.section;
    }
    if (validatedData.isQrEnabled !== undefined) {
      updateData.isQrEnabled = validatedData.isQrEnabled;
    }
    // Floor plan positioning fields
    if (validatedData.floorId !== undefined) {
      updateData.floorId = validatedData.floorId;
    }
    if (validatedData.xPosition !== undefined) {
      updateData.xPosition = validatedData.xPosition;
    }
    if (validatedData.yPosition !== undefined) {
      updateData.yPosition = validatedData.yPosition;
    }
    if (validatedData.width !== undefined) {
      updateData.width = validatedData.width;
    }
    if (validatedData.height !== undefined) {
      updateData.height = validatedData.height;
    }
    if (validatedData.shape !== undefined) {
      updateData.shape = validatedData.shape;
    }

    // Update the table
    const updatedTable = await db
      .update(restaurantTable)
      .set(updateData)
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
      message: "Table updated successfully",
      table: updatedTable[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tables/[tableId]
 * Deletes a specific table and its associated QR code
 * Requires admin or owner permissions
 */
export async function DELETE(
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

    // TODO: Add permission check for admin/owner role

    // Delete associated QR codes first (due to foreign key constraint)
    await db.delete(qrCode).where(eq(qrCode.tableId, tableId));

    // Delete the table
    const deletedTable = await db
      .delete(restaurantTable)
      .where(eq(restaurantTable.id, tableId))
      .returning();

    if (!deletedTable.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}