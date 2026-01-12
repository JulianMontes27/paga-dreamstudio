import { db } from "@/db";
import { organization, order } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/users";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const { user } = await getCurrentUser();

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!org) {
    notFound();
  }

  const member = org.members.find((m) => m.userId === user.id);

  if (!member?.role) {
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

  return (
    <OrderDetailView order={orderData} organizationSlug={slug} />
  );
}
