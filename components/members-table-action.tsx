"use client";

import { removeMemberAction } from "@/server/members";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface MembersTableActionProps {
  memberId: string;
  organizationId: string;
  memberEmail: string;
}

export default function MembersTableAction({
  // memberId,
  organizationId,
  memberEmail
}: MembersTableActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemoveMember = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await removeMemberAction(organizationId, memberEmail);

      if (!success) {
        toast.error(error || "Failed to remove member");
        return;
      }

      setIsLoading(false);
      toast.success("Member removed from organization");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove member from organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRemoveMember}
      variant="destructive"
      size="sm"
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
    </Button>
  );
}
