import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCode, restaurantTable, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseQRCode, QRCodeSecurity } from "@/lib/qr-code";
import { getSecurityHeaders } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/validation/table-schemas";
import { getActivePaymentProcessorWithToken } from "@/server/payment-processors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createOrder, updateOrderPayment } from "@/server/orders";
import {
  getPaymentClaimById,
  updatePaymentClaimPayment,
} from "@/server/payment-claims";

/**
 * POST /api/checkout/[qrCode]/create-payment
 *
 * Creates a payment preference using the restaurant's payment processor.
 * This uses the restaurant's access token to create the payment on their behalf.
 *
 * For MercadoPago, this creates a Preference and returns the init_point (payment URL).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode: qrCodeParam } = await params;
    const body = await request.json();

    // Check if this is a claim-based payment or traditional payment
    const { claimId } = body;

    if (claimId) {
      // CLAIM-BASED PAYMENT FLOW
      return await handleClaimBasedPayment(qrCodeParam, body);
    } else {
      // TRADITIONAL FULL PAYMENT FLOW
      return await handleTraditionalPayment(qrCodeParam, body);
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        message: "An error occurred while setting up the payment. Please try again.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

/**
 * Handle claim-based payment (split payment flow)
 */
async function handleClaimBasedPayment(
  qrCodeParam: string,
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

  // Sanitize and validate QR code
  const sanitizedQrCode = sanitizeInput.qrCode(
    QRCodeSecurity.sanitizeQRCode(qrCodeParam)
  );

  const parsedQrCode = parseQRCode(sanitizedQrCode);
  if (!parsedQrCode) {
    return NextResponse.json(
      { error: "Invalid QR code format" },
      { status: 400, headers: getSecurityHeaders() }
    );
  }

  // Get QR code data with organization
  const qrCodeData = await db
    .select({
      qrCode: qrCode,
      organization: organization,
    })
    .from(qrCode)
    .innerJoin(organization, eq(organization.id, qrCode.organizationId))
    .where(eq(qrCode.code, sanitizedQrCode))
    .limit(1);

  if (!qrCodeData.length) {
    return NextResponse.json(
      { error: "QR code not found" },
      { status: 404, headers: getSecurityHeaders() }
    );
  }

  const { organization: org } = qrCodeData[0];

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

  if (paymentProcessor.processorType !== "mercadopago") {
    return NextResponse.json(
      {
        error: "Payment processor not supported",
        message: `${paymentProcessor.processorType} integration coming soon`,
      },
      { status: 501, headers: getSecurityHeaders() }
    );
  }

  // Create MercadoPago preference using the restaurant's access token
  const mpClient = new MercadoPagoConfig({
    accessToken: paymentProcessor.accessToken,
  });

  // Create a single item for the claim amount
  // MercadoPago requires unit_price to be an integer for currencies like COP
  const claimAmount = Math.round(parseFloat(claim.totalToPay));

  // Calculate marketplace fee (0.5% of claimed amount)
  const marketplaceFee = Math.round(claimAmount * 0.005);

  // Create the payment preference with claim ID as external_reference
  const preference = await new Preference(mpClient).create({
    body: {
      items: [
        {
          id: `claim-${claim.id}`,
          title: `Bill Payment (Portion)`,
          description: `Payment of ${parseFloat(claim.claimedAmount).toLocaleString()} COP + ${parseFloat(claim.splitFeePortion).toLocaleString()} COP fee`,
          quantity: 1,
          unit_price: claimAmount,
        },
      ],
      // CRITICAL: Use claim ID as external_reference
      external_reference: claim.id,
      metadata: {
        claimId: claim.id,
        orderId: claim.orderId,
        claimedAmount: claim.claimedAmount,
        splitFeePortion: claim.splitFeePortion,
        totalToPay: claim.totalToPay,
        organizationId: org.id,
        organizationName: org.name,
      },
      marketplace_fee: marketplaceFee,
      back_urls: {
        success: `${process.env.APP_URL}/checkout/${sanitizedQrCode}/success`,
        failure: `${process.env.APP_URL}/checkout/${sanitizedQrCode}/failure`,
        pending: `${process.env.APP_URL}/checkout/${sanitizedQrCode}/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: org.name,
    },
  });

  // Update the claim with the preference ID
  await updatePaymentClaimPayment(claim.id, {
    paymentProcessor: "mercadopago",
    paymentId: "", // Will be filled when payment is completed
    preferenceId: preference.id!,
    paymentMetadata: {
      preferenceCreatedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json(
    {
      success: true,
      paymentUrl: preference.init_point,
      preferenceId: preference.id,
      claimId: claim.id,
      orderId: claim.orderId,
      processorType: "mercadopago",
    },
    { headers: getSecurityHeaders() }
  );
}

/**
 * Handle traditional full payment (original flow)
 */
async function handleTraditionalPayment(
  qrCodeParam: string,
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
    // Sanitize and validate QR code
    const sanitizedQrCode = sanitizeInput.qrCode(
      QRCodeSecurity.sanitizeQRCode(qrCodeParam)
    );

    const parsedQrCode = parseQRCode(sanitizedQrCode);
    if (!parsedQrCode) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Get QR code data with organization
    const qrCodeData = await db
      .select({
        qrCode: qrCode,
        table: restaurantTable,
        organization: organization,
      })
      .from(qrCode)
      .innerJoin(restaurantTable, eq(restaurantTable.id, qrCode.tableId))
      .innerJoin(organization, eq(organization.id, qrCode.organizationId))
      .where(eq(qrCode.code, sanitizedQrCode))
      .limit(1);

    if (!qrCodeData.length) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const { organization: org, table } = qrCodeData[0];

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

    // Currently only MercadoPago is implemented
    if (paymentProcessor.processorType !== "mercadopago") {
      return NextResponse.json(
        {
          error: "Payment processor not supported",
          message: `${paymentProcessor.processorType} integration coming soon`,
        },
        { status: 501, headers: getSecurityHeaders() }
      );
    }

    // STEP 1: Create the order in our database FIRST
    // This gives us an order ID to track the payment
    const order = await createOrder({
      organizationId: org.id,
      tableId: table.id,
      qrCodeId: sanitizedQrCode,
      items: items as Array<{ name: string; quantity: number; price: number }>,
      subtotal: total - tipAmount,
      taxAmount: 0, // TODO: Calculate tax if needed
      tipAmount: tipAmount,
      totalAmount: total,
      notes: "Order created via QR checkout",
    });

    // STEP 2: Create MercadoPago preference using the restaurant's access token
    const mpClient = new MercadoPagoConfig({
      accessToken: paymentProcessor.accessToken,
    });

    // Map order items to MercadoPago items format
    // MercadoPago requires unit_price to be an integer for currencies like COP
    const mpItems = (items as Array<{ name: string; quantity: number; price: number }>).map((item) => ({
      id: item.name.toLowerCase().replace(/\s+/g, "-"),
      title: item.name,
      quantity: item.quantity,
      unit_price: Math.round(item.price),
    }));

    // Calculate marketplace fee (our commission) - 0.5%
    // TODO: Make this configurable per organization or globally
    const marketplaceFee = Math.round(total * 0.005); // 0.5% commission, rounded to integer

    // STEP 3: Create the payment preference with our order ID as external_reference
    const preference = await new Preference(mpClient).create({
      body: {
        items: mpItems,
        // CRITICAL: Use order ID as external_reference so we can track this payment
        external_reference: order.id,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          organizationId: org.id,
          organizationName: org.name,
          tableId: table.id,
          tableNumber: table.tableNumber,
          qrCodeId: sanitizedQrCode,
          tipAmount: tipAmount,
          orderTotal: total,
        },
        // Add marketplace commission fee
        marketplace_fee: marketplaceFee,
        // Set back URLs for payment flow
        back_urls: {
          success: `${process.env.APP_URL}/checkout/${sanitizedQrCode}/success`,
          failure: `${process.env.APP_URL}/checkout/${sanitizedQrCode}/failure`,
          pending: `${process.env.APP_URL}/checkout/${sanitizedQrCode}/pending`,
        },
        auto_return: "approved", // Automatically redirect on success
        // Additional settings
        notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`, // For payment notifications
        statement_descriptor: org.name, // Shows on customer's card statement
      },
    });

    // STEP 4: Update the order with the preference ID
    await updateOrderPayment(order.id, {
      paymentProcessor: "mercadopago",
      paymentId: "", // Will be filled when payment is completed
      preferenceId: preference.id!,
      paymentStatus: "pending",
      paymentMetadata: {
        preferenceCreatedAt: new Date().toISOString(),
      },
    });

    // Return the payment URL
    return NextResponse.json(
      {
        success: true,
        paymentUrl: preference.init_point, // URL to redirect user to complete payment
        preferenceId: preference.id,
        orderId: order.id,
        processorType: "mercadopago",
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error creating payment preference:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        message: "An error occurred while setting up the payment. Please try again.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
