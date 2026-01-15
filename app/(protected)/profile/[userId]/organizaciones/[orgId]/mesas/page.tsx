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

  const [canManageTables, tables, floors] = await Promise.all([
    // ✅ Good - independent queries (makes sense to fetch in parallel)
    auth.api.hasPermission({
      headers: reqHeaders,
      body: {
        permissions: { table: ["update", "create"] },
        organizationId: orgId,
      },
    }),
    db.query.table.findMany({
      where: eq(table.organizationId, orgId),
      with: {
        floor: true,
      },
    }),
    db.query.floor.findMany({
      where: eq(floor.organizationId, orgId),
      orderBy: (floor, { asc }) => [asc(floor.displayOrder), asc(floor.name)],
    }),
  ]);

  const canUpdate = !!canManageTables?.success;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Mesas</h1>
        {canManageTables?.success && (
          <CreateTableButton organizationId={orgId} />
        )}
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
