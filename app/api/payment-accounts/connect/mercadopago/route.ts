import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { paymentProcessorAccount, organization } from "@/db/schema";
import { connectMercadopagoAccount, getMercadopagoUserInfo } from "@/lib/mercadopago";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  console.log("MercadoPago OAuth callback hit");

  // Obtenemos el code y state de los request search-params
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  console.log("Code:", code);
  console.log("State:", state);

  // Check Session
  const headersList = await headers();
  console.log("Request headers:", Object.fromEntries(headersList.entries()));

  const session = await auth.api.getSession({
    headers: headersList, // pass the headers object for Better Auth to handle cookies
  });

  console.log("Session:", session?.user?.id ? "Found" : "Not found");
  console.log("Full session:", session);

  if (!session?.user?.id) {
    console.log("No session found, redirecting to login");
    return NextResponse.redirect(`${process.env.APP_URL}/login`);
  }

  // Extract organizationId from state parameter (now it's just the organization ID string)
  const organizationId = state || "";

  // If no organizationId in state, redirect with error
  if (!organizationId) {
    console.error("No organizationId found in state parameter");
    return NextResponse.redirect(
      `${process.env.APP_URL}/dashboard?error=missing_organization`
    );
  }

  try {
    // Get organization details to get the slug for redirect
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Get OAuth credentials from MercadoPago
    const credentials = await connectMercadopagoAccount(code!);
    console.log(credentials);

    // Validate credentials
    if (!credentials?.access_token) {
      throw new Error("No access token received from MercadoPago");
    }

    // Use the user_id directly from credentials response
    // The user_id field contains the actual MercadoPago user ID
    const processorAccountId =
      credentials.user_id?.toString() ||
      credentials.access_token.split("-").pop() ||
      "";

    if (!processorAccountId) {
      throw new Error("Could not extract MercadoPago user ID");
    }

    // Fetch MercadoPago user information to get email and other details
    const userInfo = await getMercadopagoUserInfo(credentials.access_token);
    console.log("MercadoPago user info:", userInfo);

    // Insert into payment_processor_account table
    await db.insert(paymentProcessorAccount).values({
      id: `mpa_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: session.user.id,
      organizationId, // Add organizationId
      processorType: "mercadopago",
      processorAccountId,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || null,
      tokenExpiresAt: credentials.expires_in
        ? new Date(Date.now() + credentials.expires_in * 1000)
        : null,
      scope: credentials.scope || null,
      status: "inactive",
      metadata: {
        public_key: credentials.public_key,
        live_mode: credentials.live_mode || false,
        user_id: processorAccountId,
        email: userInfo?.email || null,
        first_name: userInfo?.first_name || null,
        last_name: userInfo?.last_name || null,
        nickname: userInfo?.nickname || null,
        country_id: userInfo?.country_id || null,
      },
    });

    // Redirect back to the organization settings with success message
    return NextResponse.redirect(
      `${process.env.APP_URL}/dashboard/${org.slug}/settings?connected=mercadopago`
    );
  } catch (error) {
    console.error("MercadoPago connection error:", error);
    return NextResponse.redirect(
      `${process.env.APP_URL}/dashboard?error=connection_failed`
    );
  }
}
