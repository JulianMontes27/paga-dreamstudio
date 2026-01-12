import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";

export default async function OrganizacionesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  // Fetch user's organizations using Better Auth API
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-bold leading-tight">
                Mis organizaciones
              </h1>
              {/* Mobile: Icon-only button next to title */}
              <div className="flex sm:hidden">
                <CreateOrganizationDialog variant="icon-only" />
              </div>
            </div>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Gestiona tus organizaciones y sus miembros
            </p>
          </div>
          {/* Desktop: Full button */}
          <div className="hidden sm:flex gap-2">
            <CreateOrganizationDialog />
          </div>
        </div>
      </div>

      {/* Organizations List */}
      {organizations && organizations.length > 0 ? (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/profile/${userId}/organizaciones/${org.id}/administrador`}
              className="block group"
            >
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-all cursor-pointer">
                {org.logo ? (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="h-14 w-14 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-200 dark:ring-[#2a2a2a]"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-200 dark:ring-[#2a2a2a]">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate">
                    {org.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    @{org.slug}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-xl font-semibold">
              No tienes organizaciones
            </h3>
            <p className="text-gray-500 max-w-md text-sm">
              Crea tu primera organización para comenzar a gestionar equipos y
              proyectos.
            </p>
          </div>
          <CreateOrganizationDialog />
        </div>
      )}
    </div>
  );
}
