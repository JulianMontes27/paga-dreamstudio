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
} from "lucide-react";

/**
 * Table data interface for edit modal
 */
interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  section: string | null;
  status: "available" | "occupied" | "reserved" | "cleaning";
}

/**
 * Table Actions Props Interface
 */
interface TableActionsProps {
  table: TableData;
  userRole: "member" | "admin" | "owner";
  organizationId: string;
}

export function TableActions({
  table,
  userRole,
  // organizationId,
}: TableActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  // Permission checks
  const canManageTable = userRole === "admin" || userRole === "owner";
  const canAssignCustomers = true; // All roles can assign customers

  const updateTableStatus = async (newStatus: string) => {
    setIsLoading(true);

    // Show loading toast with promise-based pattern for better UX
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

        // Refresh the page to show updated data
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
          {canManageTable && (
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
      />
    </>
  );
}
