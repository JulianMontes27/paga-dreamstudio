"use client";

import { ReactNode } from "react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AdminHeader({ title, subtitle, children }: AdminHeaderProps) {
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
      </div>

      {/* Additional content */}
      {children}
    </div>
  );
}
