"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Settings,
  Mail,
  Shield,
  CreditCard,
  MailCheck,
  Search,
  X,
  MoreVertical,
  Trash2,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { EditOrganizationForm } from "./edit-organization-form";
import type { Invitation, User, Organization, Member } from "@/db";

// Member data as returned by Better Auth API (role is string, not enum)
interface MemberWithUser {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user?: Pick<User, "id" | "name" | "email" | "phoneNumber">;
}

interface AdminConfigTabsProps {
  organization: (Partial<Organization> & {
    id: string;
    name: string;
    slug: string;
    members?: Member[];
    invitations?: Invitation[];
  }) | null;
  team: MemberWithUser[];
  invitations: Invitation[];
  currentUserRole: string;
  currentUserId: string;
  mpOauthUrl?: string;
}

type TabType = "general" | "equipo" | "procesadores";

export function AdminConfigTabs({
  organization,
  team,
  invitations,
  currentUserRole,
  currentUserId,
  mpOauthUrl,
}: AdminConfigTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelingInvitation, setCancelingInvitation] = useState<string | null>(
    null
  );
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const displayTeam = team.length > 0 ? team : [];

  // Format role for display
  const formatRole = (role: string) => {
    const roleMap: { [key: string]: string } = {
      owner: "Propietario",
      administrator: "Administrador",
      seller: "Vendedor",
    };
    return roleMap[role] || role;
  };

  // Add handler to remove a member
  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!organization) return;

    setRemovingMember(memberId);
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberEmail,
        organizationId: organization.id,
      });

      if (error) {
        console.error("Error removing member:", error);
        toast.error(error.message || "Error al eliminar miembro");
        return;
      }

      toast.success("Miembro eliminado exitosamente");
      router.refresh();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Error al eliminar miembro");
    } finally {
      setRemovingMember(null);
    }
  };

  // Add handler to update member role
  const handleUpdateRole = async (
    memberId: string,
    newRole: string,
    memberName: string
  ) => {
    if (!organization) return;

    setUpdatingRole(memberId);
    try {
      const { error } = await authClient.organization.updateMemberRole({
        role: newRole,
        memberId: memberId,
        organizationId: organization.id,
      });

      if (error) {
        console.error("Error updating role:", error);
        toast.error(error.message || "Error al actualizar rol");
        return;
      }

      toast.success(
        `Rol de ${memberName} actualizado a ${formatRole(newRole)}`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    } finally {
      setUpdatingRole(null);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    if (!organization) return;

    setCancelingInvitation(invitationId);
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        console.error("Error canceling invitation:", error);
        toast.error(error.message || "Error al cancelar la invitación");
        return;
      }

      toast.success("Invitación cancelada exitosamente");
      router.refresh();
    } catch (error) {
      console.error("Error canceling invitation:", error);
      toast.error("Error al cancelar la invitación");
    } finally {
      setCancelingInvitation(null);
    }
  };

  // Combine team members with pending invitations
  const combinedTeamData = [
    ...displayTeam.map((member) => ({ ...member, isPending: false })),
    ...invitations
      .filter((inv) => inv.status === "pending")
      .map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        isPending: true,
        user: null,
      })),
  ];

  // Filter combined data based on search query
  const filteredTeamData = combinedTeamData.filter((member) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const name = member.isPending
      ? "invitación pendiente"
      : (member.user?.name || "").toLowerCase();
    const email = member.isPending
      ? "email" in member
        ? member.email.toLowerCase()
        : ""
      : (member.user?.email || "").toLowerCase();
    const role = formatRole(member.role || "").toLowerCase();

    return (
      name.includes(query) || email.includes(query) || role.includes(query)
    );
  });

  // Check permissions
  const canInvite =
    currentUserRole === "owner" || currentUserRole === "administrator";
  const canManageMembers = currentUserRole === "owner";

  const tabs = [
    { value: "general", icon: Settings, label: "General" },
    { value: "equipo", icon: Users, label: "Equipo" },
    { value: "procesadores", icon: CreditCard, label: "Procesadores" },
  ] as const;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gray-100 dark:bg-white/10 text-foreground border border-gray-200 dark:border-white/20"
                      : "text-gray-600 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search and Add Member Button - Only show in Equipo tab */}
          {activeTab === "equipo" && (
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar miembros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[280px] pl-9 pr-3 py-2 text-sm rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:outline-none focus:border-gray-300 dark:focus:border-white/20 transition-all"
                />
              </div>

              {/* Add Member Button - Icon only on mobile, full button on desktop */}
              {organization && canInvite && (
                <div className="flex-shrink-0">
                  {/* Mobile: Icon only */}
                  <div className="sm:hidden">
                    <InviteMemberDialog
                      organizationId={organization.id}
                      iconOnly
                    />
                  </div>
                  {/* Desktop: Full button */}
                  <div className="hidden sm:block">
                    <InviteMemberDialog organizationId={organization.id} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "equipo" && (
            <div className="space-y-4">
              {/* Team Mobile Cards - Hidden, using table for all screens */}
              <div className="hidden space-y-3">
                {filteredTeamData.map((member) => {
                  const isPending = member.isPending;
                  const isCurrentUser =
                    !isPending && member.user?.id === currentUserId;
                  const fullName = isPending
                    ? "Invitación Pendiente"
                    : member.user?.name || "Usuario sin nombre";
                  const email = isPending
                    ? "email" in member
                      ? member.email
                      : "Sin correo"
                    : member.user?.email || "Sin correo";
                  const role = member.role || "member";

                  const initials = isPending
                    ? "?"
                    : fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                  return (
                    <Card
                      key={member.id}
                      className={`min-w-0 overflow-hidden ${
                        isCurrentUser
                          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800"
                          : "bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
                      }`}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div
                              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-xs sm:text-sm ring-1 ${
                                isPending
                                  ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-orange-300 dark:ring-orange-700"
                                  : "bg-gray-200 dark:bg-white/[0.08] text-gray-700 dark:text-white/90 ring-gray-300 dark:ring-white/10"
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-medium text-sm sm:text-base truncate ${isPending ? "text-gray-600 dark:text-white/60 italic" : "text-gray-900 dark:text-white"}`}
                              >
                                {fullName}
                              </p>
                              {email !== "Sin correo" && (
                                <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                                  <Mail className="h-3 w-3 text-gray-400 dark:text-white/40 flex-shrink-0" />
                                  <span className="text-xs text-gray-600 dark:text-white/60 truncate">
                                    {email}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:gap-2 flex-shrink-0">
                            {isCurrentUser && (
                              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-xs whitespace-nowrap font-semibold">
                                Tú
                              </Badge>
                            )}
                            {isPending ? (
                              <>
                                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-xs whitespace-nowrap">
                                  <MailCheck className="h-3 w-3 mr-1" />
                                  Pendiente
                                </Badge>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelInvitation(member.id);
                                  }}
                                  disabled={cancelingInvitation === member.id}
                                  className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap"
                                >
                                  <X className="h-3 w-3" />
                                  <span className="hidden xs:inline">
                                    Cancelar
                                  </span>
                                </button>
                              </>
                            ) : role === "owner" ? (
                              <Badge
                                variant="default"
                                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-2 border-gray-900 dark:border-gray-100 text-xs font-semibold"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                {formatRole(role)}
                              </Badge>
                            ) : role === "administrator" ? (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-xs"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                {formatRole(role)}
                              </Badge>
                            ) : role === "seller" ? (
                              <Badge
                                variant="outline"
                                className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs"
                              >
                                {formatRole(role)}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 bg-gray-50 dark:bg-white/[0.02] text-xs"
                              >
                                {formatRole(role)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Team Table - All Screens */}
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <Table className="w-full min-w-max">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-white/5">
                        <TableHead className="font-medium text-gray-600 dark:text-white/50 py-3 pl-4 sm:pl-6 text-xs uppercase tracking-wider min-w-[180px] whitespace-nowrap">
                          Miembro
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 dark:text-white/50 text-xs uppercase tracking-wider min-w-[180px] whitespace-nowrap">
                          Contacto
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 dark:text-white/50 text-xs uppercase tracking-wider min-w-[130px] whitespace-nowrap">
                          Fecha de ingreso
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 dark:text-white/50 text-xs uppercase tracking-wider min-w-[150px] whitespace-nowrap">
                          Rol
                        </TableHead>
                        {canManageMembers && (
                          <TableHead className="font-medium text-gray-600 dark:text-white/50 text-xs uppercase tracking-wider pr-4 sm:pr-6 text-right min-w-[90px] whitespace-nowrap">
                            Acciones
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeamData.map((member) => {
                        const isPending = member.isPending;
                        const isCurrentUser =
                          !isPending && member.user?.id === currentUserId;
                        const fullName = isPending
                          ? "Invitación Pendiente"
                          : member.user?.name || "Usuario sin nombre";
                        const email = isPending
                          ? "email" in member
                            ? member.email
                            : "Sin correo"
                          : member.user?.email || "Sin correo";
                        // const phoneNumber = isPending
                        //   ? null
                        //   : member.user?.phoneNumber || null;
                        const role = member.role || "member";

                        const initials = isPending
                          ? "?"
                          : fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2);

                        return (
                          <TableRow
                            key={member.id}
                            className={`border-b border-gray-200 dark:border-white/5 transition-all duration-200 ${
                              isCurrentUser
                                ? "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30"
                                : "hover:bg-gray-100 dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <TableCell className="py-4 sm:py-5 pl-4 sm:pl-6 min-w-[180px]">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                  className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-xs sm:text-sm ring-1 ${
                                    isPending
                                      ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-orange-300 dark:ring-orange-700"
                                      : "bg-gray-200 dark:bg-white/[0.08] text-gray-700 dark:text-white/90 ring-gray-300 dark:ring-white/10"
                                  }`}
                                >
                                  {initials}
                                </div>
                                <div className="flex flex-col min-w-0 gap-0.5">
                                  <span
                                    className={`font-medium text-sm whitespace-nowrap ${isPending ? "text-gray-600 dark:text-white/60 italic" : "text-gray-900 dark:text-white"}`}
                                  >
                                    {fullName}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 sm:py-5 min-w-[180px]">
                              {email !== "Sin correo" ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 dark:text-white/40 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-white/70 whitespace-nowrap">
                                    {email}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-400 dark:text-white/30">
                                  Sin correo
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="py-4 sm:py-5 min-w-[130px]">
                              {!isPending &&
                              "createdAt" in member &&
                              member.createdAt ? (
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-white/70 whitespace-nowrap">
                                  {new Date(
                                    member.createdAt
                                  ).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-400 dark:text-white/30">
                                  -
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="py-4 sm:py-5 min-w-[150px]">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                {isCurrentUser && (
                                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-semibold text-xs">
                                    Tú
                                  </Badge>
                                )}
                                {isPending ? (
                                  <>
                                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-xs">
                                      <MailCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                      Pendiente
                                    </Badge>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelInvitation(member.id);
                                      }}
                                      disabled={
                                        cancelingInvitation === member.id
                                      }
                                      className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                      title="Cancelar invitación"
                                    >
                                      <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                    </button>
                                  </>
                                ) : role === "owner" ? (
                                  <Badge
                                    variant="default"
                                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-2 border-gray-900 dark:border-gray-100 font-semibold text-xs"
                                  >
                                    <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                    {formatRole(role)}
                                  </Badge>
                                ) : role === "administrator" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-xs"
                                  >
                                    <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                    {formatRole(role)}
                                  </Badge>
                                ) : role === "seller" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs"
                                  >
                                    {formatRole(role)}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 bg-gray-50 dark:bg-white/[0.02] text-xs"
                                  >
                                    {formatRole(role)}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {canManageMembers && (
                              <TableCell className="py-4 sm:py-5 pr-4 sm:pr-6 min-w-[90px]">
                                <div className="flex items-center justify-end">
                                  {!isPending && role !== "owner" && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          disabled={
                                            removingMember === member.id ||
                                            updatingRole === member.id
                                          }
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                          <span className="sr-only">
                                            Abrir menú
                                          </span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                          Acciones
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger>
                                            <UserCog className="mr-2 h-4 w-4" />
                                            <span>Cambiar rol</span>
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            {["administrator", "seller"]
                                              .filter((r) => r !== role)
                                              .map((newRole) => (
                                                <DropdownMenuItem
                                                  key={newRole}
                                                  onClick={() =>
                                                    handleUpdateRole(
                                                      member.id,
                                                      newRole,
                                                      fullName
                                                    )
                                                  }
                                                >
                                                  {formatRole(newRole)}
                                                </DropdownMenuItem>
                                              ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                          onClick={() =>
                                            handleRemoveMember(member.id, email)
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Eliminar miembro</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "general" && organization && (
            <EditOrganizationForm
              organization={organization}
              currentUserRole={currentUserRole}
            />
          )}

          {activeTab === "procesadores" && organization && (
            <div className="p-6 border rounded-lg">
              <p className="text-muted-foreground">
                Configuración de procesadores de pago próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
