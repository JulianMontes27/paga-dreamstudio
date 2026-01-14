"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditTableModal } from "./edit-table-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MoreVertical,
  UserPlus,
  UserMinus,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  Eye,
  Plus,
} from "lucide-react";

/**
 * Table data interface for edit modal
 */
interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  section?: string | null;
  status: string;
  floorId?: string | null;
}

interface Floor {
  id: string;
  name: string;
}

/**
 * Table Actions Props Interface
 */
interface TableActionsProps {
  table: TableData;
  organizationId: string;
  userId?: string;
  canUpdate: boolean;
  floors?: Floor[];
}

export function TableActions({
  table,
  organizationId,
  userId,
  canUpdate,
  floors = [],
}: TableActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  const canAssignCustomers = true; // All roles can assign customers

  // Construct checkout URL
  const checkoutUrl = `/checkout/${table.id}`;

  /**
   * Creates a new order for the table
   */
  const handleStartOrder = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: table.id,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const { order: newOrder } = await response.json();

      // Navigate to the new order page
      router.push(
        `/profile/${userId}/organizaciones/${organizationId}/pedidos/${newOrder.id}`
      );

      toast.success(`Order started for Table ${table.tableNumber}`);
    } catch (error) {
      console.error("Error starting order:", error);
      toast.error("Failed to start order");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTableStatus = async (newStatus: string) => {
    setIsLoading(true);

    toast.promise(
      fetch(`/api/tables/${table.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to update table status`);
        }

        router.refresh();
        return `Table ${table.tableNumber} marked as ${newStatus}`;
      }),
      {
        loading: `Updating Table ${table.tableNumber}...`,
        success: (message) => message,
        error: (error) => {
          console.error("Error updating table status:", error);
          return "Failed to update table status";
        },
        finally: () => setIsLoading(false),
      }
    );
  };

  /**
   * Handles table deletion with Sonner confirmation
   * Only available to admins and owners
   */
  const handleDeleteTable = async () => {
    // Show confirmation toast with action buttons - much better UX than browser confirm
    toast(`Delete Table ${table.tableNumber}?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          // Proceed with deletion
          setIsLoading(true);

          try {
            const response = await fetch(`/api/tables/${table.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error("Failed to delete table");
            }

            toast.success(`Table ${table.tableNumber} deleted successfully`);
            router.refresh();
          } catch (error) {
            console.error("Error deleting table:", error);
            toast.error("Failed to delete table");
          } finally {
            setIsLoading(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Deletion cancelled");
        },
      },
      duration: 10000, // Give user time to decide
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isLoading}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open table actions menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Table Actions</DropdownMenuLabel>

          {/* Start Order - Available to all roles */}
          {userId && table.status !== "cleaning" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleStartOrder} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Start Order
              </DropdownMenuItem>
            </>
          )}

          {/* View Checkout - Available to all roles */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.open(checkoutUrl, "_blank")}>
            <Eye className="mr-2 h-4 w-4" />
            View Checkout
          </DropdownMenuItem>

          {/* Customer Assignment Actions - Available to all roles */}
          {canAssignCustomers && (
            <>
              <DropdownMenuSeparator />

              {table.status === "available" && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("occupied")}
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Customer
                </DropdownMenuItem>
              )}

              {table.status === "occupied" && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("available")}
                  disabled={isLoading}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Clear Table
                </DropdownMenuItem>
              )}

              {table.status !== "reserved" && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("reserved")}
                  disabled={isLoading}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Mark as Reserved
                </DropdownMenuItem>
              )}

              {table.status !== "cleaning" && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("cleaning")}
                  disabled={isLoading}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mark for Cleaning
                </DropdownMenuItem>
              )}

              {(table.status === "reserved" || table.status === "cleaning") && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("available")}
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Mark as Available
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Management Actions - Only for admins and owners */}
          {canUpdate && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setIsEditModalOpen(true)}
                disabled={isLoading}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Table
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDeleteTable}
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Table
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Table Modal */}
      <EditTableModal
        table={table}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        floors={floors}
      />
    </>
  );
}
