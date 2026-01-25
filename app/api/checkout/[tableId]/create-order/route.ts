import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table, organization, order, orderItem } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  { params }: { params: Promise<{ tableId: string }> },
) {
  try {
    const { tableId } = await params;
    const body = await request.json();

    // Validate request body
    const { items, total, orderId: existingOrderId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order items" },
        { status: 400 },
      );
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json(
        { error: "Invalid order total" },
        { status: 400 },
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
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
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
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
      const orderItemsData = items.map((item: OrderItemInput) => ({
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
          tableId: tableInfo.id,
          orderNumber: orderNumber,
          status: "ordering", // Indicates collaborative ordering mode
          orderType: "dine-in",
          subtotal: total.toString(),
          totalAmount: total.toString(),
          totalClaimed: "0.00",
          totalPaid: "0.00",
          isLocked: false,
          // tipAmount: "0.00",
          // notes: "Order created via collaborative checkout",
          // paymentStatus: "pending",
        })
        .returning();

      // Create order items
      const orderItemsData = items.map((item: OrderItemInput) => ({
        id: randomUUID(),
        orderId: orderId,
        menuItemId: item.menuItemId || null,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * item.quantity).toString(),
        specialInstructions: item.notes || null,
        status: "pending",
      }));

      await db.insert(orderItem).values(orderItemsData);

      resultOrder = newOrder;
    }

    return NextResponse.json({
      success: true,
      order: resultOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);

    return NextResponse.json(
      {
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
