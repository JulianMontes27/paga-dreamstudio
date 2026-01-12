"use server";

import { db } from "@/db";
import { invitation } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Cancel an invitation by setting its status to "cancelled"
 */
export async function cancelInvitation(invitationId: string) {
  try {
    await db
      .update(invitation)
      .set({ status: "cancelled" })
      .where(eq(invitation.id, invitationId));

    return { success: true };
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    throw new Error("Failed to cancel invitation");
  }
}

/**
 * Delete an invitation from the database
 */
export async function deleteInvitation(invitationId: string) {
  try {
    await db.delete(invitation).where(eq(invitation.id, invitationId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting invitation:", error);
    throw new Error("Failed to delete invitation");
  }
}
