"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "./toast";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type UnlinkAccountButtonProps = {
  accountId?: string;
  providerId: string;
  providerName: string;
};

export function UnlinkAccountButton({
  // accountId,
  providerId,
  providerName,
}: UnlinkAccountButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUnlink = useCallback(async () => {
    setIsLoading(true);

    try {
      await authClient.unlinkAccount({
        providerId: providerId,
      });

      toast.success({ title: SUCCESS_MESSAGES.ACCOUNT_UNLINKED });
      router.refresh();
    } catch (error) {
      toast.error({ title: ERROR_MESSAGES.UNLINK_ACCOUNT_FAILED });
      if (process.env.NODE_ENV === "development") {
        console.error("Error unlinking account:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [providerId, router]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={isLoading}
          aria-label={`Desvincular cuenta de ${providerName}`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border dark:border-[#2a2a2a]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Desvincular cuenta de {providerName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Ya no podrás iniciar sesión con
            esta cuenta de {providerName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnlink}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Desvinculando...
              </>
            ) : (
              "Desvincular"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
