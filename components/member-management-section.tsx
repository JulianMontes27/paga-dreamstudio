"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Shield,
  Crown,
  MoreVertical,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { removeMemberAction, updateMemberRoleAction } from "@/server/members";

// Dynamic import: Load invite dialog/form only when user clicks invite button
const InviteMemberDialog = dynamic(
  () => import("./invite-member-dialog").then((mod) => mod.InviteMemberDialog),
  {
    loading: () => (
      <Button size="sm" disabled>
        <UserPlus className="mr-2 h-4 w-4" />
        Invitar Miembro
      </Button>
    ),
    ssr: false, // Dialog requires client-side rendering
  }
);

interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user: {
    id?: string;
    name: string;
    email: string;
    image?: string;
    emailVerified?: boolean;
  };
}

interface MemberManagementSectionProps {
  members: Member[];
  currentUserId?: string;
  currentUserRole?: string;
  organizationId: string;
  organizationSlug?: string; // Required for invite dialog title
}

export function MemberManagementSection({
  members,
  currentUserId,
  currentUserRole,
  organizationId,
  organizationSlug,
}: MemberManagementSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const canManageMembers =
    currentUserRole === "admin" || currentUserRole === "owner";
  const isOwner = currentUserRole === "owner";

  const handleRemoveMember = async (
    memberId: string,
    memberName: string,
    memberEmail: string
  ) => {
    if (!canManageMembers) {
      toast.error("No tienes permiso para eliminar miembros");
      return;
    }

    setRemovingMemberId(memberId);

    startTransition(async () => {
      try {
        const result = await removeMemberAction(organizationId, memberEmail);

        if (result.success) {
          toast.success(`${memberName} ha sido eliminado de la organización`);
          window.location.reload();
        } else {
          toast.error(result.error || "Error al eliminar miembro");
        }
      } catch (error) {
        console.error("Failed to remove member:", error);
        toast.error("Error al eliminar miembro. Por favor, intenta de nuevo.");
      } finally {
        setRemovingMemberId(null);
      }
    });
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: string,
    memberName: string
  ) => {
    if (!canManageMembers) {
      toast.error("No tienes permiso para actualizar roles de miembros");
      return;
    }

    // Prevent admins from creating owners
    if (!isOwner && newRole === "owner") {
      toast.error("Solo los propietarios pueden promover miembros a propietario");
      return;
    }

    setUpdatingMemberId(memberId);

    const roleNames: Record<string, string> = {
      member: 'mesero',
      admin: 'administrador',
      owner: 'propietario'
    };

    startTransition(async () => {
      try {
        const result = await updateMemberRoleAction(
          organizationId,
          memberId,
          newRole as "member" | "admin" | "owner"
        );

        if (result.success) {
          toast.success(`El rol de ${memberName} ha sido actualizado a ${roleNames[newRole] || newRole}`);
          window.location.reload();
        } else {
          toast.error(result.error || "Error al actualizar el rol del miembro");
        }
      } catch (error) {
        console.error("Failed to update member role:", error);
        toast.error("Error al actualizar el rol. Por favor, intenta de nuevo.");
      } finally {
        setUpdatingMemberId(null);
      }
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return <Crown className="h-3.5 w-3.5 mr-1.5" />;
      case "admin":
        return <Shield className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return <User className="h-3.5 w-3.5 mr-1.5" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay miembros en la organización</p>
      </div>
    );
  }

  // Sort members by role (owner first, then admin, then member)
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return (
      (roleOrder[a.role as keyof typeof roleOrder] || 3) -
      (roleOrder[b.role as keyof typeof roleOrder] || 3)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <h3 className="text-base font-medium">Miembros de la Organización</h3>
          <Badge variant="secondary" className="text-xs">
            {members.length}
          </Badge>
        </div>

        {/* Invite Member - dynamically loaded to reduce initial bundle size */}
        {canManageMembers && (
          <InviteMemberDialog
            organizationId={organizationId}
            organizationSlug={organizationSlug}
          />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Se unió</TableHead>
              {canManageMembers && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMembers.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const memberIsOwner = member.role === "owner";
              const canModifyMember =
                canManageMembers &&
                !isCurrentUser &&
                (!memberIsOwner || isOwner);

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.user.image}
                          alt={member.user.name}
                        />
                        <AvatarFallback>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {member.user.name}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canModifyMember && !memberIsOwner ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.id, value, member.user.name)
                        }
                        disabled={isPending || updatingMemberId === member.id}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">
                            <div className="flex items-center">
                              <User className="h-3.5 w-3.5 mr-1.5" />
                              Mesero
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center">
                              <Shield className="h-3.5 w-3.5 mr-1.5" />
                              Administrador
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={getRoleBadgeVariant(member.role)}
                        className="text-xs inline-flex items-center"
                      >
                        {getRoleIcon(member.role)}
                        {member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Administrador' : 'Mesero'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(member.createdAt)}
                    </span>
                  </TableCell>
                  {canManageMembers && (
                    <TableCell className="text-right">
                      {canModifyMember ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive"
                                  disabled={removingMemberId === member.id}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Eliminar Miembro
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Eliminar Miembro
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres eliminar a{" "}
                                    <strong>{member.user.name}</strong> de la
                                    organización? Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRemoveMember(
                                        member.id,
                                        member.user.name,
                                        member.user.email
                                      )
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar Miembro
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
