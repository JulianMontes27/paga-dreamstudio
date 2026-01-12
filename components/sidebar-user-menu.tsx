"use client";

import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

interface SidebarUserMenuProps {
  userId: string;
  onMenuClose?: () => void;
}

export function SidebarUserMenu({ userId, onMenuClose }: SidebarUserMenuProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group w-full text-left">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Usuario"}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-gray-200 dark:border-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || "Usuario"}
            </p>
            <p className="text-xs text-gray-500 dark:text-white/60 truncate">
              {user?.email || "usuario@email.com"}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border dark:border-zinc-800 bg-background/95 backdrop-blur-md shadow-lg"
        sideOffset={8}
      >
        <div className="px-3 py-3 border-b dark:border-zinc-800">
          <p className="text-sm font-medium text-foreground">
            {user?.name || "Usuario"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {user?.email || "usuario@email.com"}
          </p>
        </div>

        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
            <Link
              href={`/profile/`}
              onClick={onMenuClose}
              className="flex items-center px-3 py-2"
            >
              <User className="mr-2 h-4 w-4" strokeWidth={1.5} />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
            <Link
              href={`/profile/${userId}/organizaciones`}
              onClick={onMenuClose}
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
              href={`/profile/${userId}/entradas`}
              onClick={onMenuClose}
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
