import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCode, restaurantTable, organization, order, orderItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseQRCode, QRCodeSecurity } from "@/lib/qr-code";
import { getSecurityHeaders } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/validation/table-schemas";
import { randomUUID } from "crypto";

/**
 * POST /api/checkout/[qrCode]/create-order
 *
 * Creates a new order for collaborative ordering (before payment)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode: qrCodeParam } = await params;
    const body = await request.json();

    // Validate request body
    const { items, total, orderId: existingOrderId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order items" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json(
        { error: "Invalid order total" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

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

    // Get QR code data with table and organization
    const qrCodeData = await db
      .select({
        qrCode: qrCode,
        table: restaurantTable,
        organization: organization,
      })
      .from(qrCode)
      .innerJoin(restaurantTable, eq(restaurantTable.id, qrCode.tableId))
      .innerJoin(organization, eq(organization.id, qrCode.organizationId))
      .where(eq(qrCode.code, sanitizedQrCode))
      .limit(1);

    if (!qrCodeData.length) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const { organization: org, table } = qrCodeData[0];

    let resultOrder;

    if (existingOrderId) {
      // Add items to existing order
      const [existingOrder] = await db
        .select()
        .from(order)
        .where(eq(order.id, existingOrderId))
        .limit(1);

      if (!existingOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      // Calculate new total
      const currentTotal = parseFloat(existingOrder.totalAmount);
      const newTotal = currentTotal + total;

      // Update order total
      const [updatedOrder] = await db
        .update(order)
        .set({
          totalAmount: newTotal.toFixed(2),
          subtotal: newTotal.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(order.id, existingOrderId))
        .returning();

      // Add new order items
      const orderItemsData = items.map((item: { name: string; quantity: number; price: number }) => ({
        id: randomUUID(),
        orderId: existingOrderId,
        menuItemId: null,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * item.quantity).toString(),
        status: "pending",
      }));

      await db.insert(orderItem).values(orderItemsData);

      resultOrder = updatedOrder;
    } else {
      // Create new order with "ordering" status for collaborative flow
      const orderId = randomUUID();
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [newOrder] = await db
        .insert(order)
        .values({
          id: orderId,
          organizationId: org.id,
          tableId: table.id,
          orderNumber: orderNumber,
          status: "ordering", // Indicates collaborative ordering mode
          orderType: "dine-in",
          subtotal: total.toString(),
          taxAmount: "0.00",
          tipAmount: "0.00",
          totalAmount: total.toString(),
          totalClaimed: "0.00",
          totalPaid: "0.00",
          isLocked: false,
          notes: "Order created via collaborative checkout",
          paymentStatus: "pending",
        })
        .returning();

      // Create order items
      const orderItemsData = items.map((item: { name: string; quantity: number; price: number }) => ({
        id: randomUUID(),
        orderId: orderId,
        menuItemId: null,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * item.quantity).toString(),
        status: "pending",
      }));

      await db.insert(orderItem).values(orderItemsData);

      resultOrder = newOrder;
    }

    return NextResponse.json(
      {
        success: true,
        order: resultOrder,
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error creating order:", error);

    return NextResponse.json(
      {
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
