import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, table } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
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

    // Fetch the order
    const existingOrder = await db.query.order.findFirst({
      where: eq(order.id, orderId),
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check permission to delete orders
    const canDeleteOrder = await auth.api.hasPermission({
      headers: reqHeaders,
      body: {
        permission: { order: ["delete"] },
        organizationId: existingOrder.organizationId,
      },
    });

    if (!canDeleteOrder?.success) {
      return NextResponse.json(
        { error: "You don't have permission to delete orders" },
        { status: 403 }
      );
    }

    // Delete the order and its items in a transaction
    await db.transaction(async (tx) => {
      // Delete all order items
      await tx.delete(orderItem).where(eq(orderItem.orderId, orderId));

      // Delete the order
      await tx.delete(order).where(eq(order.id, orderId));

      // If order had a table, update table status to available
      if (existingOrder.tableId) {
        await tx
          .update(table)
          .set({ status: "available" })
          .where(eq(table.id, existingOrder.tableId));
      }
    });

    return NextResponse.json(
      { success: true, message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
