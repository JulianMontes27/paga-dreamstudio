"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { organization, member } from "@/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface UpdateOrganizationData {
  // Basic fields
  name: string;
  slug: string;
  logo?: string;
  // Additional fields (defined in Better Auth organization plugin schema)
  tipoOrganizacion?: "natural" | "juridica";
  nombres?: string;
  apellidos?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nit?: string;
  direccion?: string;
  numeroTelefono?: string;
  correoElectronico?: string;
  rutUrl?: string;
  cerlUrl?: string;
}

export async function updateOrganization(
  organizationId: string,
  data: UpdateOrganizationData
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Check if user is owner of the organization
    const memberRecord = await db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!memberRecord || memberRecord.role !== "owner") {
      return { error: "Solo los propietarios pueden editar la organización" };
    }

    // Update core fields via Better Auth API
    const result = await auth.api.updateOrganization({
      body: {
        data: {
          name: data.name,
          slug: data.slug,
          logo: data.logo || undefined,
        },
        organizationId,
      },
      headers: await headers(),
    });

    if (!result) {
      return { error: "Error al actualizar la organización" };
    }

    // Update additional fields directly in the database
    // Better Auth reads these via additionalFields but updates need direct DB access
    await db
      .update(organization)
      .set({
        tipoOrganizacion: data.tipoOrganizacion || null,
        nombres: data.nombres || null,
        apellidos: data.apellidos || null,
        tipoDocumento: data.tipoDocumento || null,
        numeroDocumento: data.numeroDocumento || null,
        nit: data.nit || null,
        direccion: data.direccion || null,
        numeroTelefono: data.numeroTelefono || null,
        correoElectronico: data.correoElectronico || null,
        rutUrl: data.rutUrl || null,
        cerlUrl: data.cerlUrl || null,
      })
      .where(eq(organization.id, organizationId));

    // Revalidate paths
    revalidatePath(
      `/profile/${session.user.id}/organizaciones/${organizationId}/administrador/configuracion`
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { error: "Error al actualizar la organización" };
  }
}
