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
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

/**
 * Form validation schema for creating a new table
 */
const createTableSchema = z.object({
  tableNumber: z
    .string()
    .min(1, "Table number is required")
    .max(10, "Table number must be 10 characters or less"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity cannot exceed 20"),
  section: z.string().optional(),
  generateQr: z.boolean(),
});

type CreateTableFormData = {
  tableNumber: string;
  capacity: number;
  section?: string;
  generateQr: boolean;
};

/**
 * Create Table Button Props Interface
 */
interface CreateTableButtonProps {
  organizationId: string;
}

export function CreateTableButton({ organizationId }: CreateTableButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Form setup with validation
  const form = useForm<CreateTableFormData>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      tableNumber: "",
      capacity: 4,
      section: "none",
      generateQr: true,
    },
  });

  /**
   * Handles form submission
   * Creates new table via API and closes dialog on success
   */
  const onSubmit = async (data: CreateTableFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          section: data.section === "none" ? undefined : data.section,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create table");
      }

      await response.json();

      // Show success message
      toast.success(
        `Table ${data.tableNumber} created successfully${
          data.generateQr ? " with QR code" : ""
        }`
      );

      // Reset form and close dialog
      form.reset();
      setIsOpen(false);

      // Refresh the page to show the new table
      router.refresh();
    } catch (error) {
      console.error("Error creating table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create table"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets form when dialog closes
   */
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
          <DialogDescription>
            Add a new table to your restaurant layout. A unique QR code will be
            generated automatically for customer orders.
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
                    Unique identifier for this table (letters and numbers
                    allowed)
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
                        // Allow empty string for better UX when user is typing
                        if (value === "") {
                          field.onChange("");
                        } else {
                          const numValue = parseInt(value);
                          // Only set valid numbers
                          if (
                            !isNaN(numValue) &&
                            numValue >= 1 &&
                            numValue <= 20
                          ) {
                            field.onChange(numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // On blur, ensure we have a valid number or reset to default
                        const value = e.target.value;
                        if (value === "" || isNaN(parseInt(value))) {
                          field.onChange(4); // Default to 4 if empty
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

            {/* Section Field */}
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No section</SelectItem>
                      <SelectItem value="Main Floor">Main Floor</SelectItem>
                      <SelectItem value="Patio">Patio</SelectItem>
                      <SelectItem value="Bar">Bar</SelectItem>
                      <SelectItem value="Private Dining">
                        Private Dining
                      </SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Group tables by area for better organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Generate QR Code Checkbox */}
            <FormField
              control={form.control}
              name="generateQr"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Generate QR Code</FormLabel>
                    <FormDescription>
                      Automatically create a QR code for customer menu access
                      and ordering. Recommended for all tables.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Table
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
