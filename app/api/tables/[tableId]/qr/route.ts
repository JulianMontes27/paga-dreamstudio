import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { restaurantTable, qrCode, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQRCode, generateCheckoutUrl, generateQRCodeId, generateExpirationDate } from "@/lib/qr-code";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const updateQrSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional()
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

    // Get QR code for the table
    const qrCodeData = await db
      .select()
      .from(qrCode)
      .where(eq(qrCode.tableId, tableId))
      .limit(1);

    if (!qrCodeData.length) {
      return NextResponse.json(
        { error: "QR code not found for this table" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: qrCodeData[0]
    });

  } catch (error) {
    console.error("Error fetching QR code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const validatedData = updateQrSchema.parse(body);

    // Check if QR code exists
    const existingQrCode = await db
      .select()
      .from(qrCode)
      .where(eq(qrCode.tableId, tableId))
      .limit(1);

    if (!existingQrCode.length) {
      return NextResponse.json(
        { error: "QR code not found for this table" },
        { status: 404 }
      );
    }

    // Update QR code
    const updateData: Partial<typeof qrCode.$inferInsert> = {};

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    if (validatedData.expiresAt) {
      updateData.expiresAt = new Date(validatedData.expiresAt);
    }

    updateData.updatedAt = new Date();

    const updatedQrCode = await db
      .update(qrCode)
      .set(updateData)
      .where(eq(qrCode.tableId, tableId))
      .returning();

    return NextResponse.json({
      success: true,
      qrCode: updatedQrCode[0]
    });

  } catch (error) {
    console.error("Error updating QR code:", error);

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

export async function POST(
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

    // Get table details
    const table = await db
      .select({
        table: restaurantTable,
        organization: organization
      })
      .from(restaurantTable)
      .leftJoin(organization, eq(organization.id, restaurantTable.organizationId))
      .where(eq(restaurantTable.id, tableId))
      .limit(1);

    if (!table.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    const { table: tableData, organization: orgData } = table[0];

    // Check if QR code already exists
    const existingQrCode = await db
      .select()
      .from(qrCode)
      .where(eq(qrCode.tableId, tableId))
      .limit(1);

    if (existingQrCode.length > 0) {
      // Regenerate QR code
      const organizationSlug = orgData?.slug || tableData.organizationId;
      const newQrCodeString = generateQRCode(organizationSlug, tableData.tableNumber);
      const newCheckoutUrl = generateCheckoutUrl(BASE_URL, newQrCodeString);

      const updatedQrCode = await db
        .update(qrCode)
        .set({
          code: newQrCodeString,
          checkoutUrl: newCheckoutUrl,
          isActive: true,
          scanCount: 0,
          lastScannedAt: null,
          expiresAt: generateExpirationDate(365),
          updatedAt: new Date()
        })
        .where(eq(qrCode.tableId, tableId))
        .returning();

      return NextResponse.json({
        success: true,
        qrCode: updatedQrCode[0],
        message: "QR code regenerated successfully"
      });
    } else {
      // Create new QR code
      const organizationSlug = orgData?.slug || tableData.organizationId;
      const qrCodeString = generateQRCode(organizationSlug, tableData.tableNumber);
      const checkoutUrl = generateCheckoutUrl(BASE_URL, qrCodeString);
      const qrCodeId = generateQRCodeId();

      const newQrCode = await db
        .insert(qrCode)
        .values({
          id: qrCodeId,
          organizationId: tableData.organizationId,
          tableId: tableId,
          code: qrCodeString,
          checkoutUrl: checkoutUrl,
          isActive: true,
          scanCount: 0,
          expiresAt: generateExpirationDate(365)
        })
        .returning();

      return NextResponse.json({
        success: true,
        qrCode: newQrCode[0],
        message: "QR code created successfully"
      }, { status: 201 });
    }

  } catch (error) {
    console.error("Error regenerating QR code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}