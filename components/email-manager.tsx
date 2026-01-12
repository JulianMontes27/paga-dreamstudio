"use client";

import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailManagerProps {
  email: string;
  emailVerified?: boolean;
}

export function EmailManager({
  email,
  emailVerified = true,
}: EmailManagerProps) {
  return (
    <div
      className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors group"
      role="region"
      aria-label="Correo electrónico principal"
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Mail
          className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-medium truncate"
              aria-label={`Correo electrónico: ${email}`}
              title={email}
            >
              {email}
            </span>
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20 flex-shrink-0"
              aria-label="Correo principal"
            >
              Principal
            </Badge>
            {emailVerified && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-green-600/10 text-green-400 border-green-600/20 flex-shrink-0"
                aria-label="Correo verificado"
              >
                Verificado
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
