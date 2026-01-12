import { UserButton } from "./user-button";
import { ModeSwitcher } from "./mode-switcher";
import OrganizationSwitcher from "./organization-switcher";
import { redirect } from "next/navigation";
import { LogoLink } from "./logo-link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function Header() {
  // Check for auth and get User Orgs.
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Fetch user's organizations using Better Auth API
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 w-full bg-background border-b">
      <div className="flex flex-row sm:gap-6 gap-2 justify-center items-center">
        <LogoLink />
        <OrganizationSwitcher
          organizations={organizations}
          user={session.user}
        />
      </div>

      {/* User Management items*/}
      <div className="flex items-center gap-2">
        <UserButton user={session.user} />
        <ModeSwitcher />
      </div>
    </header>
  );
}
