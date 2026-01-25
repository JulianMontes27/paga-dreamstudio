import TableCheckoutInterface from "@/components/checkout-interface";
import { notFound } from "next/navigation";
import { db, table, order } from "@/db";
import { and, eq, or } from "drizzle-orm";

interface CheckoutPageProps {
  params: Promise<{ tableId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { tableId } = await params;

  if (!tableId) {
    notFound();
  }

  // Fetch table
  const tableData = await db.query.table.findFirst({
    where: eq(table.id, tableId),
    with: {
      orders: {
        // Get the ACTIVE (dine-in) Order
        where: and(
          eq(order.orderType, "dine-in"),
          or(
            eq(order.status, "ordering"),
            eq(order.status, "payment_started"),
            eq(order.status, "partially_paid"),
          ),
        ),
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        with: {
          orderItems: true,
        },
      },
    },
  });

  if (!tableData) {
    notFound();
  }

  const activeOrder = tableData.orders[0] ?? null;

  const cleanedActiveOrder = activeOrder
    ? {
        id: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        orderItems: activeOrder.orderItems,
        status: activeOrder.status,
        subtotal: activeOrder.subtotal,
        totalPaid: activeOrder.totalPaid,
      }
    : null;

  // Clean table data for the checkout interface
  const cleanedTableData = {
    id: tableData.id,
    tableNumber: tableData.tableNumber,
    organizationId: tableData.organizationId,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TableCheckoutInterface
        tableData={cleanedTableData}
        activeOrder={cleanedActiveOrder}
      />
    </div>
  );
}
