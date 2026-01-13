import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { table } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const tablePositionSchema = z.object({
  id: z.string(),
  floorId: z.string().nullable().optional(),
  xPosition: z.number().nullable(),
  yPosition: z.number().nullable(),
  width: z.number().min(40).max(200).optional(),
  height: z.number().min(40).max(200).optional(),
  shape: z.enum(["rectangular", "circular", "oval", "bar"]).optional(),
});

const bulkUpdateSchema = z.object({
  organizationId: z.string(),
  tables: z.array(tablePositionSchema),
});

/**
 * PATCH /api/tables/positions
 * Bulk update table positions for a floor plan
 * Updates all table positions in a single transaction
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = bulkUpdateSchema.parse(body);

    // Verify all tables belong to the organization
    const tableIds = validatedData.tables.map((t) => t.id);
    const existingTables = await db
      .select({ id: table.id, organizationId: table.organizationId })
      .from(table)
      .where(inArray(table.id, tableIds));

    const existingTableIds = new Set(existingTables.map((t) => t.id));
    const invalidTables = tableIds.filter((id) => !existingTableIds.has(id));

    if (invalidTables.length > 0) {
      return NextResponse.json(
        { error: "Some tables not found", invalidTableIds: invalidTables },
        { status: 404 }
      );
    }

    // Verify all tables belong to the specified organization
    const wrongOrgTables = existingTables.filter(
      (t) => t.organizationId !== validatedData.organizationId
    );

    if (wrongOrgTables.length > 0) {
      return NextResponse.json(
        { error: "Some tables do not belong to the specified organization" },
        { status: 403 }
      );
    }

    // Update all tables
    const updatePromises = validatedData.tables.map((tableUpdate) => {
      const updateData: Partial<typeof table.$inferInsert> = {
        xPosition: tableUpdate.xPosition,
        yPosition: tableUpdate.yPosition,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      };

      if (tableUpdate.floorId !== undefined) {
        updateData.floorId = tableUpdate.floorId;
      }
      if (tableUpdate.width !== undefined) {
        updateData.width = tableUpdate.width;
      }
      if (tableUpdate.height !== undefined) {
        updateData.height = tableUpdate.height;
      }
      if (tableUpdate.shape !== undefined) {
        updateData.shape = tableUpdate.shape;
      }

      return db
        .update(table)
        .set(updateData)
        .where(eq(table.id, tableUpdate.id));
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Updated ${validatedData.tables.length} table positions`,
      updatedCount: validatedData.tables.length,
    });
  } catch (error) {
    console.error("Error updating table positions:", error);

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
