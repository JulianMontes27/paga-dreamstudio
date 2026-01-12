import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  magicLinkClient,
  phoneNumberClient,
  adminClient,
  organizationClient,
  inferOrgAdditionalFields,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { ac, administrator, owner, waiter,  } from "@/lib/auth-permissions";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    magicLinkClient(),
    emailOTPClient(),
    phoneNumberClient(),
    organizationClient({
      ac,
      roles: {
        owner,
        administrator,
        waiter,
      },
      // Infer additional fields from the auth object type
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
    adminClient(),
  ],
});
