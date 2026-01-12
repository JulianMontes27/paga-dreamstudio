"use server";

import { db } from "@/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateRestaurantMetadataParams {
  organizationId: string;
  address: string;
  phone: string;
  cuisineType: string | null;
  seatingCapacity: number | null;
}

/**
 * Create or update restaurant metadata
 * Updates the organization record with restaurant-specific details
 */
export async function createRestaurantMetadata(
  params: CreateRestaurantMetadataParams
) {
  try {
    await db
      .update(organization)
      .set({
        direccion: params.address,
        numeroTelefono: params.phone,
        cuisineType: params.cuisineType,
        seatingCapacity: params.seatingCapacity,
      })
      .where(eq(organization.id, params.organizationId));

    return { success: true };
  } catch (error) {
    console.error("Error creating restaurant metadata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
