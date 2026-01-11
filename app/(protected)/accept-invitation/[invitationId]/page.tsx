import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/server/users";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Calendar, User, AlertCircle } from "lucide-react";
import HandleInvitation from "./handle-inv";
import Link from "next/link";

const AcceptInvitationPage = async ({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) => {
  // Await the params Promise
  // The invitation link should include the invitation ID, which will be used to accept the invitation.
  const { invitationId } = await params;

  // Make sure to call the acceptInvitation function after the user is logged in.
  const session = await getCurrentUser();

  // Get the specficic invitation from the url params
  let invitation;
  let error = null;

  try {
    invitation = await auth.api.getInvitation({
      query: {
        id: invitationId, // required -> The ID of the invitation to get.
      },
      // This endpoint requires session cookies.
      headers: await headers(),
    });
  } catch (e) {
    error = "Invalid or expired invitation";
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expiresAt) < new Date();

  // Format role for display
  const roleDisplay =
    invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Restaurant Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a restaurant team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Restaurant</span>
            </div>
            <div className="pl-6">
              <h3 className="text-xl font-semibold">
                {invitation.organizationName}
              </h3>
              <p className="text-sm text-muted-foreground">
                /{invitation.organizationSlug}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Your Role</span>
            </div>
            <div className="pl-6">
              <Badge
                variant={
                  invitation.role === "owner"
                    ? "default"
                    : invitation.role === "admin"
                      ? "secondary"
                      : "outline"
                }
              >
                {roleDisplay}
              </Badge>
            </div>
          </div>

          {/* Inviter Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Invited by</span>
            </div>
            <div className="pl-6">
              <p className="text-sm">{invitation.inviterEmail}</p>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Expires</span>
            </div>
            <div className="pl-6">
              <p className="text-sm">
                {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {isExpired && (
                <p className="text-sm text-red-600 mt-1">
                  This invitation has expired
                </p>
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div>
            {!session && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Please log in or sign up to accept this invitation
                </p>
              </div>
            )}

            {session && invitation.status === "accepted" && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  You have already accepted this invitation
                </p>
              </div>
            )}

            {session && invitation.status === "rejected" && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  This invitation was previously declined
                </p>
              </div>
            )}

            {session && invitation.status === "canceled" && (
              <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This invitation has been canceled
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          {invitation.status === "pending" && !isExpired && (
            <HandleInvitation
              invitationId={invitationId}
              organizationSlug={invitation.organizationSlug}
            />
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
