"use server";

import { cache } from "react";
import { db } from "@/db/drizzle";
import { organization, paymentProcessorAccount, invitation } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const getOrganizationBySlug = cache(async (slug: string) => {
  try {
    const organizationBySlug = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    return organizationBySlug;
  } catch (error) {
    console.error(error);
    return null;
  }
});

export const getOrganizations = cache(async () => {
  const organizations = await auth.api.listOrganizations({
    // This endpoint requires session cookies.
    headers: await headers(),
  });

  return organizations;
});

// Define proper TypeScript interface
interface GetFullOrganizationOptions {
  organizationId?: string;
  organizationSlug?: string;
  membersLimit?: number;
}

// More efficient and type-safe version
export const getFullOrganization = cache(
  async (options?: GetFullOrganizationOptions) => {
    try {
      const data = await auth.api.getFullOrganization({
        query: {
          organizationId: options?.organizationId,
          organizationSlug: options?.organizationSlug,
          membersLimit: options?.membersLimit ?? 100, // Default to 100
        },
        // This endpoint requires session cookies.
        headers: await headers(),
      });

      return data;
    } catch (error) {
      console.error("Error fetching full organization:", error);
      return null;
    }
  }
);

// Enhanced version that includes payment processor accounts
export const getFullOrganizationWithPayments = cache(
  async (options?: GetFullOrganizationOptions) => {
    try {
      // First get the basic organization data
      const orgData = await auth.api.getFullOrganization({
        query: {
          organizationId: options?.organizationId,
          organizationSlug: options?.organizationSlug,
          membersLimit: options?.membersLimit ?? 100,
        },
        headers: await headers(),
      });

      if (!orgData) {
        return null;
      }

      // Then fetch payment processor accounts separately
      const paymentAccounts = await db
        .select()
        .from(paymentProcessorAccount)
        .where(eq(paymentProcessorAccount.organizationId, orgData.id));

      // Combine the data
      return {
        ...orgData,
        paymentAccounts,
      };
    } catch (error) {
      console.error("Error fetching full organization with payments:", error);
      return null;
    }
  }
);

// Define proper TypeScript interface
interface sendInvitationProps {
  email: string; // required -> The email address of the user to invite.
  role: "member" | "admin" | ("member" | "admin")[]; // required -> The role(s) to assign to the user.
  organizationId?: string;
  resend?: boolean;
}

// To invite users to an organization, you can use the invite function provided by the client. The invite function takes an object with the following properties:
export async function sendInvitationOwner(options: sendInvitationProps) {
  try {
    console.log("Sending invitation with options:", options);
    // Try without organizationId first - let it use the active organization from session
    const data = await auth.api.createInvitation({
      body: {
        email: options.email, // required
        role: options.role, // required
        organizationId: options.organizationId,
        resend: options?.resend ?? false,
      },
      // This endpoint requires session cookies.
      headers: await headers(),
    });

    console.log("Invitation sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending invitation:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw error;
  }
}

// List all invitations for an organization
export async function listInvitations(organizationId?: string) {
  try {
    if (!organizationId) {
      return [];
    }

    // Fetch invitations with inviter user information
    const invitationsData = await db.query.invitation.findMany({
      where: eq(invitation.organizationId, organizationId),
      with: {
        inviterUser: true, // Get the user who sent the invitation
      },
    });

    // Map the data to match the expected structure in the component
    // Component expects: inviter.user instead of inviterUser
    const formattedInvitations = invitationsData.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role as "member" | "admin" | "owner",
      status: inv.status,
      organizationId: inv.organizationId,
      inviterId: inv.inviterId,
      expiresAt: inv.expiresAt,
      inviter: inv.inviterUser
        ? {
            user: {
              name: inv.inviterUser.name,
              email: inv.inviterUser.email,
            },
          }
        : undefined,
    }));

    return formattedInvitations;
  } catch (error) {
    console.error("Error listing invitations:", error);
    return [];
  }
}

// Cancel an invitation that has been sent
export async function cancelInvitation(invitationId: string) {
  try {
    const data = await auth.api.cancelInvitation({
      body: {
        invitationId, // required
      },
      headers: await headers(),
    });

    return data;
  } catch (error) {
    console.error("Error canceling invitation:", error);
    throw error;
  }
}

// Permanently delete an invitation from the database
export async function deleteInvitation(invitationId: string) {
  try {
    await db.delete(invitation).where(eq(invitation.id, invitationId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting invitation:", error);
    throw error;
  }
}
