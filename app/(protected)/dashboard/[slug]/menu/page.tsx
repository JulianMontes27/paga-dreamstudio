import { db } from "@/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/users";
import { getFullMenu, getMenuCategories } from "@/server/menu";
import { MenuView } from "@/components/menu/menu-view";
import { CreateCategoryDialog } from "@/components/menu/create-category-dialog";
import { CreateMenuItemDialog } from "@/components/menu/create-menu-item-dialog";

/**
 * Menu Page - Server Component
 *
 * Displays menu items and categories.
 * - Admins and owners can edit menu items and categories.
 * - Members can view the menu in read-only mode.
 */
export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { user } = await getCurrentUser();

  // Fetch organization with members
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    with: {
      members: true,
    },
  });

  if (!org) {
    notFound();
  }

  // Check user permissions
  const currentUserMember = org.members.find((m) => m.userId === user.id);
  if (!currentUserMember) {
    redirect("/");
  }

  // Only admins and owners can manage menu
  const canEdit = ["admin", "owner"].includes(currentUserMember.role);

  // Fetch menu data
  const menu = await getFullMenu(org.id);
  const categories = await getMenuCategories(org.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        {canEdit && (
          <div className="flex gap-2">
            <CreateCategoryDialog organizationId={org.id} />
            <CreateMenuItemDialog
              organizationId={org.id}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        )}
      </div>

      {/* Menu View */}
      <MenuView
        menu={menu}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        organizationId={org.id}
        canEdit={canEdit}
      />
    </div>
  );
}
