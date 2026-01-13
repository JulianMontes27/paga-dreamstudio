import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { order, table } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();

    // Check authentication
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tableId, organizationId } = body;

    if (!tableId || !organizationId) {
      return NextResponse.json(
        { error: "tableId and organizationId are required" },
        { status: 400 }
      );
    }

    // Check permission to create orders
    const canCreateOrder = await auth.api.hasPermission({
      headers: reqHeaders,
      body: {
        permission: { order: ["create"] },
        organizationId,
      },
    });

    if (!canCreateOrder?.success) {
      return NextResponse.json(
        { error: "You don't have permission to create orders" },
        { status: 403 }
      );
    }

    // Fetch the table and validate its status
    const tableData = await db.query.table.findFirst({
      where: eq(table.id, tableId),
    });

    if (!tableData) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Verify table belongs to the organization
    if (tableData.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Table does not belong to this organization" },
        { status: 403 }
      );
    }

    // Check table status - cannot create orders for occupied, cleaning, or reserved tables
    const invalidStatuses = ["occupied", "cleaning", "reserved"];
    if (invalidStatuses.includes(tableData.status.toLowerCase())) {
      return NextResponse.json(
        { error: `Cannot create order. Table is ${tableData.status}` },
        { status: 400 }
      );
    }

    // Check if there's already an active order for this table
    const existingActiveOrder = await db.query.order.findFirst({
      where: (orders, { eq, and, inArray }) =>
        and(
          eq(orders.tableId, tableId),
          inArray(orders.status, ["ordering", "payment_started", "partially_paid"])
        ),
    });

    if (existingActiveOrder) {
      return NextResponse.json(
        { error: "This table already has an active order" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderCount = await db
      .select()
      .from(order)
      .where(eq(order.organizationId, organizationId));
    const orderNumber = `ORD-${String(orderCount.length + 1).padStart(4, "0")}`;

    // Create the order and update table status in a transaction
    const newOrder = await db.transaction(async (tx) => {
      // Create the order
      const [createdOrder] = await tx
        .insert(order)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          tableId,
          orderNumber,
          status: "ordering",
          orderType: "dine-in",
          subtotal: "0",
          taxAmount: "0",
          totalAmount: "0",
          createdBy: session.user.id,
        })
        .returning();

      // Update table status to occupied
      await tx
        .update(table)
        .set({ status: "occupied" })
        .where(eq(table.id, tableId));

      return createdOrder;
    });

    return NextResponse.json(
      { order: newOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
