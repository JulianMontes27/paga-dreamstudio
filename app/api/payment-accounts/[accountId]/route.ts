import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentProcessorAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * DELETE /api/payment-accounts/[accountId]
 * Disconnects a payment processor account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { accountId } = await params;

    // TODO: Add permission check to ensure user is owner of the organization
    // that owns this payment account

    // Get account details before deletion for potential cleanup
    const account = await db
      .select()
      .from(paymentProcessorAccount)
      .where(eq(paymentProcessorAccount.id, accountId))
      .limit(1);

    if (!account.length) {
      return NextResponse.json(
        { error: "Payment account not found" },
        { status: 404 }
      );
    }

    // TODO: Implement processor-specific disconnection logic
    // For example, with Stripe Connect, you might want to deauthorize the account
    // with their API to revoke access tokens

    // Delete the account record
    const deletedAccount = await db
      .delete(paymentProcessorAccount)
      .where(eq(paymentProcessorAccount.id, accountId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Payment account disconnected successfully",
      deletedAccount: deletedAccount[0],
    });
  } catch (error) {
    console.error("Error disconnecting payment account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}