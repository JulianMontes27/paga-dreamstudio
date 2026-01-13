import { db } from "@/db";
import { floor, table, order, member } from "@/db/schema";
import { eq, asc, and, inArray, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TablesView } from "@/components/tables/tables-view";
import { CreateTableButton } from "@/components/tables/create-table-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type OrderActivity = "idle" | "active" | "payment_made";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;
  const reqHeaders = await headers();

  // Get session for auth
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check table read permission
  const canViewTables = await auth.api.hasPermission({
    headers: reqHeaders,
    body: {
      permission: { table: ["read"] },
      organizationId: orgId,
    },
  });

  if (!canViewTables?.success) {
    redirect(`/${userId}/organizaciones`);
  }

  // Fetch all data in parallel for better performance
  const [tables, floors, activeOrdersData, userMember] = await Promise.all([
    // Fetch tables
    db
      .select()
      .from(table)
      .where(eq(table.organizationId, orgId))
      .orderBy(asc(table.tableNumber)),

    // Fetch floors
    db
      .select()
      .from(floor)
      .where(eq(floor.organizationId, orgId))
      .orderBy(asc(floor.displayOrder)),

    // Fetch active orders with table activity status
    db
      .select({
        tableId: order.tableId,
        status: order.status,
      })
      .from(order)
      .where(
        and(
          eq(order.organizationId, orgId),
          isNotNull(order.tableId),
          inArray(order.status, [
            "ordering",
            "payment_started",
            "partially_paid",
          ])
        )
      ),

    // Fetch user's member role
    db
      .select({
        id: member.id,
        role: member.role,
      })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, orgId)
        )
      )
      .limit(1),
  ]);

  // Verify membership
  if (!userMember || userMember.length === 0) {
    redirect(`/${userId}/organizaciones`);
  }

  // Map schema roles to component roles
  const schemaRole = userMember[0].role as "waiter" | "administrator" | "owner";
  const userRole: "waiter" | "admin" | "owner" =
    schemaRole === "administrator"
      ? "admin"
      : schemaRole === "waiter"
        ? "waiter"
        : "owner";

  // Build activity map: tableId -> OrderActivity
  const tableActivityMap = new Map<string, OrderActivity>();

  for (const orderData of activeOrdersData) {
    if (!orderData.tableId) continue;

    const currentActivity = tableActivityMap.get(orderData.tableId);

    // Priority: active > payment_made > idle
    if (
      orderData.status === "ordering" ||
      orderData.status === "payment_started"
    ) {
      tableActivityMap.set(orderData.tableId, "active");
    } else if (
      orderData.status === "partially_paid" &&
      currentActivity !== "active"
    ) {
      tableActivityMap.set(orderData.tableId, "payment_made");
    }
  }

  // Transform tables data for component
  const tablesWithCheckout = tables.map((t) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    capacity: t.capacity,
    status: t.status as "available" | "occupied" | "reserved" | "cleaning",
    section: t.section,
    isNfcEnabled: t.isNfcEnabled ?? true,
    nfcScanCount: t.nfcScanCount ?? 0,
    lastNfcScanAt: t.lastNfcScanAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    floorId: t.floorId,
    xPosition: t.xPosition,
    yPosition: t.yPosition,
    width: t.width,
    height: t.height,
    shape: t.shape,
    orderActivity: tableActivityMap.get(t.id) || ("idle" as OrderActivity),
    // Generate checkout URL
    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/checkout/${t.id}`,
  }));

  // Check if user can manage tables (create/update/delete)
  const canManageTables = userRole === "admin" || userRole === "owner";

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mesas</h1>
        {canManageTables && <CreateTableButton organizationId={orgId} />}
      </div>

      {/* Tables View */}
      <TablesView
        tables={tablesWithCheckout}
        floors={floors}
        userRole={userRole}
        organizationSlug={orgId}
        organizationId={orgId}
        userId={userId}
      />
    </div>
  );
}
