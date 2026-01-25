"use client";

import { useState, useEffect, useCallback, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateUserGender } from "@/actions/profile";
import { toast } from "sonner";

interface GenderManagerProps {
  gender: string | null;
}

const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
  { value: "prefiero_no_decir", label: "Prefiero no decir" },
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
        aria-label="Cancelar cambios de género"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={pending || !hasChanges}
        size="sm"
        className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Guardar cambios de género"
      >
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}

export function GenderManager({ gender }: GenderManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGender, setSelectedGender] = useState(gender || "");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateUserGender, {});

  const hasChanges = selectedGender !== (gender || "");

  useEffect(() => {
    if (state.success) {
      toast.success("Género actualizado exitosamente");
      setIsEditing(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    setSelectedGender(gender || "");
    setIsEditing(false);
  }, [gender]);

  const selectedOption = GENDER_OPTIONS.find(
    (opt) => opt.value === selectedGender,
  );
  const currentOption = GENDER_OPTIONS.find((opt) => opt.value === gender);

  if (!isEditing) {
    return (
      <div
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group"
        role="region"
        aria-label="Información de género"
      >
        <div className="flex items-center gap-3">
          <UserCircle className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">
              {currentOption?.label || "No configurado"}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Género (Opcional)
            </p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
            aria-label="Editar género"
          >
            {gender ? "Editar" : "Agregar género"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <UserCircle className="h-5 w-5 text-gray-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Género</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Selecciona tu género
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] hover:border-gray-300 dark:hover:border-[#4a4a4a] transition-colors"
            >
              <span className="text-sm">
                {selectedOption?.label || "Seleccionar género"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-1 border-gray-200 dark:border-[#2a2a2a]"
            align="start"
          >
            <div className="flex flex-col">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedGender(option.value);
                    setOpen(false);
                  }}
                  className="px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <input type="hidden" name="gender" value={selectedGender} />
      </div>

      <SubmitButtons hasChanges={hasChanges} onCancel={handleCancel} />
    </form>
  );
}
