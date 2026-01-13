"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CreditCard, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  name: string;
  price: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  itemName: string | null;
  specialInstructions: string | null;
  status: string;
  menuItem: MenuItem | null;
}

interface PaymentClaim {
  id: string;
  claimedAmount: string;
  totalToPay: string;
  status: string;
  paidAt: Date | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  subtotal: string;
  taxAmount: string;
  tipAmount: string | null;
  totalAmount: string;
  totalClaimed: string | null;
  totalPaid: string | null;
  processorFee: string | null;
  marketplaceFee: string | null;
  notes: string | null;
  customerName: string | null;
  customerPhone: string | null;
  paymentStatus: string | null;
  createdAt: Date;
  paidAt: Date | null;
  table: {
    id: string;
    tableNumber: string;
  } | null;
  orderItems: OrderItem[];
  paymentClaims: PaymentClaim[];
}

interface OrderDetailViewProps {
  order: Order;
  userId: string;
  orgId: string;
}

const STATUS_COLORS: Record<string, string> = {
  ordering: "bg-blue-500",
  payment_started: "bg-yellow-500",
  partially_paid: "bg-orange-500",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
};

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter();

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColor = STATUS_COLORS[order.status] || "bg-gray-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Order #{order.orderNumber}</h1>
            <div
              className={`h-2.5 w-2.5 rounded-full ${statusColor}`}
              title={order.status}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(order.createdAt)}
            </span>
            {order.table && <span>· Table {order.table.tableNumber}</span>}
            {order.customerName && <span>· {order.customerName}</span>}
          </div>
        </div>
        <Badge variant="secondary" className="capitalize">
          {order.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold">
            {formatCurrency(order.totalAmount)}
          </div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold">{order.orderItems.length}</div>
          <div className="text-sm text-muted-foreground">Items</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold">
            {formatCurrency(order.totalPaid)}
          </div>
          <div className="text-sm text-muted-foreground">Paid</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-semibold capitalize">
            {order.orderType.replace("-", " ")}
          </div>
          <div className="text-sm text-muted-foreground">Type</div>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Items
        </h2>
        <div className="border rounded-lg divide-y">
          {order.orderItems.map((item) => {
            return (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium bg-muted rounded px-2 py-0.5">
                    {item.quantity}x
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.menuItem?.name || item.itemName || "Unknown item"}
                    </div>
                    {item.specialInstructions && (
                      <div className="text-sm text-muted-foreground truncate">
                        {item.specialInstructions}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} each
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Summary
        </h2>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </div>
          {order.tipAmount && parseFloat(order.tipAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip</span>
              <span>{formatCurrency(order.tipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Fees (shown if there are any fees) */}
      {((order.processorFee && parseFloat(order.processorFee) > 0) ||
        (order.marketplaceFee && parseFloat(order.marketplaceFee) > 0)) && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Fees
          </h2>
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span>{formatCurrency(order.totalPaid)}</span>
            </div>
            {order.processorFee && parseFloat(order.processorFee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processor Fee (MercadoPago)</span>
                <span className="text-red-500">-{formatCurrency(order.processorFee)}</span>
              </div>
            )}
            {order.marketplaceFee && parseFloat(order.marketplaceFee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Marketplace Fee</span>
                <span className="text-red-500">-{formatCurrency(order.marketplaceFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Net Amount</span>
              <span>
                {formatCurrency(
                  parseFloat(order.totalPaid || "0") -
                    (parseFloat(order.processorFee || "0") +
                      parseFloat(order.marketplaceFee || "0"))
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Claims */}
      {order.paymentClaims.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Payments
          </h2>
          <div className="border rounded-lg divide-y">
            {order.paymentClaims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-4 p-4">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{formatCurrency(claim.totalToPay)}</div>
                  {claim.paidAt && (
                    <div className="text-sm text-muted-foreground">
                      Paid {formatDate(claim.paidAt)}
                    </div>
                  )}
                </div>
                <Badge
                  variant={claim.status === "paid" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {claim.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </h2>
          <div className="border rounded-lg p-4">
            <p className="text-sm">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Customer Info */}
      {(order.customerName || order.customerPhone) && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Customer
          </h2>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                {order.customerName && (
                  <div className="font-medium">{order.customerName}</div>
                )}
                {order.customerPhone && (
                  <div className="text-sm text-muted-foreground">
                    {order.customerPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
