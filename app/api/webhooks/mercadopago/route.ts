import { NextRequest, NextResponse } from "next/server";
import { verifyMercadopagoPayment } from "@/lib/payment-verification";
import { updateOrderStatus, updateOrderPayment } from "@/server/orders";
import { getActivePaymentProcessorWithToken } from "@/server/payment-processors";
import {
  getPaymentClaimByPaymentId,
  markPaymentClaimAsPaid,
  updatePaymentClaimPayment,
} from "@/server/payment-claims";
import { db } from "@/db";
import { order as dbOrder } from "@/db/schema";
import { eq } from "drizzle-orm";

// clave secreta de mercadopago: 
// f734e213a5ed808411ba81c5bf7374b714378082ec2a28c55455dd202d6309c0

/**
 * POST /api/webhooks/mercadopago
 *
 * Webhook handler for Mercadopago payment notifications
 * This is called by Mercadopago whenever a payment status changes
 *
 * SECURITY: This is the SECURE way to handle payments
 * - Never trust client-side data (URL params)
 * - Always verify payments by fetching from Mercadopago API
 * - Update order status based on verified payment status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the webhook body
    const body = await request.json();

    console.log("Mercadopago webhook received:", {
      type: body.type,
      action: body.action,
      data: body.data,
    });

    // Mercadopago sends different types of notifications
    // We're interested in "payment" notifications
    if (body.type !== "payment") {
      return NextResponse.json(
        { message: "Notification type not handled" },
        { status: 200 }
      );
    }

    // Extract payment ID from webhook data
    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error("No payment ID in webhook");
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    // STEP 1: Try to get payment details from MercadoPago first to get external_reference
    console.log("Fetching payment details from MercadoPago to get external_reference");
    let paymentProcessor = null;
    let verification = null;

    // We need to fetch the payment to get metadata (specifically the organizationId and external_reference)
    // Try all active payment processors to find the right one
    const { getAllActivePaymentProcessors } = await import("@/server/payment-processors");
    const processors = await getAllActivePaymentProcessors();

    for (const processor of processors) {
      if (processor.processorType !== "mercadopago") continue;

      // Try to verify with this processor's token
      const result = await verifyMercadopagoPayment(
        paymentId.toString(),
        processor.accessToken
      );

      if (result.success || result.externalReference) {
        verification = result;
        paymentProcessor = processor;
        break;
      }
    }

    if (!verification || !paymentProcessor) {
      console.error("Could not verify payment with any active processor");
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 200 }
      );
    }

    const externalReference = verification.externalReference;
    if (!externalReference) {
      console.error("No external_reference in payment");
      return NextResponse.json(
        { message: "No reference in payment" },
        { status: 200 }
      );
    }

    console.log("Payment external_reference:", externalReference);

    // STEP 2: Check if this is a claim-based payment by trying to get claim by ID
    const { getPaymentClaimById } = await import("@/server/payment-claims");
    const claim = await getPaymentClaimById(externalReference);

    if (claim) {
      console.log("Found payment claim:", claim.id);
      // This is a claim-based payment - handle differently
      return await handleClaimWebhook(paymentId.toString(), claim);
    }

    // STEP 3: Fall back to traditional order-based payment
    console.log("Not a claim, looking for order by external_reference:", externalReference);
    const { getOrderById } = await import("@/server/orders");
    const order = await getOrderById(externalReference);

    if (!order) {
      console.error("Order not found by external_reference:", externalReference);
      return NextResponse.json(
        { message: "Order not found" },
        { status: 200 }
      );
    }

    // Payment processor and verification already obtained in STEP 1

    if (!verification.success && !verification.error) {
      console.error("Payment verification failed:", verification.error);
      // Still return 200 to Mercadopago to acknowledge receipt
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 200 }
      );
    }

    // STEP 4: Update the order with verified payment information
    if (!order.paymentId) {
      // First time receiving payment info - update the payment ID
      await updateOrderPayment(order.id, {
        paymentProcessor: "mercadopago",
        paymentId: verification.paymentId,
        preferenceId: order.preferenceId!,
        paymentStatus: verification.status,
        processorFee: verification.processorFee,
        marketplaceFee: verification.marketplaceFee,
        paymentMetadata: {
          ...((order.paymentMetadata as Record<string, unknown>) || {}),
          merchantOrderId: verification.merchantOrderId,
          currency: verification.currency,
          amount: verification.amount,
          netAmount: verification.netAmount,
          webhookProcessedAt: new Date().toISOString(),
        },
      });
    }

    // STEP 5: Update order status based on payment status
    const isPaid = verification.status === "approved";
    await updateOrderStatus(order.id, verification.status, isPaid);

    console.log("Webhook processed successfully:", {
      orderId: order.id,
      paymentId: verification.paymentId,
      status: verification.status,
      isPaid,
    });

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Error processing Mercadopago webhook:", error);

    // Always return 200 to Mercadopago to prevent retries
    // Log the error for debugging
    return NextResponse.json(
      {
        message: "Webhook received but processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

/**
 * Handle webhook for claim-based payments
 */
async function handleClaimWebhook(
  paymentId: string,
  claim: Awaited<ReturnType<typeof getPaymentClaimByPaymentId>>
) {
  try {
    if (!claim) {
      return NextResponse.json(
        { message: "Claim not found" },
        { status: 200 }
      );
    }

    console.log("Processing claim-based payment webhook:", {
      claimId: claim.id,
      orderId: claim.orderId,
      paymentId,
    });

    // Get payment processor for the order's organization
    const { getOrderById } = await import("@/server/orders");
    const order = await getOrderById(claim.orderId);

    if (!order) {
      console.error("Order not found for claim:", claim.orderId);
      return NextResponse.json(
        { message: "Order not found" },
        { status: 200 }
      );
    }

    const paymentProcessor = await getActivePaymentProcessorWithToken(
      order.organizationId
    );

    if (!paymentProcessor || paymentProcessor.processorType !== "mercadopago") {
      console.error("Payment processor not found or invalid");
      return NextResponse.json(
        { message: "Payment processor configuration error" },
        { status: 200 }
      );
    }

    // Verify the payment with MercadoPago API
    const verification = await verifyMercadopagoPayment(
      paymentId,
      paymentProcessor.accessToken
    );

    if (!verification.success && verification.error) {
      console.error("Payment verification failed:", verification.error);
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 200 }
      );
    }

    // Update the claim with payment information if not already set
    if (!claim.paymentId) {
      await updatePaymentClaimPayment(claim.id, {
        paymentProcessor: "mercadopago",
        paymentId: verification.paymentId,
        preferenceId: claim.preferenceId!,
        processorFee: verification.processorFee,
        marketplaceFee: verification.marketplaceFee,
        paymentMetadata: {
          ...((claim.paymentMetadata as Record<string, unknown>) || {}),
          merchantOrderId: verification.merchantOrderId,
          currency: verification.currency,
          amount: verification.amount,
          netAmount: verification.netAmount,
          webhookProcessedAt: new Date().toISOString(),
        },
      });
    }

    // Handle different payment statuses
    if (verification.status === "approved" && claim.status !== "paid") {
      // Payment approved - mark claim as paid
      const result = await markPaymentClaimAsPaid(claim.id, verification.status);

      console.log("Claim marked as paid:", {
        claimId: claim.id,
        orderId: claim.orderId,
        isFullyPaid: result.isFullyPaid,
        totalPaid: result.totalPaid,
      });

      // Accumulate fees on the order
      const currentProcessorFee = parseFloat(order.processorFee || "0");
      const currentMarketplaceFee = parseFloat(order.marketplaceFee || "0");

      await db
        .update(dbOrder)
        .set({
          processorFee: (currentProcessorFee + verification.processorFee).toString(),
          marketplaceFee: (currentMarketplaceFee + verification.marketplaceFee).toString(),
          updatedAt: new Date(),
        })
        .where(eq(dbOrder.id, order.id));

      console.log("Order fees accumulated:", {
        orderId: order.id,
        addedProcessorFee: verification.processorFee,
        addedMarketplaceFee: verification.marketplaceFee,
        newTotalProcessorFee: currentProcessorFee + verification.processorFee,
        newTotalMarketplaceFee: currentMarketplaceFee + verification.marketplaceFee,
      });
    } else if (
      ["rejected", "cancelled", "refunded", "charged_back"].includes(verification.status) &&
      claim.status !== "paid"
    ) {
      // Payment rejected/cancelled - cancel the claim to release the reserved amount
      const { cancelPaymentClaim } = await import("@/server/payment-claims");
      await cancelPaymentClaim(claim.id);

      console.log("Claim cancelled due to payment rejection:", {
        claimId: claim.id,
        orderId: claim.orderId,
        paymentStatus: verification.status,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Claim webhook processed",
      claimId: claim.id,
    });
  } catch (error) {
    console.error("Error processing claim webhook:", error);
    return NextResponse.json(
      {
        message: "Claim webhook received but processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/mercadopago
 *
 * Health check endpoint for the webhook
 */
export async function GET() {
  return NextResponse.json({
    message: "Mercadopago webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
