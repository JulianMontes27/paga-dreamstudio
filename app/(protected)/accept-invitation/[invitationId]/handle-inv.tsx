"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface HandleInvitationProps {
  invitationId: string;
  organizationSlug: string;
}

export default function HandleInvitation({
  invitationId,
  organizationSlug,
}: HandleInvitationProps) {
  const [isLoading, setIsLoading] = useState<null | "accept" | "reject">(null);
  const router = useRouter();

  const handleAccept = async () => {
    setIsLoading("accept");
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message || "Failed to accept invitation");
        return;
      }

      toast.success("Invitation accepted successfully!");
      router.push(`/dashboard/${organizationSlug}/tables`);
    } catch (error) {
      toast.error("An error occurred while accepting the invitation");
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async () => {
    setIsLoading("reject");
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message || "Failed to reject invitation");
        return;
      }

      toast.success("Invitation rejected successfully!");
      router.push(`/dashboard`);
    } catch (error) {
      toast.error("An error occurred while rejecting the invitation");
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleAccept}
        className="flex-1"
        disabled={isLoading !== null}
      >
        {isLoading === "accept" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Accepting...
          </>
        ) : (
          "Accept Invitation"
        )}
      </Button>

      <Button
        onClick={handleReject}
        className="flex-1"
        variant="destructive"
        disabled={isLoading !== null}
      >
        {isLoading === "reject" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Rejecting...
          </>
        ) : (
          "Reject Invitation"
        )}
      </Button>
    </div>
  );
}
