"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 backdrop-blur-md bg-black/40 border-b border-white/5 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-white text-xl font-semibold">Paga</span>
          </div>
          {/* Desktop header */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="#product"
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Product
              </Link>
              <Link
                href="#solution"
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Solution
              </Link>
              <Link
                href="#pricing"
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/profile"
                className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Dashboard
              </Link>
            </div>
          </div>
          {/* Mobile header */}
          <div className="md:hidden block">
            <Sheet modal={false} open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="w-full bg-black/40 backdrop-blur-md border-b border-white/5 mt-16"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col items-center space-y-6 py-8">
                  <Link
                    href="#product"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-lg font-medium"
                  >
                    Product
                  </Link>
                  <Link
                    href="#solution"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-lg font-medium"
                  >
                    Solution
                  </Link>
                  <Link
                    href="#pricing"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-lg font-medium"
                  >
                    Pricing
                  </Link>
                  <div className="border-t border-white/10 pt-6 w-full max-w-xs space-y-4">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg text-center font-medium transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
