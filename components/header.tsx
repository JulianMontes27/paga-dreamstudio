import { UserButton } from "./user-button";
import { ModeSwitcher } from "./mode-switcher";
import { getOrganizations } from "@/server/organizations";
import OrganizationSwitcher from "./organization-switcher";
import { getCurrentUser } from "@/server/users";
import { redirect } from "next/navigation";
import { LogoLink } from "./logo-link";

export async function Header() {
  // Check for auth and get User Orgs.
  const { user } = await getCurrentUser();
  if (!user) return redirect("/login");
  const organizations = await getOrganizations();

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 w-full bg-background border-b">
      <div className="flex flex-row sm:gap-6 gap-2 justify-center items-center">
        <LogoLink />
        <OrganizationSwitcher organizations={organizations} user={user} />
      </div>

      {/* User Management items*/}
      <div className="flex items-center gap-2">
        <UserButton user={user} />
        <ModeSwitcher />
      </div>
    </header>
  );
}
