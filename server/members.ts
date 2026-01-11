"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Role = "member" | "admin" | "owner";

interface APIError {
  status?: string;
  message?: string;
  statusCode?: number;
  body?: unknown;
}

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role | Role[]
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add member.");
  }
};

export const removeMemberAction = async (
  organizationId: string,
  memberEmail: string
) => {
  try {
    await auth.api.removeMember({
      body: {
        memberIdOrEmail: memberEmail,
        organizationId,
      },
      headers: await headers(),
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error removing member:", error);

    // Extract error message properly
    let errorMessage = "Failed to remove member.";

    const apiError = error as APIError;

    if (apiError?.status === "UNAUTHORIZED") {
      errorMessage = "You don't have permission to remove this member.";
    } else if (apiError?.message) {
      errorMessage = apiError.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const updateMemberRoleAction = async (
  organizationId: string,
  memberId: string,
  role: Role | Role[]
) => {
  try {
    await auth.api.updateMemberRole({
      body: {
        role,
        memberId,
        organizationId,
      },
      headers: await headers(),
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error updating member role:", error);

    // Extract error message properly
    let errorMessage = "Failed to update member role.";

    const apiError = error as APIError;

    if (apiError?.status === "UNAUTHORIZED") {
      errorMessage = "You don't have permission to update this member's role.";
    } else if (apiError?.message) {
      errorMessage = apiError.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};
