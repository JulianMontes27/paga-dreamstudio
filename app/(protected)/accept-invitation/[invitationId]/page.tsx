import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Mail, UserCheck, Calendar } from "lucide-react";
import { AcceptInvitationActions } from "@/components/accept-invitation-actions";

interface AcceptInvitationPageProps {
  params: Promise<{ invitationId: string }>;
  searchParams: Promise<{ org?: string }>;
}

export default async function AcceptInvitationPage({
  params,
  searchParams,
}: AcceptInvitationPageProps) {
  const { invitationId } = await params;
  const { org } = await searchParams;
  const organizationName = org || "Organización";

  // Get current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not logged in, redirect to sign-in with return URL
  if (!session?.user) {
    const callbackURL = org
      ? `/accept-invitation/${invitationId}?org=${encodeURIComponent(org)}`
      : `/accept-invitation/${invitationId}`;
    redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
  }

  // Fetch invitation details
  let invitation;
  try {
    invitation = await auth.api.getInvitation({
      query: { id: invitationId },
      headers: await headers(),
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              Invitación no encontrada
            </CardTitle>
            <CardDescription>
              Esta invitación no existe o ya ha expirado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expiresAt) < new Date();

  // Check if invitation is not pending
  const isPending = invitation.status === "pending";

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format role for display
  const formatRole = (role: string) => {
    const roleMap: { [key: string]: string } = {
      owner: "Propietario",
      administrator: "Administrador",
      seller: "Vendedor",
      member: "Miembro",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                Invitación a Organización
              </CardTitle>
              <CardDescription>{organizationName}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Invitación enviada a</p>
                <p className="text-sm text-muted-foreground">
                  {invitation.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Rol asignado</p>
                <p className="text-sm text-muted-foreground">
                  {formatRole(invitation.role)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Expira el</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(invitation.expiresAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {!isPending && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                {invitation.status === "accepted" &&
                  "Ya has aceptado esta invitación."}
                {invitation.status === "rejected" &&
                  "Has rechazado esta invitación."}
                {invitation.status === "canceled" &&
                  "Esta invitación ha sido cancelada."}
              </p>
            </div>
          )}

          {isExpired && isPending && (
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-sm text-destructive">
                Esta invitación ha expirado.
              </p>
            </div>
          )}

          {/* Email verification warning */}
          {!session.user.emailVerified && isPending && !isExpired && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Debes verificar tu correo electrónico antes de aceptar esta
                invitación.
              </p>
            </div>
          )}

          {/* Actions */}
          {isPending && !isExpired && (
            <AcceptInvitationActions
              invitationId={invitationId}
              canAccept={session.user.emailVerified}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
