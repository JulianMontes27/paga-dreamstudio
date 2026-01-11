import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCode, restaurantTable, order, orderItem } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { parseQRCode, QRCodeSecurity } from "@/lib/qr-code";
import { getSecurityHeaders } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/validation/table-schemas";

/**
 * GET /api/checkout/[qrCode]/table-orders
 *
 * Fetches all orders for a specific table (for collaborative ordering view)
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

    // Find all active orders for this table
    const orders = await db
      .select()
      .from(order)
      .where(
        and(
          eq(order.tableId, table.id),
          or(
            eq(order.status, "ordering"),
            eq(order.status, "payment_started"),
            eq(order.status, "partially_paid"),
            eq(order.status, "paid")
          )
        )
      )
      .orderBy(order.createdAt);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (ord) => {
        const items = await db
          .select()
          .from(orderItem)
          .where(eq(orderItem.orderId, ord.id));

        return {
          id: ord.id,
          orderNumber: ord.orderNumber,
          items: items.map((item) => ({
            name: item.itemName || "Unknown Item",
            quantity: item.quantity,
            price: item.unitPrice,
          })),
          totalAmount: ord.totalAmount,
          status: ord.status,
          createdAt: ord.createdAt,
        };
      })
    );

    return NextResponse.json(
      { orders: ordersWithItems },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error fetching table orders:", error);

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
