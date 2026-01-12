"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cancelInvitation, deleteInvitation } from "@/server/organizations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Invitation {
  id: string;
  email: string;
  role: "member" | "admin" | "owner";
  status: string;
  organizationId: string;
  inviterId: string;
  expiresAt: Date;
  inviter?: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface InvitationManagementSectionProps {
  invitations: Invitation[];
  currentUserRole?: string;
}

export function InvitationManagementSection({
  invitations,
  currentUserRole,
}: InvitationManagementSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManageInvitations =
    currentUserRole === "admin" || currentUserRole === "owner";

  const handleCancelInvitation = async (
    invitationId: string,
    email: string
  ) => {
    if (!canManageInvitations) {
      toast.error("No tienes permiso para cancelar invitaciones");
      return;
    }

    setCancelingId(invitationId);

    startTransition(async () => {
      try {
        await cancelInvitation(invitationId);
        toast.success(`La invitación a ${email} ha sido cancelada`);
        // Refresh the page to update the invitations list
        window.location.reload();
      } catch (error) {
        console.error("Failed to cancel invitation:", error);
        toast.error("Error al cancelar la invitación. Por favor, intenta de nuevo.");
      } finally {
        setCancelingId(null);
      }
    });
  };

  const handleDeleteInvitation = async (
    invitationId: string,
    email: string
  ) => {
    if (!canManageInvitations) {
      toast.error("No tienes permiso para eliminar invitaciones");
      return;
    }

    setDeletingId(invitationId);

    startTransition(async () => {
      try {
        await deleteInvitation(invitationId);
        toast.success(`La invitación a ${email} ha sido eliminada`);
        // Refresh the page to update the invitations list
        window.location.reload();
      } catch (error) {
        console.error("Failed to delete invitation:", error);
        toast.error("Error al eliminar la invitación. Por favor, intenta de nuevo.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: string | Date) => {
    const expiryDate =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    return expiryDate < new Date();
  };

  if (!canManageInvitations) {
    return null;
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay invitaciones pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        <h3 className="text-base font-medium">Invitaciones</h3>
        <Badge variant="secondary" className="text-xs">{invitations.length}</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Invitado por</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <p className="text-sm font-medium">{invitation.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">
                    {invitation.role === 'member' ? 'Mesero' : invitation.role === 'admin' ? 'Administrador' : 'Propietario'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium text-xs">
                      {invitation.inviter?.user.name || "—"}
                    </p>
                    {invitation.inviter?.user.email && (
                      <p className="text-muted-foreground text-xs">
                        {invitation.inviter.user.email}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(invitation.expiresAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {invitation.status === "pending" &&
                      !isExpired(invitation.expiresAt) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                isPending || cancelingId === invitation.id
                              }
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Cancelar Invitación
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres cancelar la invitación
                                enviada a <strong>{invitation.email}</strong>?
                                Esto evitará que puedan aceptar la invitación.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Mantener Invitación
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleCancelInvitation(
                                    invitation.id,
                                    invitation.email
                                  )
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancelar Invitación
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending || deletingId === invitation.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Invitación</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar permanentemente la
                            invitación enviada a{" "}
                            <strong>{invitation.email}</strong>? Esta acción
                            no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Mantener Invitación</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteInvitation(
                                invitation.id,
                                invitation.email
                              )
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar Permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
