"use server";

import { cache } from "react";
import { db } from "@/db/drizzle";
import { paymentProcessorAccount } from "@/db/restaurant-schema";
import { eq, and } from "drizzle-orm";

/**
 * Payment Processor Server Functions
 *
 * These functions handle fetching and managing payment processor accounts.
 * Used primarily during checkout to determine which payment processor is active.
 */

/**
 * Get the active payment processor for an organization
 *
 * IMPORTANT: Only ONE processor can be active per organization at a time.
 * This is enforced by the status update API endpoint.
 *
 * @param organizationId - The organization ID to fetch the active processor for
 * @returns The active payment processor account or null if none exists
 */
export const getActivePaymentProcessor = cache(async (organizationId: string) => {
  try {
    // Query for active payment processor account
    const activeAccount = await db
      .select({
        id: paymentProcessorAccount.id,
        organizationId: paymentProcessorAccount.organizationId,
        processorType: paymentProcessorAccount.processorType,
        processorAccountId: paymentProcessorAccount.processorAccountId,
        status: paymentProcessorAccount.status,
        tokenExpiresAt: paymentProcessorAccount.tokenExpiresAt,
        metadata: paymentProcessorAccount.metadata,
        createdAt: paymentProcessorAccount.createdAt,
        updatedAt: paymentProcessorAccount.updatedAt,
      })
      .from(paymentProcessorAccount)
      .where(
        and(
          eq(paymentProcessorAccount.organizationId, organizationId),
          eq(paymentProcessorAccount.status, "active")
        )
      )
      .limit(1);

    if (!activeAccount.length) {
      return null;
    }

    const account = activeAccount[0];

    // Check if token is expired
    if (account.tokenExpiresAt) {
      const expiresAt = new Date(account.tokenExpiresAt);
      const now = new Date();

      if (expiresAt <= now) {
        console.warn(`Payment processor token expired for organization ${organizationId}`);
        // Token expired - return null so checkout knows payment is unavailable
        return null;
      }
    }

    // Return account data (without sensitive tokens)
    return {
      id: account.id,
      organizationId: account.organizationId,
      processorType: account.processorType,
      processorAccountId: account.processorAccountId,
      status: account.status,
      tokenExpiresAt: account.tokenExpiresAt,
      metadata: account.metadata,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching active payment processor:", error);
    return null;
  }
});

/**
 * Get all payment processors for an organization (for admin/settings views)
 *
 * @param organizationId - The organization ID
 * @returns Array of all payment processor accounts
 */
export const getPaymentProcessors = cache(async (organizationId: string) => {
  try {
    const accounts = await db
      .select()
      .from(paymentProcessorAccount)
      .where(eq(paymentProcessorAccount.organizationId, organizationId));

    return accounts;
  } catch (error) {
    console.error("Error fetching payment processors:", error);
    return [];
  }
});

/**
 * Check if organization has any active payment processor
 * Lightweight check without fetching full account data
 *
 * @param organizationId - The organization ID
 * @returns Boolean indicating if active processor exists
 */
export const hasActivePaymentProcessor = cache(async (organizationId: string) => {
  try {
    const result = await db
      .select({ id: paymentProcessorAccount.id })
      .from(paymentProcessorAccount)
      .where(
        and(
          eq(paymentProcessorAccount.organizationId, organizationId),
          eq(paymentProcessorAccount.status, "active")
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking active payment processor:", error);
    return false;
  }
});

/**
 * Get the active payment processor WITH access token (SERVER-SIDE ONLY)
 *
 * ⚠️ WARNING: This function returns sensitive data (access tokens)
 * NEVER expose this to the client. Only use in API routes.
 *
 * @param organizationId - The organization ID
 * @returns The active payment processor with access token or null
 */
export async function getActivePaymentProcessorWithToken(organizationId: string) {
  try {
    // Query for active payment processor account WITH access token
    const activeAccount = await db
      .select()
      .from(paymentProcessorAccount)
      .where(
        and(
          eq(paymentProcessorAccount.organizationId, organizationId),
          eq(paymentProcessorAccount.status, "active")
        )
      )
      .limit(1);

    if (!activeAccount.length) {
      return null;
    }

    const account = activeAccount[0];

    // Check if token is expired
    if (account.tokenExpiresAt) {
      const expiresAt = new Date(account.tokenExpiresAt);
      const now = new Date();

      if (expiresAt <= now) {
        console.warn(`Payment processor token expired for organization ${organizationId}`);
        return null;
      }
    }

    // Return full account data including access token
    return account;
  } catch (error) {
    console.error("Error fetching active payment processor with token:", error);
    return null;
  }
}

/**
 * Get all active payment processors across all organizations (SERVER-SIDE ONLY)
 *
 * ⚠️ WARNING: This function returns sensitive data (access tokens)
 * NEVER expose this to the client. Only use in webhook handlers.
 *
 * This is used by webhooks when we receive a payment notification but don't
 * know which organization it belongs to yet.
 *
 * @returns Array of all active payment processor accounts with tokens
 */
export async function getAllActivePaymentProcessors() {
  try {
    const activeAccounts = await db
      .select()
      .from(paymentProcessorAccount)
      .where(eq(paymentProcessorAccount.status, "active"));

    // Filter out expired tokens
    const now = new Date();
    return activeAccounts.filter((account) => {
      if (!account.tokenExpiresAt) return true;
      return new Date(account.tokenExpiresAt) > now;
    });
  } catch (error) {
    console.error("Error fetching all active payment processors:", error);
    return [];
  }
}
