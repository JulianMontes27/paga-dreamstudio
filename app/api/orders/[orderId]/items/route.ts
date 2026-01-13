import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, menuItem } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const reqHeaders = await headers();

    // Check authentication
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as { items: OrderItemInput[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate all items
    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have a valid menuItemId and quantity >= 1" },
          { status: 400 }
        );
      }
    }

    // Fetch the order
    const existingOrder = await db.query.order.findFirst({
      where: eq(order.id, orderId),
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check permission to update orders
    const canUpdateOrder = await auth.api.hasPermission({
      headers: reqHeaders,
      body: {
        permission: { order: ["update"] },
        organizationId: existingOrder.organizationId,
      },
    });

    if (!canUpdateOrder?.success) {
      return NextResponse.json(
        { error: "You don't have permission to update orders" },
        { status: 403 }
      );
    }

    // Fetch all menu items at once
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await db.query.menuItem.findMany({
      where: and(
        inArray(menuItem.id, menuItemIds),
        eq(menuItem.organizationId, existingOrder.organizationId)
      ),
    });

    // Create a map for quick lookup
    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    // Validate all menu items exist
    for (const item of items) {
      if (!menuItemMap.has(item.menuItemId)) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 404 }
        );
      }
    }

    // Create all order items and update order totals in a transaction
    const result = await db.transaction(async (tx) => {
      const newOrderItems = [];
      let totalAdded = 0;

      // Create all order items
      for (const item of items) {
        const menuItemData = menuItemMap.get(item.menuItemId)!;
        const unitPrice = parseFloat(menuItemData.price);
        const totalPrice = unitPrice * item.quantity;
        totalAdded += totalPrice;

        const [newItem] = await tx
          .insert(orderItem)
          .values({
            id: crypto.randomUUID(),
            orderId,
            menuItemId: item.menuItemId,
            itemName: menuItemData.name,
            quantity: item.quantity,
            unitPrice: unitPrice.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            specialInstructions: item.specialInstructions || null,
            status: "pending",
          })
          .returning();

        newOrderItems.push(newItem);
      }

      // Recalculate order totals
      const currentSubtotal = parseFloat(existingOrder.subtotal);
      const newSubtotal = currentSubtotal + totalAdded;
      const taxRate = 0.1; // 10% tax - adjust as needed
      const newTaxAmount = newSubtotal * taxRate;
      const newTotalAmount = newSubtotal + newTaxAmount;

      // Update the order
      await tx
        .update(order)
        .set({
          subtotal: newSubtotal.toFixed(2),
          taxAmount: newTaxAmount.toFixed(2),
          totalAmount: newTotalAmount.toFixed(2),
        })
        .where(eq(order.id, orderId));

      return newOrderItems;
    });

    return NextResponse.json({ orderItems: result }, { status: 201 });
  } catch (error) {
    console.error("Error adding order items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
