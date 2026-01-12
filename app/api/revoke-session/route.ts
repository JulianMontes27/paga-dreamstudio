import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the session ID from the request body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the current user
    const sessionToRevoke = await db
      .select()
      .from(schema.session)
      .where(
        and(
          eq(schema.session.id, sessionId),
          eq(schema.session.userId, session.user.id)
        )
      )
      .limit(1);

    if (sessionToRevoke.length === 0) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Don't allow revoking the current session via this endpoint
    if (sessionId === session.session.id) {
      return NextResponse.json(
        { error: "Cannot revoke current session. Use sign out instead." },
        { status: 400 }
      );
    }

    // Delete the session from the database
    await db.delete(schema.session).where(eq(schema.session.id, sessionId));

    return NextResponse.json(
      { success: true, message: "Session revoked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
