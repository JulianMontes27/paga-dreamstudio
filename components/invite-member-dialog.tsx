"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteMemberForm } from "./forms/invite-member-form";
import { Plus, Mail } from "lucide-react";

interface InviteMemberDialogProps {
  organizationId: string;
  size?: "default" | "sm" | "lg" | "icon";
  iconOnly?: boolean;
}

export function InviteMemberDialog({
  organizationId,
  size = "sm",
  iconOnly = false,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    // Close dialog after successful invitation
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={iconOnly ? "icon" : size}
          className="rounded-full flex-shrink-0"
          aria-label={iconOnly ? "Invitar miembro" : undefined}
        >
          {iconOnly ? (
            <Plus className="h-4 w-4" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Invitar
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl max-h-[85vh] overflow-y-auto bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold">
            Invitar Miembro
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-white/60">
            Envía una invitación por correo electrónico para unirse a la
            organización
          </DialogDescription>
        </DialogHeader>
        <InviteMemberForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
