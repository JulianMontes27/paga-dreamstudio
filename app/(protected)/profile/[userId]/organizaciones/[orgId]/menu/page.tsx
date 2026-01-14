import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MenuView } from "@/components/menu-view";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { CreateMenuItemDialog } from "@/components/create-menu-item-dialog";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { menuCategory } from "@/db";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { orgId } = await params;
  const reqHeaders = await headers();

  // Check menu edit permissions (create, update, delete)
  const canEditMenu = await auth.api.hasPermission({
    headers: reqHeaders,
    body: {
      permission: { menu: ["create", "update", "delete"] },
      organizationId: orgId,
    },
  });

  const canEdit = !!canEditMenu?.success;

  // Fetch categories with nested items in a single query
  const menu = await db.query.menuCategory.findMany({
    where: eq(menuCategory.organizationId, orgId),
    orderBy: (menuCategory, { asc }) => [
      asc(menuCategory.displayOrder),
      asc(menuCategory.name),
    ],
    with: {
      menuItems: {
        orderBy: (menuItem, { asc }) => [asc(menuItem.name)],
      },
    },
  });

  const categories = menu.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        {canEdit && (
          <div className="flex gap-2">
            <CreateCategoryDialog organizationId={orgId} />
            <CreateMenuItemDialog
              organizationId={orgId}
              categories={categories}
            />
          </div>
        )}
      </div>

      {/* Menu View */}
      <MenuView
        menu={menu}
        categories={categories}
        organizationId={orgId}
        canEdit={canEdit}
      />
    </div>
  );
}
