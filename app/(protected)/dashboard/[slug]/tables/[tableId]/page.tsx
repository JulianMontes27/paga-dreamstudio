import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/users";
import { getTableWithOrders } from "@/server/restaurants";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TableDetailView } from "@/components/tables/table-detail-view";

/**
 * Table Detail Page - Server Component
 *
 * Displays detailed information about a specific table including:
 * - Table information (number, capacity, status, section)
 * - QR code details and scan count
 * - Active order (if any) with all items
 * - Order history
 * - Table statistics
 *
 * Accessible to all organization members (read-only for non-admins)
 */
export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ slug: string; tableId: string }>;
}) {
  const { slug, tableId } = await params;

  // Get current user (cached from layout)
  const { user } = await getCurrentUser();

  // Get organization with members (slug-based, not session-based)
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

  // Find user's membership in THIS organization (using slug)
  const member = org.members.find((m) => m.userId === user.id);

  if (!member?.role) {
    return redirect("/dashboard");
  }

  // All members can view table details
  const userRole = member.role as "member" | "admin" | "owner";

  // Fetch table details with orders
  const result = await getTableWithOrders(tableId, org.id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <TableDetailView
      table={result.data.table}
      activeOrder={result.data.activeOrder}
      orders={result.data.orders}
      stats={result.data.stats}
      organizationSlug={slug}
      userRole={userRole}
    />
  );
}
