import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { table, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  section: z.string().optional(),
  isNFCEnabled: z.boolean().default(true),
  organizationId: z.string().min(1, "Organization ID is required"),
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTableSchema.parse(body);

    // Verify user has permission to create tables in this organization
    // TODO: Add proper permission check here based on your auth system

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

    // Check if table number already exists in this organization
    const existingTable = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.organizationId, validatedData.organizationId),
          eq(table.tableNumber, validatedData.tableNumber)
        )
      )
      .limit(1);

    if (existingTable.length > 0) {
      return NextResponse.json(
        { error: "Table number already exists in this organization" },
        { status: 409 }
      );
    }

    // Generate unique table ID
    const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the table
    const newTable = await db
      .insert(table)
      .values({
        id: tableId,
        organizationId: validatedData.organizationId,
        tableNumber: validatedData.tableNumber,
        capacity: validatedData.capacity,
        section: validatedData.section || null,
        isNFCEnabled: validatedData.isNFCEnabled,
        nfcScanCount: 0,
        status: "available",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        table: newTable[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating table:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.cause },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
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

    // Get all tables for the organization
    const tables = await db
      .select()
      .from(table)
      .where(eq(table.organizationId, organizationId));

    return NextResponse.json({
      success: true,
      tables: tables,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
