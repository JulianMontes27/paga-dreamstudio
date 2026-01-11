import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { paymentProcessorAccount } from "@/db/schema";
import { getMercadopagoUserInfo } from "@/lib/mercadopago";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;

  try {
    // Check Session
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the payment account
    const account = await db.query.paymentProcessorAccount.findFirst({
      where: eq(paymentProcessorAccount.id, accountId),
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Verify user owns this account
    if (account.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only works for MercadoPago
    if (account.processorType !== "mercadopago") {
      return NextResponse.json(
        { error: "Only MercadoPago accounts can be refreshed" },
        { status: 400 }
      );
    }

    // Fetch user info from MercadoPago
    const userInfo = await getMercadopagoUserInfo(account.accessToken);

    if (!userInfo) {
      return NextResponse.json(
        { error: "Failed to fetch user info from MercadoPago" },
        { status: 500 }
      );
    }

    // Update metadata with user info
    const currentMetadata =
      typeof account.metadata === "string"
        ? JSON.parse(account.metadata)
        : account.metadata || {};

    const updatedMetadata = {
      ...currentMetadata,
      email: userInfo.email || null,
      first_name: userInfo.first_name || null,
      last_name: userInfo.last_name || null,
      nickname: userInfo.nickname || null,
      country_id: userInfo.country_id || null,
    };

    // Update the account
    await db
      .update(paymentProcessorAccount)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(paymentProcessorAccount.id, accountId));

    return NextResponse.json({
      success: true,
      email: userInfo.email,
      metadata: updatedMetadata,
    });
  } catch (error) {
    console.error("Error refreshing payment account info:", error);
    return NextResponse.json(
      { error: "Failed to refresh account info" },
      { status: 500 }
    );
  }
}
