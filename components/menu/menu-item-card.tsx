"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MoreVertical,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
} from "@/server/menu";

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    imageUrl: string | null;
    isAvailable: boolean | null;
    preparationTime: number | null;
  };
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAvailable, setIsAvailable] = useState(item.isAvailable ?? true);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteMenuItemAction(item.id);

        if (result.success) {
          toast.success("Menu item deleted");
          setShowDeleteDialog(false);
        } else {
          toast.error(result.error || "Failed to delete item");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error("An error occurred");
      }
    });
  };

  const handleToggleAvailability = (checked: boolean) => {
    setIsAvailable(checked);

    startTransition(async () => {
      try {
        const result = await toggleMenuItemAvailabilityAction(item.id, checked);

        if (result.success) {
          toast.success(
            checked ? "Item marked as available" : "Item marked as unavailable"
          );
        } else {
          // Revert on error
          setIsAvailable(!checked);
          toast.error(result.error || "Failed to update availability");
        }
      } catch (error) {
        console.error("Error toggling availability:", error);
        setIsAvailable(!checked);
        toast.error("An error occurred");
      }
    });
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            {item.imageUrl ? (
              <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  {parseFloat(item.price).toFixed(2)}
                </div>

                {item.preparationTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {item.preparationTime} min
                  </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <Label htmlFor={`available-${item.id}`} className="text-sm">
                    Available
                  </Label>
                  <Switch
                    id={`available-${item.id}`}
                    checked={isAvailable}
                    onCheckedChange={handleToggleAvailability}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{item.name}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
