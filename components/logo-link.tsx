"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LogoLink() {
  const router = useRouter();

  const handleLogoClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Set active organization to null
    await authClient.organization.setActive({
      organizationId: null,
    });

    // Navigate to dashboard
    router.push("/dashboard");
  };

  return (
    <Link href="/dashboard" onClick={handleLogoClick}>
      <span className="font-semibold sm:text-xl">TIP</span>
    </Link>
  );
}
