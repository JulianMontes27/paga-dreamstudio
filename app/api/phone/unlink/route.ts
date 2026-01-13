import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { schema } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function POST() {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Directly update the database to remove phone number
    // This bypasses Better Auth's phoneNumber plugin restrictions
    await db
      .update(schema.user)
      .set({
        phoneNumber: null,
        phoneNumberVerified: false,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(schema.user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking phone number:", error);
    return NextResponse.json(
      { error: "Error al desvincular el número de teléfono" },
      { status: 500 }
    );
  }
}
