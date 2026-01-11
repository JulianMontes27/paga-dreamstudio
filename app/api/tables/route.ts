import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { restaurantTable, qrCode, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateQRCode,
  generateCheckoutUrl,
  generateQRCodeId,
  generateExpirationDate,
} from "@/lib/qr-code";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  section: z.string().optional(),
  generateQr: z.boolean().default(true),
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

    // Get organization details for QR code generation
    const org = await db
      .select({ slug: organization.slug })
      .from(organization)
      .where(eq(organization.id, validatedData.organizationId))
      .limit(1);

    if (!org.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const organizationSlug = org[0].slug || validatedData.organizationId;

    // Check if table number already exists in this organization
    const existingTable = await db
      .select()
      .from(restaurantTable)
      .where(
        and(
          eq(restaurantTable.organizationId, validatedData.organizationId),
          eq(restaurantTable.tableNumber, validatedData.tableNumber)
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
      .insert(restaurantTable)
      .values({
        id: tableId,
        organizationId: validatedData.organizationId,
        tableNumber: validatedData.tableNumber,
        capacity: validatedData.capacity,
        section: validatedData.section || null,
        isQrEnabled: validatedData.generateQr,
        status: "available",
      })
      .returning();

    let qrCodeData = null;

    // Generate QR code if requested
    if (validatedData.generateQr) {
      const qrCodeString = generateQRCode(
        organizationSlug,
        validatedData.tableNumber
      );
      const checkoutUrl = generateCheckoutUrl(BASE_URL, qrCodeString);
      const qrCodeId = generateQRCodeId();
      const expiresAt = generateExpirationDate(365); // 1 year expiration

      const newQrCode = await db
        .insert(qrCode)
        .values({
          id: qrCodeId,
          organizationId: validatedData.organizationId,
          tableId: tableId,
          code: qrCodeString,
          checkoutUrl: checkoutUrl,
          isActive: true,
          scanCount: 0,
          expiresAt: expiresAt,
        })
        .returning();

      qrCodeData = newQrCode[0];
    }

    return NextResponse.json(
      {
        success: true,
        table: newTable[0],
        qrCode: qrCodeData,
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

    // Get all tables for the organization with their QR codes
    const tables = await db
      .select({
        table: restaurantTable,
        qrCode: qrCode,
      })
      .from(restaurantTable)
      .leftJoin(qrCode, eq(qrCode.tableId, restaurantTable.id))
      .where(eq(restaurantTable.organizationId, organizationId));

    // Group the results
    const tablesWithQrCodes = tables.reduce((acc, row) => {
      const existingTable = acc.find((t) => t.id === row.table.id);

      if (existingTable) {
        if (row.qrCode) {
          existingTable.qrCode = row.qrCode;
        }
      } else {
        acc.push({
          ...row.table,
          qrCode: row.qrCode,
        });
      }

      return acc;
    }, [] as Array<typeof restaurantTable.$inferSelect & { qrCode: typeof qrCode.$inferSelect | null }>);

    return NextResponse.json({
      success: true,
      tables: tablesWithQrCodes,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
