import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentProcessorAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/payment-accounts?organizationId=xxx
 * Retrieves all payment processor accounts for an organization
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // TODO: Add permission check to ensure user has access to this organization

    // Get payment processor accounts
    const accounts = await db
      .select({
        id: paymentProcessorAccount.id,
        processorType: paymentProcessorAccount.processorType,
        processorAccountId: paymentProcessorAccount.processorAccountId,
        status: paymentProcessorAccount.status,
        metadata: paymentProcessorAccount.metadata,
        createdAt: paymentProcessorAccount.createdAt,
        updatedAt: paymentProcessorAccount.updatedAt,
      })
      .from(paymentProcessorAccount)
      .where(eq(paymentProcessorAccount.organizationId, organizationId))
      .orderBy(paymentProcessorAccount.createdAt);

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Error retrieving payment accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
