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
import { UserPlus } from "lucide-react";
import { SendInvitationForm } from "./forms/send-invitation-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InviteMemberDialogProps {
  organizationId: string;
  organizationSlug?: string;
}

// Lazy-loaded invite member dialog - reduces initial bundle by ~15-20kb
export function InviteMemberDialog({
  organizationId,
  organizationSlug,
}: InviteMemberDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Handle successful invitation - refresh and close dialog
  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh();
    toast.success("Invitation sent successfully");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Invite Team Member
            {organizationSlug && (
              <span className="font-bold"> to {organizationSlug}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a new team member to join your restaurant.
          </DialogDescription>
        </DialogHeader>
        <SendInvitationForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
