import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table, order, orderItem } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getSecurityHeaders } from "@/lib/rate-limit";

/**
 * GET /api/checkout/[tableId]/table-orders
 *
 * Fetches all orders for a specific table (for collaborative ordering view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    // Verify table exists
    const tableData = await db
      .select()
      .from(table)
      .where(eq(table.id, tableId))
      .limit(1);

    if (!tableData.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    // Find all active orders for this table
    const orders = await db
      .select()
      .from(order)
      .where(
        and(
          eq(order.tableId, tableId),
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
