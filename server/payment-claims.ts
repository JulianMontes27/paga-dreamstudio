/**
 * Payment Claims Server Functions
 *
 * Handles collaborative bill splitting with payment reservations.
 * Prevents overpayment through atomic transactions and database locking.
 */

import { db } from "@/db";
import { order, paymentClaim } from "@/db/schema";
import { eq, and, or, gt, lt, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const FIXED_FEE_PER_TRANSACTION = 800; // COP - MercadoPago fee
const CLAIM_EXPIRY_MINUTES = 5;

/**
 * Get available amount that can be claimed from an order
 *
 * This function first expires any old claims before calculating availability,
 * ensuring accurate results even if claims have timed out.
 *
 * @param orderId - The order ID
 * @returns Available amount and order details
 */
export async function getAvailableAmount(orderId: string) {
  // First, expire any old claims for this order to ensure accurate calculation
  await expireOldClaimsForOrder(orderId);

  const [orderData] = await db
    .select()
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);

  if (!orderData) {
    throw new Error("Order not found");
  }

  // Get all active claims (not expired and not cancelled)
  // Note: paid claims don't have expiry concerns
  const activeClaims = await db
    .select()
    .from(paymentClaim)
    .where(
      and(
        eq(paymentClaim.orderId, orderId),
        or(
          and(
            or(
              eq(paymentClaim.status, "reserved"),
              eq(paymentClaim.status, "processing")
            ),
            gt(paymentClaim.expiresAt, new Date())
          ),
          eq(paymentClaim.status, "paid")
        )
      )
    );

  const totalClaimed = activeClaims.reduce(
    (sum, claim) => sum + parseFloat(claim.claimedAmount),
    0
  );

  const availableAmount = parseFloat(orderData.totalAmount) - totalClaimed;

  return {
    order: orderData,
    activeClaims,
    totalClaimed,
    availableAmount,
    totalAmount: parseFloat(orderData.totalAmount),
  };
}

/**
 * Expire old claims for a specific order
 *
 * @param orderId - The order ID
 */
async function expireOldClaimsForOrder(orderId: string) {
  const result = await db
    .update(paymentClaim)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paymentClaim.orderId, orderId),
        or(
          eq(paymentClaim.status, "reserved"),
          eq(paymentClaim.status, "processing")
        ),
        lt(paymentClaim.expiresAt, new Date())
      )
    )
    .returning();

  if (result.length > 0) {
    await recalculateOrderTotals(orderId);
  }

  return result.length;
}

/**
 * Creates a payment claim (reserves an amount for payment)
 *
 * Uses database transaction with row locking to prevent race conditions
 *
 * @param params - Claim creation parameters
 * @returns The created payment claim
 */
export async function createPaymentClaim(params: {
  orderId: string;
  claimedAmount: number;
  sessionToken: string;
}) {
  const { orderId, claimedAmount, sessionToken } = params;

  // Validate amount
  if (claimedAmount <= 0) {
    throw new Error("Claimed amount must be greater than zero");
  }

  return await db.transaction(async (tx) => {
    // STEP 1: LOCK the order row to prevent concurrent modifications
    const [lockedOrder] = await tx
      .select()
      .from(order)
      .where(eq(order.id, orderId))
      .for("update");

    if (!lockedOrder) {
      throw new Error("Order not found");
    }

    // Check if order allows payment claims
    if (lockedOrder.status === "paid") {
      throw new Error("Order is already fully paid");
    }

    if (lockedOrder.status === "cancelled") {
      throw new Error("Order has been cancelled");
    }

    // STEP 2: Check if this session already has an active claim
    // If so, cancel it (user abandoned previous payment attempt and is retrying)
    const existingClaims = await tx
      .select()
      .from(paymentClaim)
      .where(
        and(
          eq(paymentClaim.orderId, orderId),
          eq(paymentClaim.sessionToken, sessionToken),
          inArray(paymentClaim.status, ["reserved", "processing"]),
          gt(paymentClaim.expiresAt, new Date())
        )
      );

    if (existingClaims.length > 0) {
      // Cancel existing claims from this session - user is retrying payment
      await tx
        .update(paymentClaim)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(
          inArray(
            paymentClaim.id,
            existingClaims.map((c) => c.id)
          )
        );
    }

    // STEP 3: Get all active claims
    // Note: paid claims don't have expiry concerns - only reserved/processing do
    const activeClaims = await tx
      .select()
      .from(paymentClaim)
      .where(
        and(
          eq(paymentClaim.orderId, orderId),
          or(
            and(
              or(
                eq(paymentClaim.status, "reserved"),
                eq(paymentClaim.status, "processing")
              ),
              gt(paymentClaim.expiresAt, new Date())
            ),
            eq(paymentClaim.status, "paid")
          )
        )
      );

    // STEP 4: Calculate available amount
    const totalClaimed = activeClaims.reduce(
      (sum, claim) => sum + parseFloat(claim.claimedAmount),
      0
    );
    const orderTotal = parseFloat(lockedOrder.totalAmount);
    const availableAmount = orderTotal - totalClaimed;

    // STEP 5: VALIDATE - can't claim more than available
    if (claimedAmount > availableAmount) {
      throw new Error(
        `Only ${availableAmount.toLocaleString()} COP is available. ` +
          `Someone else has already claimed the rest.`
      );
    }

    // STEP 6: Calculate transaction fees
    // MercadoPago charges 800 COP per transaction
    //
    // FAIR APPROACH:
    // - If paying 100% of ORIGINAL BILL → NO convenience fee (baseline, no split)
    // - If paying < 100% of ORIGINAL BILL → Proportional share of transaction fee
    //
    // Example: 2 people split 50/50 on 100,000 COP bill
    //   - Person 1 claims 50,000: (50,000 / 100,000) * 800 = 400 fee → pays 50,400
    //   - Person 2 claims 50,000: (50,000 / 100,000) * 800 = 400 fee → pays 50,400
    //   - Total collected: 100,800 = covers bill + both transaction fees ✓
    //
    // Example: 1 person pays full 100,000 COP bill
    //   - Person 1 claims 100,000: (100,000 / 100,000) * 800 = 800, but isPayingFull = true → 0 fee
    //   - Person 1 pays: 100,000 (no extra fee, baseline) ✓
    //
    // IMPORTANT: Check against ORIGINAL bill amount, not available amount
    // Otherwise, the last person to complete payment gets no fee incorrectly

    // Check if paying the full ORIGINAL bill (not just available amount)
    const isPayingFullBill = claimedAmount >= orderTotal;

    // This person's proportional share of their transaction fee
    const proportionalFee = isPayingFullBill
      ? 0
      : (claimedAmount / orderTotal) * FIXED_FEE_PER_TRANSACTION;

    // Total they need to pay
    const totalToPay = claimedAmount + proportionalFee;

    // STEP 7: CREATE the payment claim
    const claimId = randomUUID();
    const expiresAt = new Date(Date.now() + CLAIM_EXPIRY_MINUTES * 60 * 1000);

    const [newClaim] = await tx
      .insert(paymentClaim)
      .values({
        id: claimId,
        orderId,
        claimedAmount: claimedAmount.toFixed(2),
        splitFeePortion: proportionalFee.toFixed(2),
        totalToPay: totalToPay.toFixed(2),
        status: "reserved",
        expiresAt,
        sessionToken,
      })
      .returning();

    // STEP 8: Update order status and totals
    const newTotalClaimed = totalClaimed + claimedAmount;
    const isFullyClaimed = newTotalClaimed >= orderTotal;

    await tx
      .update(order)
      .set({
        status: isFullyClaimed ? "payment_started" : lockedOrder.status,
        totalClaimed: newTotalClaimed.toFixed(2),
        isLocked: true, // Lock order from item modifications
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));

    return newClaim;
  });
}

/**
 * Update a payment claim's payment tracking info
 *
 * @param claimId - The claim ID
 * @param paymentData - Payment tracking data
 */
export async function updatePaymentClaimPayment(
  claimId: string,
  paymentData: {
    paymentProcessor: string;
    paymentId: string;
    preferenceId: string;
    paymentMetadata?: Record<string, unknown>;
    processorFee?: number;
    marketplaceFee?: number;
  }
) {
  const [updatedClaim] = await db
    .update(paymentClaim)
    .set({
      paymentProcessor: paymentData.paymentProcessor,
      paymentId: paymentData.paymentId,
      preferenceId: paymentData.preferenceId,
      paymentMetadata: paymentData.paymentMetadata,
      processorFee: paymentData.processorFee?.toString() ?? "0.00",
      marketplaceFee: paymentData.marketplaceFee?.toString() ?? "0.00",
      status: "processing",
      updatedAt: new Date(),
    })
    .where(eq(paymentClaim.id, claimId))
    .returning();

  return updatedClaim;
}

/**
 * Mark a payment claim as paid and update order progress
 *
 * @param claimId - The claim ID
 * @param paymentStatus - Payment status from processor
 */
export async function markPaymentClaimAsPaid(
  claimId: string,
  paymentStatus: string
) {
  return await db.transaction(async (tx) => {
    // STEP 1: Update the claim
    const [claim] = await tx
      .update(paymentClaim)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentClaim.id, claimId))
      .returning();

    if (!claim) {
      throw new Error("Payment claim not found");
    }

    // STEP 2: Get all paid claims for this order
    const paidClaims = await tx
      .select()
      .from(paymentClaim)
      .where(
        and(
          eq(paymentClaim.orderId, claim.orderId),
          eq(paymentClaim.status, "paid")
        )
      );

    // Calculate total paid amount (including convenience fees)
    // IMPORTANT: Use totalToPay not claimedAmount to include split fees
    const totalPaid = paidClaims.reduce(
      (sum, c) => sum + parseFloat(c.totalToPay),
      0
    );

    // STEP 3: Get order to check if fully paid
    const [orderData] = await tx
      .select()
      .from(order)
      .where(eq(order.id, claim.orderId));

    if (!orderData) {
      throw new Error("Order not found");
    }

    const orderTotal = parseFloat(orderData.totalAmount);
    const isFullyPaid = totalPaid >= orderTotal;

    // STEP 4: Update order status
    await tx
      .update(order)
      .set({
        status: isFullyPaid ? "paid" : "partially_paid",
        totalPaid: totalPaid.toFixed(2),
        paymentStatus: isFullyPaid ? "approved" : "partially_paid",
        paidAt: isFullyPaid ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(order.id, claim.orderId));

    return { claim, isFullyPaid, totalPaid };
  });
}

/**
 * Get payment claim by ID
 *
 * @param claimId - The claim ID
 * @returns The payment claim or null
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
 * Get payment claim by preference ID
 *
 * @param preferenceId - The payment preference ID
 * @returns The payment claim or null
 */
export async function getPaymentClaimByPreferenceId(preferenceId: string) {
  const [claim] = await db
    .select()
    .from(paymentClaim)
    .where(eq(paymentClaim.preferenceId, preferenceId))
    .limit(1);

  return claim || null;
}

/**
 * Get payment claim by payment ID
 *
 * @param paymentId - The external payment processor payment ID
 * @returns The payment claim or null
 */
export async function getPaymentClaimByPaymentId(paymentId: string) {
  const [claim] = await db
    .select()
    .from(paymentClaim)
    .where(eq(paymentClaim.paymentId, paymentId))
    .limit(1);

  return claim || null;
}

/**
 * Get all payment claims for an order
 *
 * @param orderId - The order ID
 * @returns Array of payment claims
 */
export async function getPaymentClaimsByOrderId(orderId: string) {
  const claims = await db
    .select()
    .from(paymentClaim)
    .where(eq(paymentClaim.orderId, orderId))
    .orderBy(paymentClaim.createdAt);

  return claims;
}

/**
 * Get order payment progress
 *
 * @param orderId - The order ID
 * @returns Payment progress details
 */
export async function getOrderPaymentProgress(orderId: string) {
  const [orderData] = await db
    .select()
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);

  if (!orderData) {
    throw new Error("Order not found");
  }

  const claims = await getPaymentClaimsByOrderId(orderId);

  // Filter active claims (not expired)
  // Note: paid claims don't have expiry concerns - only reserved/processing do
  const now = new Date();
  const activeClaims = claims.filter(
    (claim) =>
      claim.status === "paid" ||
      ((claim.status === "reserved" || claim.status === "processing") &&
        new Date(claim.expiresAt) > now)
  );

  const paidClaims = claims.filter((claim) => claim.status === "paid");

  const totalAmount = parseFloat(orderData.totalAmount);

  // totalClaimed should be bill amount claimed (no fees)
  const totalClaimed = activeClaims.reduce(
    (sum, claim) => sum + parseFloat(claim.claimedAmount),
    0
  );

  // totalPaid should include fees (actual money collected)
  const totalPaid = paidClaims.reduce(
    (sum, claim) => sum + parseFloat(claim.totalToPay),
    0
  );

  const availableAmount = totalAmount - totalClaimed;
  const percentPaid = (totalPaid / totalAmount) * 100;

  return {
    order: orderData,
    claims: activeClaims,
    totalAmount,
    totalClaimed,
    totalPaid,
    availableAmount,
    percentPaid,
    isFullyPaid: orderData.status === "paid",
    paidCount: paidClaims.length,
    totalCount: activeClaims.length,
  };
}

/**
 * Cancel a payment claim (when user abandons payment)
 *
 * @param claimId - The claim ID
 * @returns The cancelled claim
 */
export async function cancelPaymentClaim(claimId: string) {
  // Get the claim first
  const [claim] = await db
    .select()
    .from(paymentClaim)
    .where(eq(paymentClaim.id, claimId))
    .limit(1);

  if (!claim) {
    return null;
  }

  // Only cancel if not already paid
  if (claim.status === "paid") {
    return claim; // Already paid, don't cancel
  }

  // Update claim status to cancelled
  const [cancelledClaim] = await db
    .update(paymentClaim)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(paymentClaim.id, claimId))
    .returning();

  // Recalculate order totals
  await recalculateOrderTotals(claim.orderId);

  return cancelledClaim;
}

/**
 * Cancel a payment claim by preference ID (when user abandons at payment processor)
 *
 * @param preferenceId - The payment preference ID
 * @returns The cancelled claim or null
 */
export async function cancelPaymentClaimByPreferenceId(preferenceId: string) {
  const claim = await getPaymentClaimByPreferenceId(preferenceId);

  if (!claim) {
    return null;
  }

  return cancelPaymentClaim(claim.id);
}

/**
 * Expire old payment claims (to be run periodically or on-demand)
 *
 * Expires both "reserved" and "processing" claims that have passed their expiry time.
 * This handles abandoned payments where the user never completed payment at MercadoPago.
 *
 * @returns Number of claims expired
 */
export async function expireOldClaims() {
  const result = await db
    .update(paymentClaim)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        // Expire both reserved and processing claims
        or(
          eq(paymentClaim.status, "reserved"),
          eq(paymentClaim.status, "processing")
        ),
        lt(paymentClaim.expiresAt, new Date())
      )
    )
    .returning();

  // Recalculate order totals for affected orders
  if (result.length > 0) {
    const affectedOrderIds = [...new Set(result.map((claim) => claim.orderId))];

    for (const orderId of affectedOrderIds) {
      await recalculateOrderTotals(orderId);
    }
  }

  return result.length;
}

/**
 * Recalculate order's claimed and paid totals
 *
 * @param orderId - The order ID
 */
async function recalculateOrderTotals(orderId: string) {
  return await db.transaction(async (tx) => {
    const [orderData] = await tx
      .select()
      .from(order)
      .where(eq(order.id, orderId))
      .for("update");

    if (!orderData) return;

    // Get active claims
    // Note: paid claims don't have expiry concerns - only reserved/processing do
    const activeClaims = await tx
      .select()
      .from(paymentClaim)
      .where(
        and(
          eq(paymentClaim.orderId, orderId),
          or(
            and(
              or(
                eq(paymentClaim.status, "reserved"),
                eq(paymentClaim.status, "processing")
              ),
              gt(paymentClaim.expiresAt, new Date())
            ),
            eq(paymentClaim.status, "paid")
          )
        )
      );

    const paidClaims = activeClaims.filter((c) => c.status === "paid");

    // totalClaimed should be bill amount claimed (no fees)
    const totalClaimed = activeClaims.reduce(
      (sum, claim) => sum + parseFloat(claim.claimedAmount),
      0
    );

    // totalPaid should include fees (actual money collected)
    const totalPaid = paidClaims.reduce(
      (sum, claim) => sum + parseFloat(claim.totalToPay),
      0
    );

    await tx
      .update(order)
      .set({
        totalClaimed: totalClaimed.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));
  });
}
