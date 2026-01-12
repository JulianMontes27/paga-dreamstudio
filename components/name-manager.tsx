"use client";

import { useState, useEffect, useCallback, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateUserName } from "@/actions/profile";
import { toast } from "sonner";

interface NameManagerProps {
  nombres: string | null;
  apellidos: string | null;
}

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
        className="h-9 rounded-xl"
        disabled={pending}
        aria-label="Cancelar cambios de nombre"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={pending || !hasChanges}
        size="sm"
        className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Guardar cambios de nombre"
      >
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}

export function NameManager({ nombres, apellidos }: NameManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(nombres || "");
  const [lastName, setLastName] = useState(apellidos || "");
  const [state, formAction] = useActionState(updateUserName, {});

  // Check if there are any changes
  const hasChanges =
    firstName !== (nombres || "") || lastName !== (apellidos || "");

  // Handle form state updates
  useEffect(() => {
    if (state.success) {
      toast.success("Nombre actualizado exitosamente");
      setIsEditing(false);
      // Reset state is handled by page reload from server
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    setFirstName(nombres || "");
    setLastName(apellidos || "");
    setIsEditing(false);
  }, [nombres, apellidos]);

  // Collapsed view
  if (!isEditing) {
    return (
      <div
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group"
        role="region"
        aria-label="Información de nombre"
      >
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">
              {nombres && apellidos
                ? `${nombres} ${apellidos}`
                : nombres || apellidos || "No configurado"}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Nombre completo
            </p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium hover:underline"
            aria-label="Editar nombre"
          >
            Editar nombre
          </button>
        </div>
      </div>
    );
  }

  // Expanded editing view
  return (
    <form
      action={formAction}
      className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Nombre completo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* First Name */}
        <div className="relative p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
          <input
            type="text"
            name="nombres"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Nombre/s"
            className="h-6 w-full bg-transparent border-none focus-visible:ring-0 text-sm font-medium p-0 placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none"
            aria-label="Nombres"
          />
        </div>

        {/* Last Name */}
        <div className="relative p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
          <input
            type="text"
            name="apellidos"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Apellidos"
            className="h-6 w-full bg-transparent border-none focus-visible:ring-0 text-sm font-medium p-0 placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none"
            aria-label="Apellidos"
          />
        </div>
      </div>

      <SubmitButtons hasChanges={hasChanges} onCancel={handleCancel} />
    </form>
  );
}
