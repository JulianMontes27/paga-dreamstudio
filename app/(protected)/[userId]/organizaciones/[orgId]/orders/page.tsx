import { db } from "@/db";
import { organization, order } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/users";
import { OrdersView } from "@/components/orders/orders-view";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  // Fetch orders with related data
  const orders = await db.query.order.findMany({
    where: eq(order.organizationId, org.id),
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

      <OrdersView orders={orders} organizationSlug={slug} />
    </div>
  );
}
