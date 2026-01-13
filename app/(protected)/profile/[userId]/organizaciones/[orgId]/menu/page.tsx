import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MenuView } from "@/components/menu-view";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { CreateMenuItemDialog } from "@/components/create-menu-item-dialog";
import { getFullMenu, getMenuCategories } from "@/server/menu";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;
  const reqHeaders = await headers();

  // Auth check
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user || session.user.id !== userId) {
    redirect("/sign-in");
  }

  // Check menu read permission
  const canViewMenu = await auth.api.hasPermission({
    headers: reqHeaders,
    body: {
      permission: { menu: ["read"] },
      organizationId: orgId,
    },
  });

  if (!canViewMenu?.success) {
    redirect(`/profile/${userId}/organizaciones`);
  }

  // Check menu edit permissions (create, update, delete)
  const canEditMenu = await auth.api.hasPermission({
    headers: reqHeaders,
    body: {
      permission: { menu: ["create", "update", "delete"] },
      organizationId: orgId,
    },
  });

  const canEdit = !!canEditMenu?.success;

  // Fetch menu data
  const menu = await getFullMenu(orgId);
  const categories = await getMenuCategories(orgId);

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
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        )}
      </div>

      {/* Menu View */}
      <MenuView
        menu={menu}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        organizationId={orgId}
        canEdit={canEdit}
      />
    </div>
  );
}
