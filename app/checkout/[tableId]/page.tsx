import TableCheckoutInterface from "@/components/checkout-interface";
import { notFound } from "next/navigation";
import { db, table, order } from "@/db";
import { eq } from "drizzle-orm";

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
        where: eq(order.status, "ordering"),
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

  const orders = tableData.orders || [];

  // Find active order
  const activeOrder =
    orders.find(
      (o) =>
        o.status === "ordering" ||
        o.status === "payment_started" ||
        o.status === "partially_paid"
    ) || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <TableCheckoutInterface
        tableId={tableId}
        tableData={tableData}
        activeOrder={activeOrder}
      />
    </div>
  );
}
