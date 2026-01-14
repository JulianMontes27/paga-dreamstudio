"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ui/theme-toggle";
import { Menu, X } from "lucide-react";
import { AuthButton } from "./auth-button";

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if we're in admin route
  const isAdminRoute = pathname?.includes("/administrador");
  // Check if we're in profile route
  const isProfileRoute = pathname?.startsWith("/profile");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when pathname changes (user navigates)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Blur overlay - appears behind everything when menu is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Header bar */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled && !isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Paga Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span
                className="text-2xl font-bold tracking-tight transition-all duration-300 ease-out hover:tracking-wide"
                style={{ fontFamily: "LOT, sans-serif" }}
              >
                Paga
              </span>
            </Link>

            {/* Desktop Navigation - Hide in profile route */}
            {!isProfileRoute && (
              <nav className="hidden md:flex items-center gap-1">
                {/* TODO: Add navigation links when routes are implemented */}
              </nav>
            )}
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {!isProfileRoute && <AuthButton />}
          </div>

          {/* Right side - Mobile */}
          <div className="flex md:hidden items-center gap-2">
            {!isAdminRoute && (
              <>
                <ThemeToggle />

                {!isProfileRoute && (
                  <button
                    className="flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-5 w-5 text-zinc-900 dark:text-white" />
                    ) : (
                      <Menu className="h-5 w-5 text-zinc-900 dark:text-white" />
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu - Now a sibling of header, not a child */}
      {!isProfileRoute && (
        <div
          className={`fixed top-16 left-0 right-0 z-50 md:hidden transition-all duration-300 ${
            isMobileMenuOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          {/* Menu Content - no blur here, blur is on the overlay behind */}
          <nav className="flex flex-col items-center gap-4 px-6 py-6 max-w-sm mx-auto">
            {/* TODO: Add navigation links when routes are implemented */}

            <div className="mt-4 w-full flex justify-center border-t border-foreground/10 pt-6">
              <AuthButton />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
