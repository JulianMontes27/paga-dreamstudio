"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import Footer from "./footer";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide header and footer for auth routes
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/update-password") ||
    pathname?.startsWith("/confirm") ||
    pathname?.startsWith("/error") ||
    pathname?.startsWith("/verify-phone") ||
    pathname?.startsWith("/sign-up-success");

  // Hide header and footer for admin routes
  const isAdminRoute = pathname?.includes("/administrador");

  // Hide footer for profile routes
  const isProfileRoute = pathname?.startsWith("/profile");

  if (isAuthRoute || isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      {!isProfileRoute && <Footer />}
    </>
  );
}
