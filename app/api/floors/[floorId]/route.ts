import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { floor, table } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updateFloorSchema = z.object({
  name: z.string().min(1).optional(),
  displayOrder: z.number().optional(),
  canvasWidth: z.number().min(400).max(2000).optional(),
  canvasHeight: z.number().min(300).max(1500).optional(),
});

/**
 * GET /api/floors/[floorId]
 * Get a single floor by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const { floorId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const floorData = await db
      .select()
      .from(floor)
      .where(eq(floor.id, floorId))
      .limit(1);

    if (!floorData.length) {
      return NextResponse.json(
        { error: "Floor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      floor: floorData[0],
    });
  } catch (error) {
    console.error("Error fetching floor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/floors/[floorId]
 * Update a floor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const { floorId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateFloorSchema.parse(body);

    // Check if floor exists
    const existingFloor = await db
      .select()
      .from(floor)
      .where(eq(floor.id, floorId))
      .limit(1);

    if (!existingFloor.length) {
      return NextResponse.json(
        { error: "Floor not found" },
        { status: 404 }
      );
    }

    // Update the floor
    const updatedFloor = await db
      .update(floor)
      .set({
        ...validatedData,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(floor.id, floorId))
      .returning();

    return NextResponse.json({
      success: true,
      floor: updatedFloor[0],
    });
  } catch (error) {
    console.error("Error updating floor:", error);

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

/**
 * DELETE /api/floors/[floorId]
 * Delete a floor (tables on this floor will have floorId set to null)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const { floorId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if floor exists
    const existingFloor = await db
      .select()
      .from(floor)
      .where(eq(floor.id, floorId))
      .limit(1);

    if (!existingFloor.length) {
      return NextResponse.json(
        { error: "Floor not found" },
        { status: 404 }
      );
    }

    // Reset floorId for tables on this floor (they become unplaced)
    await db
      .update(table)
      .set({
        floorId: null,
        xPosition: null,
        yPosition: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(table.floorId, floorId));

    // Delete the floor
    await db.delete(floor).where(eq(floor.id, floorId));

    return NextResponse.json({
      success: true,
      message: "Floor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting floor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
