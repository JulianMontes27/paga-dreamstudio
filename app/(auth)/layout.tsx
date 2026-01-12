"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] relative">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm text-gray-400 hover:text-foreground transition-colors group"
        >
          <div className="p-2 rounded-full border dark:border-[#303030] bg-background/80 backdrop-blur-sm group-hover:bg-background transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">Volver</span>
        </Link>

        {/* Left column: dynamic content */}
        <section className="flex-1 flex items-center justify-center p-8 pt-20 md:pt-8">
          {children}
        </section>

        {/* Right column: persistent animated background */}
        <section className="hidden md:block flex-1 relative p-4 overflow-hidden">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl overflow-hidden"></div>
        </section>
      </div>
    </main>
  );
}
