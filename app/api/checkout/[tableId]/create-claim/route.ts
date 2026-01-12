import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSecurityHeaders } from "@/lib/rate-limit";
import {
  createPaymentClaim,
  getAvailableAmount,
  getOrderPaymentProgress,
} from "@/server/payment-claims";
import { randomUUID } from "crypto";

/**
 * POST /api/checkout/[tableId]/create-claim
 *
 * Creates a payment claim (reserves an amount from the order total)
 * This is the first step in the split payment flow.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    const body = await request.json();

    // Validate request body
    const { orderId, claimedAmount, sessionToken: providedToken } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (typeof claimedAmount !== "number" || claimedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid claimed amount" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Verify table exists
    const tableData = await db
      .select()
      .from(table)
      .where(eq(table.id, tableId))
      .limit(1);

    if (!tableData.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    // Generate or use provided session token
    const sessionToken = providedToken || randomUUID();

    // Get current availability
    const availability = await getAvailableAmount(orderId);

    // Check if requested amount is available
    if (claimedAmount > availability.availableAmount) {
      return NextResponse.json(
        {
          error: "Amount not available",
          message: `Only ${availability.availableAmount.toLocaleString()} COP is available`,
          availableAmount: availability.availableAmount,
          totalAmount: availability.totalAmount,
          totalClaimed: availability.totalClaimed,
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Create the payment claim
    const claim = await createPaymentClaim({
      orderId,
      claimedAmount,
      sessionToken,
    });

    return NextResponse.json(
      {
        success: true,
        claim: {
          id: claim.id,
          claimedAmount: parseFloat(claim.claimedAmount),
          splitFeePortion: parseFloat(claim.splitFeePortion),
          totalToPay: parseFloat(claim.totalToPay),
          status: claim.status,
          expiresAt: claim.expiresAt,
        },
        sessionToken, // Return for client to use in subsequent requests
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error creating payment claim:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to create payment claim",
        message: errorMessage,
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

/**
 * GET /api/checkout/[tableId]/create-claim?orderId=xxx
 *
 * Get payment progress for an order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const progress = await getOrderPaymentProgress(orderId);

    return NextResponse.json(
      {
        orderId,
        totalAmount: progress.totalAmount,
        totalClaimed: progress.totalClaimed,
        totalPaid: progress.totalPaid,
        availableAmount: progress.availableAmount,
        percentPaid: progress.percentPaid,
        claims: progress.claims.map((claim) => ({
          id: claim.id,
          claimedAmount: claim.claimedAmount,
          splitFeePortion: claim.splitFeePortion,
          totalToPay: claim.totalToPay,
          status: claim.status,
          expiresAt: claim.expiresAt,
          paidAt: claim.paidAt,
        })),
        isFullyPaid: progress.isFullyPaid,
        paidCount: progress.paidCount,
        totalCount: progress.totalCount,
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error getting payment progress:", error);

    return NextResponse.json(
      {
        error: "Failed to get payment progress",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
