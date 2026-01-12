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
import { CreateOrganizationForm } from "./create-organization-form";
import { Plus } from "lucide-react";

interface CreateOrganizationDialogProps {
  variant?: "default" | "icon-only";
}

export function CreateOrganizationDialog({ variant = "default" }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    // Close dialog after successful creation
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon-only" ? (
          <Button size="icon" className="h-8 w-8 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Crear Organización</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[75vh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-3">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Crear Nueva Organización
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Crea una organización para gestionar equipos y proyectos
          </DialogDescription>
        </DialogHeader>
        <CreateOrganizationForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
