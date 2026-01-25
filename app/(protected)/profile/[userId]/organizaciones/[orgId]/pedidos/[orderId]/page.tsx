import { db } from "@/db";
import { order, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string; orderId: string }>;
}) {
  const { orgId, orderId } = await params;

  // Fetch the order with related data
  const orderData = await db.query.order.findFirst({
    where: and(eq(order.id, orderId), eq(order.organizationId, orgId)),
    with: {
      table: true,
      orderItems: {
        with: {
          menuItem: true,
        },
      },
      paymentClaims: true,
    },
  });

  if (!orderData) {
    notFound();
  }

  const menuItems = await db.query.menuItem.findMany({
    where: eq(organization.id, orgId),
    with: {
      menuCategory: true,
    },
  });

  return (
    <OrderDetailView order={orderData} orgId={orgId} menuItems={menuItems} />
  );
}
