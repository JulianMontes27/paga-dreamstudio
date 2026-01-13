import { notFound, redirect } from "next/navigation";
import { TableDetailView } from "@/components/tables/table-detail-view";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { table, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string; mesaId: string }>;
}) {
  const { userId, orgId, mesaId } = await params;

  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.id !== userId) {
    redirect("/sign-in");
  }

  // Fetch table with orders and order items in a single optimized query using Drizzle
  const tableData = await db.query.table.findFirst({
    where: and(eq(table.id, mesaId), eq(table.organizationId, orgId)),
    with: {
      orders: {
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

  // Calculate stats
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === "paid");
  const activeOrders = orders.filter(
    (o) =>
      o.status === "ordering" ||
      o.status === "payment_started" ||
      o.status === "partially_paid"
  );

  const totalRevenue = paidOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount || "0"),
    0
  );

  const stats = {
    totalOrders,
    totalRevenue,
    activeOrdersCount: activeOrders.length,
  };

  // Get user's role
  const memberData = await db.query.member.findFirst({
    where: and(eq(member.userId, userId), eq(member.organizationId, orgId)),
  });

  const userRole = memberData?.role || "waiter";

  // Get organization slug
  const organizationSlug = orgId;

  // Map role from database enum to component prop type
  const mappedRole =
    userRole === "administrator" ? "admin" : (userRole as "waiter" | "owner");

  return (
    <TableDetailView
      table={tableData}
      activeOrder={activeOrder}
      orders={orders}
      stats={stats}
      organizationSlug={organizationSlug}
      userId={userId}
      userRole={mappedRole}
    />
  );
}
