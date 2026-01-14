import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table, organization, menuItem, menuCategory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkQrScanRateLimit, getClientIP, getSecurityHeaders, getCorsHeaders } from "@/lib/rate-limit";
import { getActivePaymentProcessor } from "@/server/payment-processors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limiting
    const rateLimitResult = checkQrScanRateLimit(clientIP);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
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

    // Get table data from database
    const tableData = await db
      .select({
        table: table,
        organization: organization
      })
      .from(table)
      .innerJoin(organization, eq(organization.id, table.organizationId))
      .where(eq(table.id, tableId))
      .limit(1);

    if (!tableData.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    const { table: tableInfo, organization: org } = tableData[0];

    // Check if table NFC is enabled
    if (!tableInfo.isNfcEnabled) {
      return NextResponse.json(
        { error: "NFC ordering is disabled for this table" },
        { status: 403 }
      );
    }

    // Update scan count and last scanned timestamp
    await db
      .update(table)
      .set({
        nfcScanCount: (tableInfo.nfcScanCount || 0) + 1,
        lastNfcScanAt: new Date(),
      })
      .where(eq(table.id, tableId));

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
        id: tableInfo.id,
        tableNumber: tableInfo.tableNumber,
        capacity: tableInfo.capacity,
        scanCount: (tableInfo.nfcScanCount || 0) + 1
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

