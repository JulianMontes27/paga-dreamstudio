"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type PaymentProcessorStatus = "active" | "inactive" | "expired" | "revoked" | "pending";

interface PaymentStatusSwitchProps {
  accountId: string;
  currentStatus: PaymentProcessorStatus;
  processorName: string;
  isDisabled?: boolean;
}

export function PaymentStatusSwitch({
  accountId,
  currentStatus,
  processorName,
  isDisabled = false
}: PaymentStatusSwitchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isActive = currentStatus === "active";
  const canToggle = ["active", "inactive"].includes(currentStatus);

  const handleStatusChange = async (checked: boolean) => {
    if (isLoading || !canToggle) return;

    const newStatus = checked ? "active" : "inactive";

    setIsLoading(true);

    try {
      const response = await fetch(`/api/payment-accounts/${accountId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(
        `${processorName} ${newStatus === "active" ? "activated" : "deactivated"} successfully`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating payment processor status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update payment processor status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show status text for non-toggleable states
  if (!canToggle) {
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)}`}>
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive}
        onCheckedChange={handleStatusChange}
        disabled={isLoading || isDisabled}
        aria-label={`Toggle ${processorName} status`}
      />
      <span className="text-sm text-muted-foreground">
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function getStatusColor(status: PaymentProcessorStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "expired":
    case "revoked":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}