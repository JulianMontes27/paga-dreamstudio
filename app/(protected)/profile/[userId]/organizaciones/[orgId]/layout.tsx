import RestaurantTabs from "@/components/restaurant-tabs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { member, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;

  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Efficiently fetch member role in a single query
  // This joins member with organization to verify membership and get role
  const memberData = await db
    .select({
      memberId: member.id,
      role: member.role,
      organizationId: organization.id,
      organizationName: organization.name,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(organization.slug, orgId) // Using slug from URL
      )
    )
    .limit(1);

  // Check if user is a member
  if (!memberData || memberData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">
          No eres parte de esta organización.
        </p>
        <Link
          href={`/${userId}/organizaciones`}
          className="text-primary hover:underline"
        >
          Volver a organizaciones
        </Link>
      </div>
    );
  }

  const userMember = memberData[0];

  return (
    <div>
      {/* Restaurant Navigation Tabs */}
      <RestaurantTabs
        role={userMember.role as "waiter" | "administrator" | "owner"}
      />
      {/* Page Content */}
      <div className="mt-4 sm:mt-6 px-4">{children}</div>
    </div>
  );
}
