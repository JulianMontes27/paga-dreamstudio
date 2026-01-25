"use client";

import { useState, useEffect, useCallback, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateUserTipoPersona } from "@/actions/profile";
import { toast } from "sonner";

interface TipoPersonaManagerProps {
  tipoPersona: string | null;
  razonSocial: string | null;
  nit: string | null;
}

const TIPO_PERSONA_OPTIONS = [
  { value: "natural", label: "Persona Natural" },
  { value: "juridica", label: "Persona Jurídica" },
];

function SubmitButtons({
  hasChanges,
  onCancel,
}: {
  hasChanges: boolean;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex justify-end gap-2 mt-3">
      <Button
        type="button"
        onClick={onCancel}
        variant="ghost"
        size="sm"
        className="h-9 rounded-xl hover:bg-gray-200 dark:hover:bg-accent/50"
        disabled={pending}
        aria-label="Cancelar cambios"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={pending || !hasChanges}
        size="sm"
        className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Guardar cambios"
      >
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}

export function TipoPersonaManager({
  tipoPersona,
  razonSocial,
  nit,
}: TipoPersonaManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState(tipoPersona || "");
  const [razonSocialValue, setRazonSocialValue] = useState(razonSocial || "");
  const [nitValue, setNitValue] = useState(nit || "");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateUserTipoPersona, {});

  const hasChanges =
    (selectedTipo !== "" && selectedTipo !== tipoPersona) ||
    (selectedTipo === tipoPersona &&
      selectedTipo === "juridica" &&
      (razonSocialValue !== (razonSocial || "") || nitValue !== (nit || "")));

  useEffect(() => {
    if (state.success) {
      toast.success("Tipo de persona actualizado exitosamente");
      setIsEditing(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    setSelectedTipo(tipoPersona || "");
    setRazonSocialValue(razonSocial || "");
    setNitValue(nit || "");
    setIsEditing(false);
  }, [tipoPersona, razonSocial, nit]);

  const selectedOption = TIPO_PERSONA_OPTIONS.find(
    (opt) => opt.value === selectedTipo,
  );
  const currentOption = TIPO_PERSONA_OPTIONS.find(
    (opt) => opt.value === tipoPersona,
  );

  // const getDisplayText = () => {
  //   if (!tipoPersona) return "No configurado";
  //   if (tipoPersona === "juridica" && razonSocial) {
  //     return `${currentOption?.label} - ${razonSocial}`;
  //   }
  //   return currentOption?.label || "No configurado";
  // };

  if (!isEditing) {
    return (
      <div
        className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors group"
        role="region"
        aria-label="Información de tipo de persona"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">
                {currentOption?.label || "No configurado"}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tipo de persona (Opcional)
              </p>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
              aria-label="Editar tipo de persona"
            >
              {tipoPersona ? "Editar" : "Agregar"}
            </button>
          </div>
        </div>

        {tipoPersona === "juridica" && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] space-y-3">
            {/* Razon Social */}
            <div className="flex items-start gap-3">
              <div className="w-5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Razón Social</p>
                <p className="text-sm font-medium">
                  {razonSocial || "No configurado"}
                </p>
              </div>
            </div>

            {/* NIT */}
            <div className="flex items-start gap-3">
              <div className="w-5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">NIT</p>
                <p className="text-sm font-medium">{nit || "No configurado"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Tipo de persona</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Selecciona el tipo
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-[#4a4a4a] transition-colors"
              >
                <span className="text-sm">
                  {selectedOption?.label || "Seleccionar tipo"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-1 border-gray-200 dark:border-[#2a2a2a]"
              align="start"
            >
              <div className="flex flex-col">
                {TIPO_PERSONA_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedTipo(option.value);
                      setOpen(false);
                      // Clear juridica fields if switching to natural
                      if (option.value !== "juridica") {
                        setRazonSocialValue("");
                        setNitValue("");
                      }
                    }}
                    className="px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <input type="hidden" name="tipoPersona" value={selectedTipo} />
        </div>

        {selectedTipo === "juridica" && (
          <>
            <div className="space-y-2">
              <label
                htmlFor="razonSocial"
                className="text-xs text-muted-foreground"
              >
                Razón Social
              </label>
              <input
                id="razonSocial"
                name="razonSocial"
                type="text"
                value={razonSocialValue}
                onChange={(e) => setRazonSocialValue(e.target.value)}
                placeholder="Ingresa la razón social"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nit" className="text-xs text-muted-foreground">
                NIT
              </label>
              <input
                id="nit"
                name="nit"
                type="text"
                value={nitValue}
                onChange={(e) => setNitValue(e.target.value)}
                placeholder="Ingresa el NIT"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              />
            </div>
          </>
        )}
      </div>

      <SubmitButtons hasChanges={hasChanges} onCancel={handleCancel} />
    </form>
  );
}
