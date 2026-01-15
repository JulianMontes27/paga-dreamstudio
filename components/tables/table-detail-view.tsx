"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  ArrowLeft,
  Receipt,
  Clock,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Plus,
  Eye,
  Trash2,
  MoreVertical,
  UserPlus,
  UserMinus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Order, Table, OrderItem, MenuItem } from "@/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Extended Order type with relations
type OrderWithItems = Order & {
  orderItems: (OrderItem & {
    menuItem?: MenuItem | null;
  })[];
};

interface TableStats {
  totalOrders: number;
  totalRevenue: number;
  activeOrdersCount: number;
}

interface TableDetailViewProps {
  table: Table;
  activeOrder: OrderWithItems | null;
  orders: OrderWithItems[];
  stats: TableStats;
  organizationSlug: string;
  userId: string;
  userRole?: "waiter" | "admin" | "owner";
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500",
  occupied: "bg-red-500",
  reserved: "bg-yellow-500",
  cleaning: "bg-blue-500",
};

const ORDER_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ordering: { color: "bg-blue-500", label: "Ordering" },
  pending: { color: "bg-yellow-500", label: "Pending" },
  preparing: { color: "bg-blue-500", label: "Preparing" },
  ready: { color: "bg-green-500", label: "Ready" },
  served: { color: "bg-green-600", label: "Served" },
  payment_started: { color: "bg-yellow-500", label: "Payment Started" },
  partially_paid: { color: "bg-orange-500", label: "Partially Paid" },
  paid: { color: "bg-green-500", label: "Paid" },
  cancelled: { color: "bg-red-500", label: "Cancelled" },
};

export function TableDetailView({
  table,
  activeOrder,
  orders,
  stats,
  organizationSlug,
  userId,
  userRole = "waiter",
}: TableDetailViewProps) {
  const router = useRouter();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrderDialogOpen, setDeleteOrderDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const canViewHistory = userRole === "admin" || userRole === "owner";
  const canUpdate = userRole === "admin" || userRole === "owner";

  // For members, only show active unpaid orders
  const displayOrders = canViewHistory
    ? orders
    : orders.filter(
        (o) => !["paid", "cancelled"].includes(o.status.toLowerCase())
      );

  // Check if table can accept new orders
  const canStartOrder = !["occupied", "cleaning", "reserved"].includes(
    table.status.toLowerCase()
  );

  const handleStartOrder = async () => {
    if (!canStartOrder) {
      toast.error(`Cannot start order. Table is ${table.status}`);
      return;
    }

    setIsCreatingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: table.id,
          organizationId: organizationSlug,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const { order: newOrder } = await response.json();

      // Navigate to the new order page
      router.push(
        `/profile/${userId}/organizaciones/${organizationSlug}/pedidos/${newOrder.id}`
      );

      toast.success(`Order started for Table ${table.tableNumber}`);
    } catch (error) {
      console.error("Error starting order:", error);
      toast.error("Failed to start order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          throw new Error("Failed to update table status");
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

  const handleDeleteTable = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete table");
      }

      toast.success(`Table ${table.tableNumber} deleted successfully`);
      setDeleteDialogOpen(false);
      router.push(
        `/profile/${userId}/organizaciones/${organizationSlug}/mesas`
      );
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Failed to delete table");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!activeOrder) return;

    setIsDeletingOrder(true);

    try {
      const response = await fetch(`/api/orders/${activeOrder.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      toast.success(`Order #${activeOrder.orderNumber} deleted successfully`);
      setDeleteOrderDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const statusColor =
    STATUS_COLORS[table.status.toLowerCase()] || "bg-gray-500";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold">
                Table {table.tableNumber}
              </h1>
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusColor}`}
                title={table.status}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {table.capacity} seats
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* View Checkout */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/checkout/${table.id}`, "_blank")}
            className="gap-1.5 flex-1 sm:flex-initial"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden xs:inline">View Checkout</span>
            <span className="xs:hidden">Checkout</span>
          </Button>

          {/* Status Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="gap-1.5 flex-1 sm:flex-initial"
              >
                <span className="capitalize">{table.status}</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {table.status === "available" && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("occupied")}
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Mark as Occupied
                </DropdownMenuItem>
              )}

              {table.status === "occupied" && (
                <DropdownMenuItem
                  onClick={() => updateTableStatus("available")}
                  disabled={isLoading}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Mark as Available
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
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Button - Only for admins/owners */}
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isLoading}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Delete Table Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;Table {table.tableNumber}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTable}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <Dialog open={deleteOrderDialogOpen} onOpenChange={setDeleteOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order &quot;#{activeOrder?.orderNumber}
              &quot;? This will remove all items and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOrderDialogOpen(false)}
              disabled={isDeletingOrder}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={isDeletingOrder}
            >
              {isDeletingOrder ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold">{stats.totalOrders}</div>
          <div className="text-sm text-muted-foreground">Total orders</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-sm text-muted-foreground">Revenue</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold">
            {stats.activeOrdersCount}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
      </div>

      {/* Start Order Section - when no active order */}
      {!activeOrder && (
        <Card
          className={`border-2 ${canStartOrder ? "border-dashed border-primary/30 bg-primary/5" : "border-muted bg-muted/20"}`}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 px-6 text-center">
            <div
              className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center ${canStartOrder ? "bg-primary/10" : "bg-muted"}`}
            >
              <Plus
                className={`h-6 w-6 ${canStartOrder ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <h3 className="font-semibold mb-2">No Active Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {canStartOrder
                ? "Start a new order for this table"
                : `Cannot start order - table is ${table.status}`}
            </p>
            <Button
              onClick={handleStartOrder}
              disabled={isCreatingOrder || !canStartOrder}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isCreatingOrder ? "Creating Order..." : "Start New Order"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Order */}
      {activeOrder && (
        <Card className="overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Current Order</h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    #{activeOrder.orderNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(activeOrder.createdAt)}
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  activeOrder.status === "paid" ? "default" : "secondary"
                }
                className="capitalize"
              >
                {activeOrder.status === "paid" && (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                {ORDER_STATUS_CONFIG[activeOrder.status]?.label ||
                  activeOrder.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Items List */}
            <div className="divide-y">
              {activeOrder.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-3"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-sm font-semibold shrink-0">
                    {item.quantity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.menuItem?.name || item.itemName || "Unknown item"}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-muted/30 px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(activeOrder.subtotal)}
                </span>
              </div>
              {activeOrder.tipAmount &&
                parseFloat(activeOrder.tipAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="tabular-nums">
                      {formatCurrency(activeOrder.tipAmount)}
                    </span>
                  </div>
                )}
              <Separator />
              <div className="flex justify-between pt-1">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatCurrency(activeOrder.totalAmount)}
                </span>
              </div>

              {/* Payment status for partially paid orders */}
              {activeOrder.status === "partially_paid" && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="tabular-nums text-green-600 font-medium">
                      {formatCurrency(activeOrder.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="tabular-nums text-orange-600 font-medium">
                      {formatCurrency(
                        parseFloat(activeOrder.totalAmount) -
                          parseFloat(activeOrder.totalPaid || "0")
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* View Order Button */}
            <div className="px-6 py-4 border-t flex gap-2">
              <Link
                href={`/profile/${userId}/organizaciones/${organizationSlug}/pedidos/${activeOrder.id}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Order Details
                </Button>
              </Link>
              {canUpdate && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteOrderDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order History / Active Orders - Only visible to admins/owners */}
      {canViewHistory && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Order History
            </h2>
          </div>

        {displayOrders.length > 0 ? (
          <div className="border rounded-xl overflow-hidden divide-y">
            {displayOrders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[
                order.status.toLowerCase()
              ] || {
                color: "bg-gray-500",
                label: order.status,
              };

              return (
                <Link
                  key={order.id}
                  href={`/profile/${userId}/organizaciones/${organizationSlug}/pedidos/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusConfig.color}`}
                    title={statusConfig.label}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">
                        {order.orderItems.length}{" "}
                        {order.orderItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <Badge
                      variant="secondary"
                      className="capitalize text-xs mt-1"
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl bg-muted/20">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No orders yet</h3>
            <p className="text-sm text-muted-foreground">
              Orders for this table will appear here
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
