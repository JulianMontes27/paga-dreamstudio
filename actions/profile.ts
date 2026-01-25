"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { schema } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Type definitions for analytics data
export interface AgeGroupData {
  ageGroup: string;
  users: number;
  tickets: number;
  averagePrice?: number;
}
export interface GenderData {
  gender: string;
  users: number;
  tickets: number;
}

// Type definition for document update state
export interface DocumentState {
  success?: boolean;
  error?: string;
}

export async function updateProfile(
  _prevState: any,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Extract form data
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    // Validate required fields
    if (!name) {
      return { error: "Nombre es requerido" };
    }

    // Update user using Better Auth's built-in method
    // Note: updateUser API endpoint requires the user to be authenticated
    // For phone number, we'll still use direct DB update as it's a custom field
    await db
      .update(schema.user)
      .set({
        name,
        phoneNumber: phone || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id));

    // Revalidate the profile page
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Error al actualizar el perfil" };
  }
}

export async function updateUserName(
  _prevState: any,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Extract form data
    const nombres = formData.get("nombres") as string;
    const apellidos = formData.get("apellidos") as string;

    // Update user nombres and apellidos fields
    await db
      .update(schema.user)
      .set({
        nombres: nombres.trim() || null,
        apellidos: apellidos.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id));

    // Revalidate the profile page
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating user name:", error);
    return { error: "Error al actualizar el nombre" };
  }
}

export async function updateUserDocument(
  _prevState: DocumentState,
  formData: FormData,
): Promise<DocumentState> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Extract form data
    const documentTypeId = formData.get("documentTypeId") as string | null;
    const documentId = formData.get("documentId") as string | null;

    // Update user through Better Auth API to ensure session is refreshed
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        documentTypeId: documentTypeId || null,
        documentId: documentId?.trim() || null,
      },
    });

    // Revalidate the profile page
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating user document:", error);
    return { error: "Error al actualizar el documento" };
  }
}

export async function updateUserGender(
  _prevState: any,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Extract form data
    const gender = formData.get("gender") as string | null;

    // Validate gender value against enum
    const validGenders = [
      "masculino",
      "femenino",
      "otro",
      "prefiero_no_decir",
    ] as const;
    const genderValue =
      gender && validGenders.includes(gender as (typeof validGenders)[number]) // is the gender value in the array?
        ? (gender as (typeof validGenders)[number]) // assign gender with proper type
        : null;

    // Update user gender field
    await db
      .update(schema.user)
      .set({
        gender: genderValue,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id));

    // Revalidate the profile page
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating user gender:", error);
    return { error: "Error al actualizar el género" };
  }
}

export async function updateUserTipoPersona(
  _prevState: any,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Extract form data
    const tipoPersona = formData.get("tipoPersona") as string | null;
    const razonSocial = formData.get("razonSocial") as string | null;
    const nit = formData.get("nit") as string | null;

    // Update user tipo_persona fields
    await db
      .update(schema.user)
      .set({
        tipoPersona: tipoPersona || null,
        razonSocial:
          tipoPersona === "juridica" ? razonSocial?.trim() || null : null,
        nit: tipoPersona === "juridica" ? nit?.trim() || null : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id));

    // Revalidate the profile page
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating user tipo persona:", error);
    return { error: "Error al actualizar el tipo de persona" };
  }
}
