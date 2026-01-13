"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { schema } from "@/db";
import { eq, sql } from "drizzle-orm";
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

export async function updateProfile(
  _prevState: any,
  formData: FormData
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
        updatedAt: sql`CURRENT_TIMESTAMP`,
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
  formData: FormData
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
        updatedAt: sql`CURRENT_TIMESTAMP`,
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
