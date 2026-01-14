"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Search,
  X,
  UtensilsCrossed,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  FolderOpen,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
  deleteMenuCategoryAction,
} from "@/server/menu";
import { EditMenuItemDialog } from "./edit-menu-item-dialog";
import { MenuCategory, MenuItem } from "@/db";

interface MenuViewProps {
  menu: (MenuCategory & { menuItems: MenuItem[] })[];
  categories: Array<{ id: string; name: string }>;
  organizationId: string;
  canEdit?: boolean;
}

export function MenuView({ menu, categories, canEdit = false }: MenuViewProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const clearAllFilters = () => {
    setCategoryFilter("");
    setAvailabilityFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = categoryFilter || availabilityFilter || searchQuery;

  // Flatten all items for the items view
  const allItems = useMemo(() => {
    return menu.flatMap((cat) =>
      cat.menuItems.map((item) => ({
        ...item,
        categoryName: cat.name,
        categoryId: cat.id,
      }))
    );
  }, [menu]);

  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.categoryId === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter === "available") {
      filtered = filtered.filter((item) => item.isAvailable !== false);
    } else if (availabilityFilter === "unavailable") {
      filtered = filtered.filter((item) => item.isAvailable === false);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.categoryName.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [allItems, categoryFilter, availabilityFilter, searchQuery]);

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleToggleAvailability = (itemId: string, currentValue: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggleMenuItemAvailabilityAction(
          itemId,
          !currentValue
        );
        if (result.success) {
          toast.success(
            !currentValue
              ? "Item marked as available"
              : "Item marked as unavailable"
          );
        } else {
          toast.error(result.error || "Failed to update availability");
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const handleDeleteItem = () => {
    if (!deleteItemId) return;
    startTransition(async () => {
      try {
        const result = await deleteMenuItemAction(deleteItemId);
        if (result.success) {
          toast.success("Item deleted");
          setDeleteItemId(null);
        } else {
          toast.error(result.error || "Failed to delete item");
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const handleDeleteCategory = () => {
    if (!deleteCategoryId) return;
    startTransition(async () => {
      try {
        const result = await deleteMenuCategoryAction(deleteCategoryId);
        if (result.success) {
          toast.success("Category deleted");
          setDeleteCategoryId(null);
        } else {
          toast.error(result.error || "Failed to delete category");
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const itemToDelete = allItems.find((i) => i.id === deleteItemId);
  const categoryToDelete = menu.find((c) => c.id === deleteCategoryId);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "items"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Items ({allItems.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === "items" && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select
                value={categoryFilter || "all"}
                onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full sm:w-[150px] flex-1 min-w-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={availabilityFilter || "all"}
                onValueChange={(v) =>
                  setAvailabilityFilter(v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-full sm:w-[140px] flex-1 min-w-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="available">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Available
                    </div>
                  </SelectItem>
                  <SelectItem value="unavailable">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Unavailable
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearAllFilters} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs sm:text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 && "s"}
            {hasActiveFilters && " found"}
          </div>

          {/* Items List */}
          {filteredItems.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Drag handle (visual only for now, only for editors) */}
                  {canEdit && (
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 hidden sm:block shrink-0" />
                  )}

                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-muted shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="font-medium text-sm sm:text-base break-words">{item.name}</span>
                      {item.preparationTime && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.preparationTime}m
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground break-words">
                      {item.categoryName}
                      {item.description && ` · ${item.description}`}
                    </div>
                    {/* Mobile: Show price and availability below */}
                    <div className="sm:hidden flex items-center gap-2 mt-2">
                      <span className="font-medium text-sm">
                        {formatPrice(item.price)}
                      </span>
                      {!canEdit && (
                        <Badge
                          variant={
                            item.isAvailable !== false ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.isAvailable !== false ? "Available" : "Unavailable"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Desktop: Price */}
                  <div className="hidden sm:block font-medium text-right shrink-0">
                    {formatPrice(item.price)}
                  </div>

                  {/* Desktop: Availability indicator (read-only for non-editors) */}
                  {!canEdit && (
                    <Badge
                      variant={
                        item.isAvailable !== false ? "default" : "secondary"
                      }
                      className="hidden sm:inline-flex text-xs"
                    >
                      {item.isAvailable !== false ? "Available" : "Unavailable"}
                    </Badge>
                  )}

                  {/* Availability toggle (only for editors) */}
                  {canEdit && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={item.isAvailable !== false}
                        onCheckedChange={() =>
                          handleToggleAvailability(
                            item.id,
                            item.isAvailable !== false
                          )
                        }
                        disabled={isPending}
                      />
                    </div>
                  )}

                  {/* Actions (only for editors) */}
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          className="shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingItem(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setDeleteItemId(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          ) : allItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No menu items</h3>
              <p className="text-sm text-muted-foreground">
                Add items to your menu to get started.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No items found</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Try adjusting your search or filters.
              </p>
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <>
          {/* Categories List */}
          {menu.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {menu.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Drag handle (only for editors) */}
                  {canEdit && (
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 hidden sm:block shrink-0" />
                  )}

                  {/* Icon */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>

                  {/* Category info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base break-words">{category.name}</div>
                    {category.description && (
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        {category.description}
                      </div>
                    )}
                  </div>

                  {/* Items count */}
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {category.menuItems.length} item
                    {category.menuItems.length !== 1 && "s"}
                  </Badge>

                  {/* Actions (only for editors) */}
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          className="shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setDeleteCategoryId(category.id)}
                          disabled={category.menuItems.length > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No categories</h3>
              <p className="text-sm text-muted-foreground">
                Create categories to organize your menu items.
              </p>
            </div>
          )}
        </>
      )}

      {/* Delete Item Dialog */}
      <AlertDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{itemToDelete?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog
        open={!!deleteCategoryId}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{categoryToDelete?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Menu Item Dialog */}
      {editingItem && (
        <EditMenuItemDialog
          item={editingItem}
          categories={categories}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}
    </div>
  );
}
