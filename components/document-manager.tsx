"use client";

import { useState, useCallback } from "react";
import { Fingerprint } from "lucide-react";
import { DOCUMENT_TYPES, VALIDATION } from "@/constants/profile";
import { sanitizeDocumentNumber } from "@/lib/utils/profile";

interface DocumentManagerProps {
  documentType?: string | null;
  documentNumber?: string | null;
}
export function DocumentManager({
  documentType,
  documentNumber,
}: DocumentManagerProps) {
  const [docType, setDocType] = useState(documentType || "");
  const [docNumber, setDocNumber] = useState(documentNumber || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleDocumentNumberChange = useCallback((value: string) => {
    const sanitized = sanitizeDocumentNumber(value);
    setDocNumber(sanitized);
  }, []);

  const handleSave = useCallback(async () => {
    // Skip save if both fields are empty
    if (!docType && !docNumber) return;

    setIsLoading(true);
    try {
      // TODO: Implement save functionality with Better Auth
      // await authClient.updateDocument({ documentType: docType, documentNumber: docNumber });

      // For now, just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 500));

      // toast.success(SUCCESS_MESSAGES.DOCUMENT_SAVED);
    } catch (error) {
      // toast.error(ERROR_MESSAGES.DOCUMENT_SAVE_FAILED);
      // Log error for debugging (will be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving document:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [docType, docNumber]);

  return (
    <div className="space-y-3">
      {/* Document Type */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Fingerprint
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0"
            aria-hidden="true"
          />
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            onBlur={handleSave}
            disabled={isLoading}
            aria-label="Tipo de documento"
            className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 w-full text-foreground appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.25em 1.25em",
            }}
          >
            <option value="" disabled>
              Tipo de documento (Opcional)
            </option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Number */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Fingerprint
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="numeric"
            value={docNumber}
            onChange={(e) => handleDocumentNumberChange(e.target.value)}
            onBlur={handleSave}
            disabled={isLoading}
            placeholder="Número de documento (Opcional)"
            maxLength={VALIDATION.MAX_DOCUMENT_LENGTH}
            autoComplete="off"
            aria-label="Número de documento"
            className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
