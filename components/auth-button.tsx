"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  // Show loading state - render skeleton during SSR/loading to prevent hydration mismatch
  if (isPending || !mounted) {
    return (
      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 animate-pulse">
        <User
          className="h-5 w-5 text-zinc-400 dark:text-zinc-600"
          strokeWidth={2}
        />
      </div>
    );
  }

  // Use theme only after mounted
  const isDark = resolvedTheme === "dark";

  // If not logged in, show sign in button
  if (!session?.user) {
    return (
      <Link href="/sign-in">
        <div className="h-10 px-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 bg-foreground text-background hover:bg-foreground/90">
          <span className="text-sm font-medium">Ingresar</span>
        </div>
      </Link>
    );
  }

  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border-2",
            isDark
              ? "bg-zinc-900/50 backdrop-blur-sm border-zinc-700 hover:bg-zinc-900/70"
              : "bg-zinc-100 border-zinc-300 hover:bg-zinc-200"
          )}
          aria-label="User menu"
        >
          <User
            className={cn("h-5 w-5", isDark ? "text-white" : "text-zinc-900")}
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border dark:border-zinc-800 bg-background/95 backdrop-blur-md shadow-lg"
        sideOffset={8}
      >
        <div className="px-3 py-3 border-b dark:border-zinc-800">
          <p className="text-sm font-medium text-foreground">
            {user.name || "Usuario"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
        </div>

        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
            <Link href={`/profile/`} className="flex items-center px-3 py-2">
              <User className="mr-2 h-4 w-4" strokeWidth={1.5} />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
            <Link
              href={`/profile/${user.id}/organizaciones`}
              className="flex items-center px-3 py-2"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              <span>Mis Organizaciones</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
            <Link
              href={`/profile/${user.id}/entradas`}
              className="flex items-center px-3 py-2"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
                />
              </svg>
              <span>Mis Entradas</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <div className="p-1 border-t dark:border-zinc-800">
          <DropdownMenuItem
            onClick={handleSignOut}
            className="rounded-xl cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30"
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
