import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table, organization, order, orderItem } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSecurityHeaders } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

interface OrderItemInput {
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

/**
 * POST /api/checkout/[tableId]/create-order
 *
 * Creates a new order for collaborative ordering (before payment)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
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

    // Get table data with organization
    const tableData = await db
      .select({
        table: table,
        organization: organization,
      })
      .from(table)
      .innerJoin(organization, eq(organization.id, table.organizationId))
      .where(eq(table.id, tableId))
      .limit(1);

    if (!tableData.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const { organization: org, table: tableInfo } = tableData[0];

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

      // Add new items to the existing order
      const newItems = items.map((item: OrderItemInput) => ({
        id: randomUUID(),
        orderId: existingOrderId,
        menuItemId: item.menuItemId || null,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * item.quantity).toString(),
        specialInstructions: item.notes || null,
        status: "pending",
      }));

      await db.insert(orderItem).values(newItems);

      // Update order total
      const newTotal = parseFloat(existingOrder.totalAmount) + total;
      await db
        .update(order)
        .set({
          totalAmount: newTotal.toString(),
          subtotal: newTotal.toString(), // Simplified, adjust as needed
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(order.id, existingOrderId));

      resultOrder = { ...existingOrder, totalAmount: newTotal.toString() };
    } else {
      // Create new order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const newOrderId = randomUUID();

      const [newOrder] = await db
        .insert(order)
        .values({
          id: newOrderId,
          organizationId: org.id,
          tableId: tableInfo.id,
          orderNumber,
          orderType: "dine_in",
          status: "ordering",
          subtotal: total.toString(),
          taxAmount: "0.00", // Calculate tax as needed
          tipAmount: null,
          totalAmount: total.toString(),
          isLocked: false,
        })
        .returning();

      // Insert order items
      const orderItems = items.map((item: OrderItemInput) => ({
        id: randomUUID(),
        orderId: newOrderId,
        menuItemId: item.menuItemId || null,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * item.quantity).toString(),
        specialInstructions: item.notes || null,
        status: "pending",
      }));

      await db.insert(orderItem).values(orderItems);

      resultOrder = newOrder;
    }

    return NextResponse.json(
      { order: resultOrder },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error creating order:", error);

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
