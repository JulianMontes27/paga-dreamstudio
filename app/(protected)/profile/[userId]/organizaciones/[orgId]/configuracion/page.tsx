import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AdminConfigTabs } from "@/components/admin-config-tabs";
import { AdminHeader } from "@/components/admin-header";

interface ConfiguracionPageProps {
  params: Promise<{
    userId: string;
    orgId: string;
  }>;
}

const ConfiguracionPage = async ({ params }: ConfiguracionPageProps) => {
  const { userId, orgId } = await params;
  const reqHeaders = await headers();

  // Get full organization details with members and invitations
  const fullOrganization = await auth.api.getFullOrganization({
    query: {
      organizationId: orgId,
    },
    headers: reqHeaders,
  });

  if (!fullOrganization) {
    notFound();
  }

  // Get current user's role in the organization
  const currentUserMember = fullOrganization.members?.find(
    (m: { userId: string }) => m.userId === userId
  );
  const currentUserRole = currentUserMember?.role || "member";

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-6 space-y-6">
      {/* Page Header */}
      <AdminHeader
        title="Configuración"
        subtitle="Gestiona tu organización, equipo y procesadores de pago"
      />

      <AdminConfigTabs
        organization={fullOrganization}
        currentUserRole={currentUserRole}
        currentUserId={userId}
      />
    </div>
  );
};

export default ConfiguracionPage;
