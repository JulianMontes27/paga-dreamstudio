import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Creates a Supabase server client with per-request caching.
 * Using React's cache() ensures only ONE client instance is created per request,
 * preventing connection pool exhaustion while maintaining request isolation.
 *
 * CRITICAL OPTIMIZATION: Without cache(), every createClient() call creates a new
 * database connection. With 50+ calls per page, this exhausts the pool at 3-4 concurrent users.
 * With cache(), all calls within a single request reuse the same client = 1 connection per request.
 */

// To access Supabase from Server Components, Server Actions, and Route Handlers, which run only on the server.
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
});
