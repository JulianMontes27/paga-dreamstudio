import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSecurityHeaders } from "@/lib/rate-limit";
import { getActivePaymentProcessorWithToken } from "@/server/payment-processors";
import { createOrder } from "@/server/orders";
import { getPaymentClaimById } from "@/server/payment-claims";

/**
 * POST /api/checkout/[tableId]/create-payment
 *
 * Creates a payment preference using the restaurant's payment processor.
 * This uses the restaurant's access token to create the payment on their behalf.
 *
 * For MercadoPago, this creates a Preference and returns the init_point (payment URL).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    const body = await request.json();

    // Check if this is a claim-based payment or traditional payment
    const { claimId } = body;

    if (claimId) {
      // CLAIM-BASED PAYMENT FLOW
      return await handleClaimBasedPayment(tableId, body);
    } else {
      // TRADITIONAL FULL PAYMENT FLOW
      return await handleTraditionalPayment(tableId, body);
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        message:
          "An error occurred while setting up the payment. Please try again.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

/**
 * Handle claim-based payment (split payment flow)
 */
async function handleClaimBasedPayment(
  tableId: string,
  body: { claimId: string }
) {
  const { claimId } = body;

  // Get the payment claim
  const claim = await getPaymentClaimById(claimId);

  if (!claim) {
    return NextResponse.json(
      { error: "Payment claim not found" },
      { status: 404, headers: getSecurityHeaders() }
    );
  }

  // Check if claim is still valid
  if (claim.status !== "reserved") {
    return NextResponse.json(
      { error: `Payment claim is ${claim.status}` },
      { status: 400, headers: getSecurityHeaders() }
    );
  }

  if (new Date(claim.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: "Payment claim has expired" },
      { status: 400, headers: getSecurityHeaders() }
    );
  }

  // Get table data with organization
  const tableData = await db
    .select({
      table: table,
      organization: organization,
    })
    .from(table)
    .innerJoin(organization, eq(organization.id, table.organizationId))
    .where(eq(table.id, tableId))
    .limit(1);

  if (!tableData.length) {
    return NextResponse.json(
      { error: "Table not found" },
      { status: 404, headers: getSecurityHeaders() }
    );
  }

  const { organization: org } = tableData[0];

  // Get active payment processor
  const paymentProcessor = await getActivePaymentProcessorWithToken(org.id);

  if (!paymentProcessor) {
    return NextResponse.json(
      {
        error: "Payment processor not configured",
        message:
          "The restaurant has not set up a payment processor. Please speak to a staff member.",
      },
      { status: 503, headers: getSecurityHeaders() }
    );
  }

  // TODO: Implement MercadoPago integration here
  // For now, return a placeholder response
  return NextResponse.json(
    {
      success: false,
      error: "Payment processing not yet implemented",
      message: "MercadoPago integration is not yet configured",
    },
    { status: 501, headers: getSecurityHeaders() }
  );
}

/**
 * Handle traditional full payment (original flow)
 */
async function handleTraditionalPayment(
  tableId: string,
  body: { items: unknown[]; total: number; tipAmount?: number }
) {
  const { items, total, tipAmount = 0 } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Invalid order items" },
      { status: 400, headers: getSecurityHeaders() }
    );
  }

  if (typeof total !== "number" || total <= 0) {
    return NextResponse.json(
      { error: "Invalid order total" },
      { status: 400, headers: getSecurityHeaders() }
    );
  }

  try {
    // Get table data with organization
    const tableData = await db
      .select({
        table: table,
        organization: organization,
      })
      .from(table)
      .innerJoin(organization, eq(organization.id, table.organizationId))
      .where(eq(table.id, tableId))
      .limit(1);

    if (!tableData.length) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const { organization: org, table: tableInfo } = tableData[0];

    // Get active payment processor WITH access token (server-side only)
    const paymentProcessor = await getActivePaymentProcessorWithToken(org.id);

    if (!paymentProcessor) {
      return NextResponse.json(
        {
          error: "Payment processor not configured",
          message:
            "The restaurant has not set up a payment processor. Please speak to a staff member.",
        },
        { status: 503, headers: getSecurityHeaders() }
      );
    }

    // Create the order in our database FIRST
    const order = await createOrder({
      organizationId: org.id,
      tableId: tableInfo.id,
      items: items as Array<{ name: string; quantity: number; price: number }>,
      subtotal: total - tipAmount,
      taxAmount: 0,
      tipAmount: tipAmount,
      totalAmount: total,
      notes: "Order created via NFC checkout",
    });

    // TODO: Implement MercadoPago integration here
    // For now, return a placeholder response
    return NextResponse.json(
      {
        success: false,
        error: "Payment processing not yet implemented",
        message: "MercadoPago integration is not yet configured",
        orderId: order.id,
      },
      { status: 501, headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error creating payment preference:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        message:
          "An error occurred while setting up the payment. Please try again.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
