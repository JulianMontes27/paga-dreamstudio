import { db } from "@/db";
import { organization, order, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string; orderId: string }>;
}) {
  const { userId, orgId, orderId } = await params;

  // Fetch organization by ID
  const org = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!org) {
    notFound();
  }

  // Fetch current user's membership
  const userMembership = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, org.id), eq(member.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!userMembership?.role) {
    return redirect("/");
  }

  // Fetch the order with related data
  const orderData = await db.query.order.findFirst({
    where: and(eq(order.id, orderId), eq(order.organizationId, org.id)),
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

  return <OrderDetailView order={orderData} userId={userId} orgId={orgId} />;
}
