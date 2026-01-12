import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Número de teléfono requerido" },
        { status: 400 }
      );
    }

    // Check if phone number is already verified by another user
    const existingUser = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.phoneNumber, phoneNumber),
          eq(schema.user.phoneNumberVerified, true)
        )
      )
      .limit(1);

    // If phone is verified by another user (not current user), block it
    if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
      return NextResponse.json(
        {
          available: false,
          error: "Este número ya está verificado por otra cuenta",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Error checking phone availability:", error);
    return NextResponse.json(
      { error: "Error al verificar disponibilidad del número" },
      { status: 500 }
    );
  }
}
