import { db } from "@/db";
import { order } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { OrdersView } from "@/components/orders/orders-view";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;

  // Fetch orders with related data
  const orders = await db.query.order.findMany({
    where: eq(order.organizationId, orgId),
    with: {
      table: true,
      orderItems: {
        with: {
          menuItem: true,
        },
      },
    },
    orderBy: [desc(order.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
      </div>

      <OrdersView orders={orders} userId={userId} orgId={orgId} />
    </div>
  );
}
