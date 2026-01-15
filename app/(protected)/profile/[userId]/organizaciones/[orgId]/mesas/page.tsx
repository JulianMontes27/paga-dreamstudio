import { TablesView } from "@/components/tables/tables-view";
import { CreateTableButton } from "@/components/tables/create-table-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { table, floor } from "@/db/schema";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;
  const reqHeaders = await headers();

  // Check table create permission for the button
  const canCreateTable = await auth.api.hasPermission({
    headers: reqHeaders,
    body: {
      permission: { table: ["create"] },
      organizationId: orgId,
    },
  });

  // Check table update permission for editing
  const canUpdateTable = await auth.api.hasPermission({
    headers: reqHeaders,
    body: {
      permission: { table: ["update"] },
      organizationId: orgId,
    },
  });

  const canUpdate = !!canUpdateTable?.success;

  // Fetch all tables for the organization with floor relation
  const tables = await db.query.table.findMany({
    where: eq(table.organizationId, orgId),
    with: {
      floor: true,
    },
  });

  // Fetch all floors for the organization (including those without tables)
  const floors = await db.query.floor.findMany({
    where: eq(floor.organizationId, orgId),
    orderBy: (floor, { asc }) => [asc(floor.displayOrder), asc(floor.name)],
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Mesas</h1>
        {canCreateTable?.success && <CreateTableButton organizationId={orgId} />}
      </div>

      {/* Tables View */}
      <TablesView
        tables={tables}
        floors={floors}
        canUpdate={canUpdate}
        organizationId={orgId}
        userId={userId}
      />
    </div>
  );
}
