"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface AcceptInvitationActionsProps {
  invitationId: string;
  canAccept: boolean;
}

export function AcceptInvitationActions({
  invitationId,
  canAccept,
}: AcceptInvitationActionsProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    if (!canAccept) {
      toast.error("Debes verificar tu correo electrónico primero");
      return;
    }

    setIsAccepting(true);
    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        console.error("Error accepting invitation:", error);
        toast.error(error.message || "Error al aceptar la invitación");
        return;
      }

      if (data) {
        toast.success("¡Te has unido a la organización exitosamente!");
        // Redirect to the organization page
        router.push(`/profile`);
        router.refresh();
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Error al aceptar la invitación");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const { data, error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        console.error("Error rejecting invitation:", error);
        toast.error(error.message || "Error al rechazar la invitación");
        return;
      }

      if (data) {
        toast.success("Has rechazado la invitación");
        router.push("/profile");
        router.refresh();
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Error al rechazar la invitación");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={handleAccept}
        disabled={!canAccept || isAccepting || isRejecting}
        className="flex-1"
      >
        {isAccepting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Aceptando...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Aceptar Invitación
          </>
        )}
      </Button>
      <Button
        onClick={handleReject}
        disabled={isAccepting || isRejecting}
        variant="outline"
        className="flex-1"
      >
        {isRejecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Rechazando...
          </>
        ) : (
          <>
            <X className="mr-2 h-4 w-4" />
            Rechazar
          </>
        )}
      </Button>
    </div>
  );
}
