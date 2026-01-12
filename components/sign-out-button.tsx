"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "./toast";
import { ERROR_MESSAGES } from "@/constants/profile";

interface SignOutButtonProps {
  children: ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            toast.error({ title: ERROR_MESSAGES.SIGN_OUT_FAILED });
            if (process.env.NODE_ENV === "development") {
              console.error("Sign out error:", ctx.error);
            }
          },
        },
      });
    } catch (error) {
      toast.error({ title: ERROR_MESSAGES.SIGN_OUT_FAILED });
      if (process.env.NODE_ENV === "development") {
        console.error("Sign out error:", error);
      }
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  }, [router]);

  return (
    <>
      <div onClick={() => setShowConfirm(true)} role="button" tabIndex={0}>
        {children}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl border dark:border-[#2a2a2a]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={isLoading}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
