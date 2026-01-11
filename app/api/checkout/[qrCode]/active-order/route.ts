import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCode, restaurantTable, order } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { parseQRCode, QRCodeSecurity } from "@/lib/qr-code";
import { getSecurityHeaders } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/validation/table-schemas";

/**
 * GET /api/checkout/[qrCode]/active-order
 *
 * Checks if the table has an active order (for collaborative ordering)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode: qrCodeParam } = await params;

    // Sanitize and validate QR code
    const sanitizedQrCode = sanitizeInput.qrCode(
      QRCodeSecurity.sanitizeQRCode(qrCodeParam)
    );

    const parsedQrCode = parseQRCode(sanitizedQrCode);
    if (!parsedQrCode) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Get table from QR code
    const qrCodeData = await db
      .select({
        qrCode: qrCode,
        table: restaurantTable,
      })
      .from(qrCode)
      .innerJoin(restaurantTable, eq(restaurantTable.id, qrCode.tableId))
      .where(eq(qrCode.code, sanitizedQrCode))
      .limit(1);

    if (!qrCodeData.length) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const { table } = qrCodeData[0];

    // Find active order for this table
    const [activeOrder] = await db
      .select()
      .from(order)
      .where(
        and(
          eq(order.tableId, table.id),
          or(
            eq(order.status, "ordering"),
            eq(order.status, "payment_started"),
            eq(order.status, "partially_paid")
          )
        )
      )
      .orderBy(desc(order.createdAt))
      .limit(1);

    if (!activeOrder) {
      return NextResponse.json(
        { message: "No active order" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    return NextResponse.json(
      { order: activeOrder },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error fetching active order:", error);

    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
