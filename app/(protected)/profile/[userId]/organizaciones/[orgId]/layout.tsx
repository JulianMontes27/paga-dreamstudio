import React, { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Administrador de Restaurantes",
  };
}

interface AdministradorLayoutProps {
  children: ReactNode;
  params: Promise<{
    userId: string;
    orgId: string;
  }>;
}

const AdministradorLayout = async ({
  children,
  params,
}: AdministradorLayoutProps) => {
  const { userId, orgId } = await params;

  return (
    <AdminLayoutWrapper>
      <div className="bg-background overflow-auto">
        {/* Sidebar */}
        <AdminSidebar
          userId={userId}
          orgId={orgId} // First render organization_id
        />

        {/* Main Content - with left margin to accommodate fixed sidebar */}
        <main className="lg:ml-64 p-3 lg:p-4">
          {children}
        </main>
      </div>
    </AdminLayoutWrapper>
  );
};

export default AdministradorLayout;
