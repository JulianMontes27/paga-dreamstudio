import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table, order } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { getSecurityHeaders } from "@/lib/rate-limit";

/**
 * GET /api/checkout/[tableId]/active-order
 *
 * Checks if the table has an active order (for collaborative ordering)
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

    const tableInfo = tableData[0];

    // Find active order for this table
    const [activeOrder] = await db
      .select()
      .from(order)
      .where(
        and(
          eq(order.tableId, tableInfo.id),
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
