"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, Search } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: {
    id: string;
    name: string;
  } | null;
}

interface SelectedItem {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

interface AddItemsDialogProps {
  orderId: string;
  menuItems: MenuItem[];
}

export function AddItemsDialog({ orderId, menuItems }: AddItemsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const filteredMenuItems = menuItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.name.toLowerCase().includes(query)
    );
  });

  const handleQuantityChange = (menuItemId: string, delta: number) => {
    const newSelectedItems = new Map(selectedItems);
    const current = newSelectedItems.get(menuItemId);

    if (current) {
      const newQuantity = current.quantity + delta;
      if (newQuantity <= 0) {
        newSelectedItems.delete(menuItemId);
      } else {
        newSelectedItems.set(menuItemId, {
          ...current,
          quantity: newQuantity,
        });
      }
    } else if (delta > 0) {
      newSelectedItems.set(menuItemId, {
        menuItemId,
        quantity: 1,
      });
    }

    setSelectedItems(newSelectedItems);
  };

  const handleInstructionsChange = (menuItemId: string, instructions: string) => {
    const newSelectedItems = new Map(selectedItems);
    const current = newSelectedItems.get(menuItemId);

    if (current) {
      newSelectedItems.set(menuItemId, {
        ...current,
        specialInstructions: instructions,
      });
      setSelectedItems(newSelectedItems);
    }
  };

  const handleAddItems = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setIsLoading(true);

    try {
      const items = Array.from(selectedItems.values());

      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add items");
      }

      toast.success(`Added ${items.length} item(s) to order`);
      setSelectedItems(new Map());
      setSearchQuery("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error adding items:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add items");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const totalItems = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Items
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Items to Order</DialogTitle>
          <DialogDescription>
            Select menu items and quantities to add to the order
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {filteredMenuItems.length > 0 ? (
            <div className="divide-y">
              {filteredMenuItems.map((item) => {
                const selectedItem = selectedItems.get(item.id);
                const quantity = selectedItem?.quantity || 0;

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category.name}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-1">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {quantity > 0 && (
                      <Textarea
                        placeholder="Special instructions (optional)"
                        value={selectedItem?.specialInstructions || ""}
                        onChange={(e) =>
                          handleInstructionsChange(item.id, e.target.value)
                        }
                        className="text-sm"
                        rows={2}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No menu items found</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              <span>
                {totalItems} item{totalItems !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItems}
                disabled={isLoading || selectedItems.size === 0}
              >
                {isLoading ? "Adding..." : "Add to Order"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
