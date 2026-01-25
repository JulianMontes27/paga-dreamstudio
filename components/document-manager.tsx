"use client";

import { useState, useCallback } from "react";
import { Fingerprint, ChevronDown, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { VALIDATION } from "@/constants/profile";
import { toast } from "./toast";
import { sanitizeDocumentNumber } from "@/lib/utils/profile";
import { useRouter } from "next/navigation";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/profile";

interface DocumentManagerProps {
  documentType: string | null;
  documentNumber: string | null;
  documentTypes: Array<{ id: string; name: string }>;
}

export function DocumentManager({
  documentType,
  documentNumber,
  documentTypes,
}: DocumentManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [docType, setDocType] = useState(documentType || "");
  const [docNumber, setDocNumber] = useState(documentNumber || "");
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const handleDocumentNumberChange = useCallback((value: string) => {
    const sanitized = sanitizeDocumentNumber(value);
    setDocNumber(sanitized);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/document/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentTypeId: docType || null,
          documentId: docNumber || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to update document");
      }

      toast.success({ title: SUCCESS_MESSAGES.DOCUMENT_SAVED });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating document:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.DOCUMENT_SAVE_FAILED;
      toast.error({ title: errorMessage });
    } finally {
      setIsSaving(false);
    }
  }, [docType, docNumber, router]);

  const handleCancel = useCallback(() => {
    setDocType(documentType || "");
    setDocNumber(documentNumber || "");
    setIsEditing(false);
  }, [documentType, documentNumber]);

  const selectedDocType = documentTypes.find((t) => t.id === docType);
  const currentDocType = documentTypes.find((t) => t.id === documentType);
  const hasChanges =
    docType !== (documentType || "") || docNumber !== (documentNumber || "");

  // Collapsed view - Display mode
  if (!isEditing) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">
              {documentNumber && currentDocType
                ? `${currentDocType.name} - ${documentNumber}`
                : "Documento de identidad"}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {documentNumber && currentDocType
                ? "Documento configurado"
                : "No configurado (Opcional)"}
            </p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
            aria-label={
              documentNumber ? "Editar documento" : "Agregar documento"
            }
          >
            {documentNumber ? "Editar" : "Agregar documento"}
          </button>
        </div>
      </div>
    );
  }

  // Expanded view - Editing mode
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <Fingerprint className="h-5 w-5 text-gray-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Documento de identidad</p>
        </div>
      </div>

      {/* Document Type Selector */}
      <div className="space-y-2 mb-3">
        <label className="text-xs text-muted-foreground">
          Tipo de documento
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isSaving}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-[#4a4a4a] transition-colors disabled:opacity-50"
            >
              <span className="text-sm">
                {selectedDocType?.name || "Seleccionar tipo"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-1 border-gray-200 dark:border-[#2a2a2a]"
            align="start"
          >
            <div className="flex flex-col max-h-[240px] overflow-y-auto">
              {documentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setDocType(type.id);
                    setOpen(false);
                  }}
                  disabled={isSaving}
                  className="px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded disabled:opacity-50"
                >
                  {type.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Document Number Input */}
      <div className="space-y-2 mb-3">
        <label htmlFor="documentId" className="text-xs text-muted-foreground">
          Número de documento
        </label>
        <input
          id="documentId"
          name="documentId"
          type="text"
          inputMode="numeric"
          value={docNumber}
          onChange={(e) => handleDocumentNumberChange(e.target.value)}
          disabled={isSaving}
          placeholder="Ingresa tu número de documento"
          maxLength={VALIDATION.MAX_DOCUMENT_LENGTH}
          autoComplete="off"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={handleCancel}
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl hover:bg-gray-200 dark:hover:bg-accent/50"
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="sm"
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </div>
  );
}
