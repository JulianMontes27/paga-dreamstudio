"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PaymentAccountActionsProps {
  accountId: string;
  processorName: string;
}

export function PaymentAccountActions({
  accountId,
  processorName
}: PaymentAccountActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Handles payment account deletion with Sonner confirmation
   */
  const handleDeleteAccount = async () => {
    // Show confirmation toast with action buttons
    toast(`Disconnect ${processorName}?`, {
      description: "This will remove the payment processor from your account.",
      action: {
        label: "Disconnect",
        onClick: async () => {
          // Proceed with deletion
          setIsLoading(true);

          try {
            const response = await fetch(`/api/payment-accounts/${accountId}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error("Failed to disconnect payment account");
            }

            toast.success(`${processorName} disconnected successfully`);
            router.refresh();
          } catch (error) {
            console.error("Error disconnecting payment account:", error);
            toast.error("Failed to disconnect payment account");
          } finally {
            setIsLoading(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Disconnection cancelled");
        },
      },
      duration: 10000, // Give user time to decide
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onClick={handleDeleteAccount}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}