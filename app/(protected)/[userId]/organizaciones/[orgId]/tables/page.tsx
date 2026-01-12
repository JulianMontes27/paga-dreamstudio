import { db } from "@/db";
import { organization, floor, order } from "@/db/schema";
import { eq, asc, and, inArray, isNotNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/users";
import { TablesView } from "@/components/tables/tables-view";
import { CreateTableButton } from "@/components/tables/create-table-button";

type OrderActivity = "idle" | "active" | "payment_made";

/**
 * Tables Page - Server Component
 *
 * Displays all restaurant tables with their current status, QR codes, and management options.
 * Implements role-based access control:
 * - Members/Waiters: View tables, assign customers, access QR codes
 * - Admins/Owners: Full CRUD operations, QR management, analytics
 *
 * This component is a React Server Component for optimal performance and SEO.
 */
export default async function TablesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const slug = (await params).slug;

  /**
   * OPTIMIZED QUERY - Single Database Call with Slug-based Auth
   *
   * Uses URL slug as source of truth instead of session's active organization.
   * This ensures consistency and prevents issues where session org != URL org.
   *
   * Approach:
   * 1. Get current user (cached)
   * 2. Fetch organization by slug with members, tables, and QR codes
   * 3. Find user's membership to determine role
   * 4. All data fetched in a single optimized query
   */
  const { user } = await getCurrentUser();

  const organizationWithTables = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      tables: {
        with: {
          qrCode: true, // Include QR code data for each table
        },
        orderBy: (tables, { asc }) => [asc(tables.tableNumber)], // Sort by table number
      },
    },
  });

  if (!organizationWithTables) {
    notFound();
  }

  // Find user's membership in this specific organization (using slug)
  const member = organizationWithTables.members.find(
    (m) => m.userId === user.id
  );

  if (!member?.role) {
    return redirect("/");
  }

  // Extract organization data and tables for easier access
  const organizationData = {
    id: organizationWithTables.id,
    name: organizationWithTables.name,
    slug: organizationWithTables.slug,
    logo: organizationWithTables.logo,
    createdAt: organizationWithTables.createdAt,
    metadata: organizationWithTables.metadata,
  };

  // Fetch floors for this organization
  const floors = await db
    .select()
    .from(floor)
    .where(eq(floor.organizationId, organizationData.id))
    .orderBy(asc(floor.displayOrder));

  // Fetch active orders for tables to determine activity status
  // Only include orders that are in-progress (not fully paid/completed)
  const tableIds = organizationWithTables.tables.map((t) => t.id);
  const activeOrders = tableIds.length > 0
    ? await db
        .select({
          tableId: order.tableId,
          status: order.status,
        })
        .from(order)
        .where(
          and(
            eq(order.organizationId, organizationData.id),
            isNotNull(order.tableId),
            inArray(order.tableId, tableIds),
            // Only in-progress orders - "paid" means complete, no indicator needed
            inArray(order.status, [
              "ordering",
              "payment_started",
              "partially_paid",
            ])
          )
        )
    : [];

  // Create a map of tableId -> orderActivity
  const tableActivityMap = new Map<string, OrderActivity>();
  for (const activeOrder of activeOrders) {
    if (!activeOrder.tableId) continue;
    const currentActivity = tableActivityMap.get(activeOrder.tableId);
    // Priority: active > payment_made > idle
    // Green: actively ordering or starting payment
    // Yellow: partial payment made, waiting for rest
    if (activeOrder.status === "ordering" || activeOrder.status === "payment_started") {
      tableActivityMap.set(activeOrder.tableId, "active");
    } else if (activeOrder.status === "partially_paid") {
      if (currentActivity !== "active") {
        tableActivityMap.set(activeOrder.tableId, "payment_made");
      }
    }
  }

  // Transform the data to match existing component expectations
  const tablesWithQr = organizationWithTables.tables.map((table) => ({
    id: table.id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    status: table.status as "available" | "occupied" | "reserved" | "cleaning",
    section: table.section,
    // Handle null case - default to true if isQrEnabled is null
    isQrEnabled: table.isQrEnabled ?? true,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
    // Floor plan positioning fields
    floorId: table.floorId,
    xPosition: table.xPosition,
    yPosition: table.yPosition,
    width: table.width,
    height: table.height,
    shape: table.shape,
    // Order activity status
    orderActivity: tableActivityMap.get(table.id) || ("idle" as OrderActivity),
    qrCode: table.qrCode
      ? {
          id: table.qrCode.id,
          code: table.qrCode.code,
          checkoutUrl: table.qrCode.checkoutUrl,
          isActive: table.qrCode.isActive ?? true,
          scanCount: table.qrCode.scanCount ?? 0,
          lastScannedAt: table.qrCode.lastScannedAt,
          expiresAt: table.qrCode.expiresAt,
        }
      : null,
  }));

  // Type guard and role validation
  const userRole = member?.role as "member" | "admin" | "owner";
  if (!userRole || !["member", "admin", "owner"].includes(userRole)) {
    return redirect("/login");
  }

  // Check if user can manage tables (admin or owner)
  const canManageTables = userRole === "admin" || userRole === "owner";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tables</h1>
        {canManageTables && (
          <CreateTableButton organizationId={organizationData.id} />
        )}
      </div>

      {/* Tables View */}
      <TablesView
        tablesWithQr={tablesWithQr}
        floors={floors}
        userRole={userRole}
        organizationSlug={slug}
        organizationId={organizationData.id}
      />
    </div>
  );
}
