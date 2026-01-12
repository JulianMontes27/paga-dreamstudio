"use server";

import { db } from "@/db";
import { member, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Remove a member from an organization
 */
export async function removeMemberAction(
  organizationId: string,
  memberEmail: string
) {
  try {
    // First, find the user by email
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, memberEmail))
      .limit(1);

    if (!userRecord || userRecord.length === 0) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const userId = userRecord[0].id;

    // Then, delete the member record
    await db
      .delete(member)
      .where(
        and(eq(member.userId, userId), eq(member.organizationId, organizationId))
      );

    return { success: true };
  } catch (error) {
    console.error("Error removing member:", error);
    return {
      success: false,
      error: "Failed to remove member",
    };
  }
}
