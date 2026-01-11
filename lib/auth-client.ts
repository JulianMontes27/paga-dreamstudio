import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, owner, admin, member } from "@/lib/auth/permissions";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    emailOTPClient(),
    organizationClient({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
    adminClient(),
  ],
});
