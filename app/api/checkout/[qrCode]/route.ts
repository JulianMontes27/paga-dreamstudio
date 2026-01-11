import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCode, restaurantTable, organization, menuItem, menuCategory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { parseQRCode, isQRCodeExpired, QRCodeSecurity } from "@/lib/qr-code";
import { checkQrScanRateLimit, getClientIP, getSecurityHeaders, getCorsHeaders } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/validation/table-schemas";
import { getActivePaymentProcessor } from "@/server/payment-processors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode: qrCodeParam } = await params;

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limiting
    const rateLimitResult = checkQrScanRateLimit(clientIP);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: "Too many QR code scans. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            "Retry-After": Math.ceil(
              ((rateLimitResult.resetTime || 0) - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Sanitize QR code input using both methods for extra security
    const sanitizedQrCode = sanitizeInput.qrCode(
      QRCodeSecurity.sanitizeQRCode(qrCodeParam)
    );

    // Parse and validate QR code format
    const parsedQrCode = parseQRCode(sanitizedQrCode);

    if (!parsedQrCode) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400 }
      );
    }

    // Get QR code data from database
    const qrCodeData = await db
      .select({
        qrCode: qrCode,
        table: restaurantTable,
        organization: organization
      })
      .from(qrCode)
      .innerJoin(restaurantTable, eq(restaurantTable.id, qrCode.tableId))
      .innerJoin(organization, eq(organization.id, qrCode.organizationId))
      .where(eq(qrCode.code, sanitizedQrCode))
      .limit(1);

    if (!qrCodeData.length) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      );
    }

    const { qrCode: qrData, table, organization: org } = qrCodeData[0];

    // Check if QR code is active
    if (!qrData.isActive) {
      return NextResponse.json(
        { error: "QR code is inactive" },
        { status: 403 }
      );
    }

    // Check if QR code is expired
    if (isQRCodeExpired(qrData.expiresAt)) {
      return NextResponse.json(
        { error: "QR code has expired" },
        { status: 410 }
      );
    }

    // Check if table QR is enabled
    if (!table.isQrEnabled) {
      return NextResponse.json(
        { error: "QR ordering is disabled for this table" },
        { status: 403 }
      );
    }

    // Update scan count and last scanned timestamp
    await db
      .update(qrCode)
      .set({
        scanCount: (qrData.scanCount || 0) + 1,
        lastScannedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(qrCode.id, qrData.id));

    // Get menu items for the organization
    const menuItems = await db
      .select({
        item: menuItem,
        category: menuCategory
      })
      .from(menuItem)
      .leftJoin(menuCategory, eq(menuCategory.id, menuItem.categoryId))
      .where(
        and(
          eq(menuItem.organizationId, org.id),
          eq(menuItem.isAvailable, true)
        )
      );

    // Group menu items by category
    const groupedMenu = menuItems.reduce((acc, row) => {
      const categoryName = row.category?.name || "Uncategorized";

      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: row.category,
          items: []
        };
      }

      acc[categoryName].items.push(row.item);
      return acc;
    }, {} as Record<string, { category: typeof menuCategory.$inferSelect | null; items: (typeof menuItem.$inferSelect)[] }>);

    // Fetch active payment processor for the organization
    // This is critical for checkout - we need to know which processor to use for payments
    const activePaymentProcessor = await getActivePaymentProcessor(org.id);

    return NextResponse.json({
      success: true,
      restaurant: {
        id: org.id,
        name: org.name,
        slug: org.slug
      },
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        section: table.section
      },
      qrCode: {
        id: qrData.id,
        code: qrData.code,
        scanCount: (qrData.scanCount || 0) + 1
      },
      menu: Object.values(groupedMenu),
      // Payment processor type - frontend only needs to know which UI to show
      // Actual payment processing happens server-side with the restaurant's access token
      paymentProcessor: activePaymentProcessor ? activePaymentProcessor.processorType : null
    }, {
      headers: {
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get("origin") || undefined),
      }
    });

  } catch (error) {
    console.error("Error processing QR code scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}

