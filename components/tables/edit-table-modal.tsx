"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

/**
 * Form validation schema for editing a table
 */
const editTableSchema = z.object({
  tableNumber: z
    .string()
    .min(1, "Table number is required")
    .max(10, "Table number must be 10 characters or less"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity cannot exceed 20"),
  floorId: z.string().optional(),
});

type EditTableFormData = {
  tableNumber: string;
  capacity: number;
  floorId?: string;
};

interface Floor {
  id: string;
  name: string;
}

/**
 * Table data interface
 */
interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  section?: string | null;
  status: string;
  floorId?: string | null;
}

/**
 * Edit Table Modal Props Interface
 */
interface EditTableModalProps {
  table: TableData;
  isOpen: boolean;
  onClose: () => void;
  floors?: Floor[];
}

/**
 * Edit Table Modal Component - Client Component
 *
 * Provides a modal dialog for editing existing tables.
 * Features:
 * - Form validation using Zod schema
 * - Pre-populated form fields with current table data
 * - Section assignment
 * - Capacity validation
 * - Real-time form feedback
 * - Better UX than separate edit page
 *
 * This is a Client Component to handle form interactions and API calls.
 */
export function EditTableModal({ table, isOpen, onClose, floors = [] }: EditTableModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Form setup with validation and pre-populated values
  const form = useForm<EditTableFormData>({
    resolver: zodResolver(editTableSchema),
    defaultValues: {
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      floorId: table.floorId || "",
    },
  });

  /**
   * Handles form submission
   * Updates table via API and closes modal on success
   */
  const onSubmit = async (data: EditTableFormData) => {
    setIsLoading(true);

    // Use toast.promise for better UX with loading states
    toast.promise(
      fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber: data.tableNumber,
          capacity: data.capacity,
          floorId: data.floorId || null,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update table");
        }

        // Close modal and refresh data
        onClose();
        router.refresh();

        return `Table ${data.tableNumber} updated successfully`;
      }),
      {
        loading: `Updating Table ${table.tableNumber}...`,
        success: (message) => message,
        error: (error) => {
          console.error("Error updating table:", error);
          return error instanceof Error ? error.message : "Failed to update table";
        },
        finally: () => setIsLoading(false),
      }
    );
  };

  /**
   * Resets form when modal closes
   */
  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Table {table.tableNumber}</DialogTitle>
          <DialogDescription>
            Update table details. Changes will be applied immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Table Number Field */}
            <FormField
              control={form.control}
              name="tableNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 12, A1, Patio-5"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this table (letters and numbers allowed)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacity Field */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seating Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="4"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          field.onChange("");
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
                            field.onChange(numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === "" || isNaN(parseInt(value))) {
                          field.onChange(table.capacity); // Reset to original if empty
                        }
                        field.onBlur();
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of customers this table can seat
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Floor Field */}
            {floors.length > 0 && (
              <FormField
                control={form.control}
                name="floorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a floor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unplaced</SelectItem>
                        {floors.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            {floor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign table to a floor or leave unplaced
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}