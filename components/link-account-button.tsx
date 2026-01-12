"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "./toast";
import { ERROR_MESSAGES } from "@/constants/profile";

type LinkAccountButtonProps = {
  providerId: string;
  providerName?: string;
};

export function LinkAccountButton({ providerId }: LinkAccountButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use Better Auth's linkSocial method
      await authClient.linkSocial({
        provider: providerId,
        callbackURL: "/profile",
        errorCallbackURL: "/profile?error=link-failed",
      });

      // The above will redirect to the OAuth provider
      // After successful linking, user will be redirected back to /profile
    } catch {
      setIsLoading(false);
      toast.error({ title: ERROR_MESSAGES.LINK_ACCOUNT_FAILED });
    }
  }, [providerId]);

  return (
    <Button
      onClick={handleLinkAccount}
      disabled={isLoading}
      aria-label={`Conectar cuenta de ${providerId}`}
      className="bg-white/90 text-black hover:bg-gray-200/90 active:bg-gray-300/90 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 rounded-full px-3 sm:px-6 py-1.5 sm:py-2 h-auto text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2
            className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Conectando...</span>
          <span className="sm:hidden">...</span>
        </>
      ) : (
        "Conectar"
      )}
    </Button>
  );
}
