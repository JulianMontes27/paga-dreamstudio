"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateMenuItemAction } from "@/server/menu";

interface EditMenuItemDialogProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    categoryId: string | null;
    preparationTime: number | null;
    imageUrl: string | null;
  };
  categories: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMenuItemDialog({
  item,
  categories,
  open,
  onOpenChange,
}: EditMenuItemDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || "",
    price: item.price,
    categoryId: item.categoryId || "",
    preparationTime: item.preparationTime?.toString() || "",
    imageUrl: item.imageUrl || "",
  });

  // Reset form when item changes
  useEffect(() => {
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      categoryId: item.categoryId || "",
      preparationTime: item.preparationTime?.toString() || "",
      imageUrl: item.imageUrl || "",
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateMenuItemAction({
          itemId: item.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: parseFloat(formData.price),
          categoryId: formData.categoryId || null,
          preparationTime: formData.preparationTime
            ? parseInt(formData.preparationTime)
            : undefined,
          imageUrl: formData.imageUrl.trim() || undefined,
        });

        if (result.success) {
          toast.success("Menu item updated");
          onOpenChange(false);
        } else {
          toast.error(result.error || "Failed to update menu item");
        }
      } catch (error) {
        console.error("Error updating menu item:", error);
        toast.error("An error occurred");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details for this menu item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., Caesar Salad"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isPending}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your menu item"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isPending}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">
                  Price ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  disabled={isPending}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-prepTime">Prep Time (min)</Label>
                <Input
                  id="edit-prepTime"
                  type="number"
                  min="0"
                  placeholder="15"
                  value={formData.preparationTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preparationTime: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.categoryId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    categoryId: value === "none" ? "" : value,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Image</Label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                folder="menu-items"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
