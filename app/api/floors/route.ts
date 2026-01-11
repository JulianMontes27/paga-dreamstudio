import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { floor, organization } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const createFloorSchema = z.object({
  name: z.string().min(1, "Floor name is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  displayOrder: z.number().optional(),
  canvasWidth: z.number().min(400).max(2000).optional(),
  canvasHeight: z.number().min(300).max(1500).optional(),
});

/**
 * POST /api/floors
 * Create a new floor for an organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createFloorSchema.parse(body);

    // Verify organization exists
    const org = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, validatedData.organizationId))
      .limit(1);

    if (!org.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get the next display order if not provided
    let displayOrder = validatedData.displayOrder;
    if (displayOrder === undefined) {
      const existingFloors = await db
        .select({ displayOrder: floor.displayOrder })
        .from(floor)
        .where(eq(floor.organizationId, validatedData.organizationId))
        .orderBy(asc(floor.displayOrder));

      displayOrder = existingFloors.length > 0
        ? Math.max(...existingFloors.map(f => f.displayOrder ?? 0)) + 1
        : 0;
    }

    // Generate floor ID
    const floorId = `floor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the floor
    const newFloor = await db
      .insert(floor)
      .values({
        id: floorId,
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        displayOrder,
        canvasWidth: validatedData.canvasWidth ?? 800,
        canvasHeight: validatedData.canvasHeight ?? 600,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        floor: newFloor[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating floor:", error);

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
 * GET /api/floors?organizationId=xxx
 * Get all floors for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get all floors for the organization, ordered by displayOrder
    const floors = await db
      .select()
      .from(floor)
      .where(eq(floor.organizationId, organizationId))
      .orderBy(asc(floor.displayOrder));

    return NextResponse.json({
      success: true,
      floors,
    });
  } catch (error) {
    console.error("Error fetching floors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
