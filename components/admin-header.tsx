"use client";

import { ReactNode } from "react";
import { useAdminMenu } from "@/contexts/admin-menu-context";
import { Menu } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AdminHeader({
  title,
  subtitle,
  children,
}: AdminHeaderProps) {
  const { toggleMobileMenu } = useAdminMenu();

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 bg-gray-100 border border-gray-300 hover:bg-gray-200 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5 text-gray-900 dark:text-white" />
        </button>
      </div>

      {/* Additional content */}
      {children}
    </div>
  );
}
