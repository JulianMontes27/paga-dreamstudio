import { db } from "@/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/users";
import { listInvitations } from "@/server/organizations";
import { StaffView } from "@/components/staff/staff-view";
import { InviteMemberDialog } from "@/components/staff/invite-member-dialog";

/**
 * Staff Page - Server Component
 *
 * Displays team members with role management.
 * Only admins and owners can access this page.
 */
export default async function StaffPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { user } = await getCurrentUser();

  // Fetch organization with members
  const organizationWithMembers = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!organizationWithMembers) {
    notFound();
  }

  // Find user's membership
  const currentUserMember = organizationWithMembers.members.find(
    (member) => member.userId === user.id
  );

  if (!currentUserMember) {
    redirect("/dashboard");
  }

  const userRole = currentUserMember.role;

  // Only admins and owners can view staff page
  if (userRole === "member") {
    redirect(`/dashboard/${slug}/tables`);
  }

  // Fetch pending invitations
  const invitations = await listInvitations(organizationWithMembers.id);

  // Transform members data
  const members = organizationWithMembers.members.map((member) => ({
    id: member.id,
    role: member.role as "member" | "admin" | "owner",
    createdAt: member.createdAt,
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
    },
  }));

  // Transform invitations data
  const transformedInvitations = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    inviterUser: inv.inviter?.user
      ? { name: inv.inviter.user.name }
      : null,
  }));

  const canInvite = userRole === "owner" || userRole === "admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team</h1>
        {canInvite && (
          <InviteMemberDialog organizationId={organizationWithMembers.id} />
        )}
      </div>

      {/* Staff View */}
      <StaffView
        members={members}
        invitations={transformedInvitations}
        currentUserId={user.id}
        currentUserRole={userRole as "member" | "admin" | "owner"}
        organizationId={organizationWithMembers.id}
      />
    </div>
  );
}
