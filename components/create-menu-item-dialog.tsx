"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { createMenuItemAction } from "@/server/menu";

interface CreateMenuItemDialogProps {
  organizationId: string;
  categories: Array<{ id: string; name: string }>;
  defaultCategoryId?: string;
  triggerButton?: React.ReactNode;
}

export function CreateMenuItemDialog({
  organizationId,
  categories,
  defaultCategoryId,
  triggerButton,
}: CreateMenuItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: defaultCategoryId || "",
    preparationTime: "",
    imageUrl: "",
  });

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
        const result = await createMenuItemAction({
          organizationId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: parseFloat(formData.price),
          categoryId: formData.categoryId || undefined,
          preparationTime: formData.preparationTime
            ? parseInt(formData.preparationTime)
            : undefined,
          imageUrl: formData.imageUrl.trim() || undefined,
        });

        if (result.success) {
          toast.success("Menu item created successfully");
          setOpen(false);
          setFormData({
            name: "",
            description: "",
            price: "",
            categoryId: defaultCategoryId || "",
            preparationTime: "",
            imageUrl: "",
          });
        } else {
          toast.error(result.error || "Failed to create menu item");
        }
      } catch (error) {
        console.error("Error creating menu item:", error);
        toast.error("An error occurred");
      }
    });
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: defaultCategoryId || "",
        preparationTime: "",
        imageUrl: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerButton ? (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Menu Item</DialogTitle>
            <DialogDescription>
              Add a new item to your restaurant menu
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Caesar Salad, Margherita Pizza"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isPending}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
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
                <Label htmlFor="price">
                  Price ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
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
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
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
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    categoryId: value === "none" ? "" : value,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
