"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export function DashboardFooter() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Navigation and Theme Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Navigation Links */}
            <nav className="flex flex-wrap gap-4 sm:gap-6">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/guides"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Guides
              </Link>
              <Link
                href="/help"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Help
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Theme Selector */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setTheme("system")}
                className={`p-2 rounded transition-colors ${
                  theme === "system"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="System theme"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded transition-colors ${
                  theme === "light"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Light theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded transition-colors ${
                  theme === "dark"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Dark theme"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row: System Status */}
          <div className="flex justify-center sm:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">
                All systems normal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
