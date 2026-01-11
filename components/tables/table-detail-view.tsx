"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  QrCode,
  ArrowLeft,
  Receipt,
  Clock,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  name: string;
  price: string;
  description: string | null;
}

interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  itemName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  specialInstructions: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  menuItem: MenuItem | null;
}

interface Order {
  id: string;
  organizationId: string;
  tableId: string | null;
  orderNumber: string;
  status: string;
  orderType: string;
  subtotal: string;
  taxAmount: string;
  tipAmount: string | null;
  totalAmount: string;
  totalPaid: string | null;
  notes: string | null;
  customerName: string | null;
  customerPhone: string | null;
  createdBy: string | null;
  servedBy: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
}

interface QRCode {
  id: string;
  code: string;
  checkoutUrl: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: Date | null;
  expiresAt: Date | null;
}

interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  section: string | null;
  isQrEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  qrCode: QRCode | null;
}

interface TableStats {
  totalOrders: number;
  totalRevenue: number;
  activeOrdersCount: number;
}

interface TableDetailViewProps {
  table: TableData;
  activeOrder: Order | null;
  orders: Order[];
  stats: TableStats;
  organizationSlug: string;
  userRole?: "member" | "admin" | "owner";
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
  userRole = "member",
}: TableDetailViewProps) {
  const canViewHistory = userRole === "admin" || userRole === "owner";

  // For members, only show active unpaid orders
  const displayOrders = canViewHistory
    ? orders
    : orders.filter(o => !["paid", "cancelled"].includes(o.status.toLowerCase()));
  const router = useRouter();

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

  const statusColor = STATUS_COLORS[table.status.toLowerCase()] || "bg-gray-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Table {table.tableNumber}</h1>
            <div
              className={`h-2.5 w-2.5 rounded-full ${statusColor}`}
              title={table.status}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {table.capacity} seats
            </span>
            {table.section && <span>· {table.section}</span>}
            {table.qrCode && (
              <span className="flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" />
                {table.qrCode.scanCount} scans
              </span>
            )}
          </div>
        </div>
      </div>

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
          <div className="text-2xl font-semibold">{stats.activeOrdersCount}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
      </div>

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
                  <span className="font-medium text-foreground">#{activeOrder.orderNumber}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(activeOrder.createdAt)}
                  </span>
                </div>
              </div>
              <Badge
                variant={activeOrder.status === "paid" ? "default" : "secondary"}
                className="capitalize"
              >
                {activeOrder.status === "paid" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {ORDER_STATUS_CONFIG[activeOrder.status]?.label || activeOrder.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Items List */}
            <div className="divide-y">
              {activeOrder.orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-3">
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
                <span className="tabular-nums">{formatCurrency(activeOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(activeOrder.taxAmount)}</span>
              </div>
              {activeOrder.tipAmount && parseFloat(activeOrder.tipAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip</span>
                  <span className="tabular-nums">{formatCurrency(activeOrder.tipAmount)}</span>
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
            <div className="px-6 py-4 border-t">
              <Link href={`/dashboard/${organizationSlug}/orders/${activeOrder.id}`}>
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Order Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order History / Active Orders */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {canViewHistory ? "Order History" : "Active Orders"}
          </h2>
        </div>

        {displayOrders.length > 0 ? (
          <div className="border rounded-xl overflow-hidden divide-y">
            {displayOrders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status.toLowerCase()] || {
                color: "bg-gray-500",
                label: order.status,
              };

              return (
                <Link
                  key={order.id}
                  href={`/dashboard/${organizationSlug}/orders/${order.id}`}
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
                        {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"}
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
                    <Badge variant="secondary" className="capitalize text-xs mt-1">
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
            <h3 className="font-medium mb-1">
              {canViewHistory ? "No orders yet" : "No active orders"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {canViewHistory
                ? "Orders for this table will appear here"
                : "Active unpaid orders will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
