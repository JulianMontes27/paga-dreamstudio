import { notFound } from "next/navigation";
import RestaurantTabs from "@/components/restaurant-tabs";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";
import { Link } from "lucide-react";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  // Validate that the organization exists
  const org = await getOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }

  // Fetch member ONCE
  const memberByUserId = org.members.find(
    (member) => member.user.id === user.id
  );
  if (!memberByUserId)
    return (
      <Link href="/dashboard">
        You are not part of this organization. Go back.
      </Link>
    );

  return (
    <div>
      {/* Restaurant Navigation Tabs */}
      <RestaurantTabs role={memberByUserId.role} />
      {/* Page Content */}
      <div className="mt-4 sm:mt-6 px-4">{children}</div>
    </div>
  );
}
