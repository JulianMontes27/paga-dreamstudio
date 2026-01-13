import { db } from "@/db";
import { paymentClaim } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface CreatePaymentClaimParams {
  orderId: string;
  claimedAmount: number;
  sessionToken: string;
}

interface PaymentClaimUpdate {
  paymentProcessor: string;
  paymentId: string;
  preferenceId: string;
  paymentMetadata: Record<string, any>;
}

/**
 * Create a payment claim for collaborative payments
 */
export async function createPaymentClaim(params: CreatePaymentClaimParams) {
  const { orderId, claimedAmount, sessionToken } = params;

  // Calculate split fee (you can adjust the logic)
  const splitFeePortion = claimedAmount * 0.005; // 0.5% fee
  const totalToPay = claimedAmount + splitFeePortion;

  // Set expiration (5 minutes from now)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const [claim] = await db
    .insert(paymentClaim)
    .values({
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      claimedAmount: claimedAmount.toString(),
      splitFeePortion: splitFeePortion.toString(),
      totalToPay: totalToPay.toString(),
      sessionToken,
      status: "reserved",
      expiresAt,
    })
    .returning();

  return claim;
}

/**
 * Get available amount for an order
 */
export async function getAvailableAmount(orderId: string) {
  // TODO: Implement actual logic to calculate available amount
  // This should fetch the order total and subtract already claimed amounts
  console.warn("getAvailableAmount not fully implemented - returning default values");

  return {
    totalAmount: 100000, // Default placeholder
    totalClaimed: 0,
    availableAmount: 100000,
  };
}

/**
 * Get payment claim by ID
 */
export async function getPaymentClaimById(claimId: string) {
  const [claim] = await db
    .select()
    .from(paymentClaim)
    .where(eq(paymentClaim.id, claimId))
    .limit(1);

  return claim || null;
}

/**
 * Update payment claim with payment information
 */
export async function updatePaymentClaimPayment(
  claimId: string,
  update: PaymentClaimUpdate
) {
  const [updatedClaim] = await db
    .update(paymentClaim)
    .set({
      paymentProcessor: update.paymentProcessor,
      paymentId: update.paymentId,
      preferenceId: update.preferenceId,
      paymentMetadata: update.paymentMetadata,
      })
    .where(eq(paymentClaim.id, claimId))
    .returning();

  return updatedClaim;
}

/**
 * Get order payment progress
 */
export async function getOrderPaymentProgress(orderId: string) {
  const claims = await db
    .select()
    .from(paymentClaim)
    .where(eq(paymentClaim.orderId, orderId));

  const totalClaimed = claims.reduce(
    (sum, claim) => sum + parseFloat(claim.claimedAmount),
    0
  );
  const totalPaid = claims
    .filter((c) => c.status === "paid")
    .reduce((sum, claim) => sum + parseFloat(claim.claimedAmount), 0);

  // TODO: Get actual order total from order table
  const totalAmount = 100000; // Placeholder

  return {
    totalAmount,
    totalClaimed,
    totalPaid,
    availableAmount: totalAmount - totalClaimed,
    percentPaid: (totalPaid / totalAmount) * 100,
    claims,
    isFullyPaid: totalPaid >= totalAmount,
    paidCount: claims.filter((c) => c.status === "paid").length,
    totalCount: claims.length,
  };
}

/**
 * Cancel a payment claim
 */
export async function cancelPaymentClaim(claimId: string) {
  const [cancelledClaim] = await db
    .update(paymentClaim)
    .set({
      status: "cancelled",
      })
    .where(eq(paymentClaim.id, claimId))
    .returning();

  return cancelledClaim;
}
