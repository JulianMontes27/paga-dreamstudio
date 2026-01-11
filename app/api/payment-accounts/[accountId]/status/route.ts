import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  paymentProcessorAccount,
  paymentProcessorStatus,
} from "@/db/restaurant-schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * PATCH /api/payment-accounts/[accountId]/status
 * Updates payment processor account status with one-active-per-organization constraint
 */
export async function PATCH(
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
    const { status } = await request.json();

    // Validate status
    const validStatuses = [
      "active",
      "inactive",
      "expired",
      "revoked",
      "pending",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get account details to verify ownership and get organization
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

    const paymentAccount = account[0];

    // TODO: Add permission check to ensure user is owner/admin of the organization
    // that owns this payment account

    // If setting to active, deactivate all other accounts for this organization
    if (status === "active") {
      await db
        .update(paymentProcessorAccount)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              paymentProcessorAccount.organizationId,
              paymentAccount.organizationId
            ),
            eq(paymentProcessorAccount.status, "active")
          )
        );
    }

    // Update the target account status
    const updatedAccount = await db
      .update(paymentProcessorAccount)
      .set({
        status: status as (typeof paymentProcessorStatus.enumValues)[number], // paymentProcessorStatus.enumValues[number] resolves to "active" | "inactive" | "expired" | "revoked" | "pending"
        updatedAt: new Date(),
      })
      .where(eq(paymentProcessorAccount.id, accountId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Payment account status updated to ${status}`,
      account: updatedAccount[0],
    });
  } catch (error) {
    console.error("Error updating payment account status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
