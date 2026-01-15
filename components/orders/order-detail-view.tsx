"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CreditCard, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddItemsDialog } from "./add-items-dialog";
import { DeleteOrderButton } from "./delete-order-button";

interface OrderDetailViewProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    orderType: string;
    subtotal: string;
    tipAmount: string | null;
    totalAmount: string;
    totalPaid: string | null;
    processorFee: string | null;
    marketplaceFee: string | null;
    notes: string | null;
    customerName: string | null;
    customerPhone: string | null;
    createdAt: Date;
    paidAt: Date | null;
    table: {
      id: string;
      tableNumber: string;
    } | null;
    orderItems: Array<{
      id: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      itemName: string | null;
      specialInstructions: string | null;
      menuItem: {
        id: string;
        name: string;
      } | null;
    }>;
    paymentClaims: Array<{
      id: string;
      totalToPay: string;
      status: string;
      paidAt: Date | null;
    }>;
  };
  userId: string;
  orgId: string;
  menuItems: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string;
    menuCategory: {
      id: string;
      name: string;
    } | null;
  }>;
  onDeleteOrder?: (orderId: string) => void | Promise<void>;
}

const STATUS_COLORS: Record<string, string> = {
  ordering: "bg-blue-500",
  payment_started: "bg-yellow-500",
  partially_paid: "bg-orange-500",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
};

export function OrderDetailView({
  order,
  // userId,
  // orgId,
  menuItems,
  onDeleteOrder,
}: OrderDetailViewProps) {
  const router = useRouter();

  // Only allow adding items if order is in ordering or payment_started status
  const canAddItems =
    order.status === "ordering" || order.status === "payment_started";

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-semibold">
              Order #{order.orderNumber}
            </h1>
            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusColor}`}
              title={order.status}
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2 sm:ml-auto">
          {canAddItems && (
            <AddItemsDialog orderId={order.id} menuItems={menuItems} />
          )}
          <DeleteOrderButton
            orderId={order.id}
            orderNumber={order.orderNumber}
            onDelete={onDeleteOrder}
          />
          <Badge variant="secondary" className="capitalize text-xs sm:text-sm">
            {order.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 text-xs sm:text-sm text-muted-foreground -mt-2 sm:-mt-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{formatDate(order.createdAt)}</span>
          <span className="sm:hidden">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </span>
        {order.table && (
          <>
            <span className="hidden xs:inline">·</span>
            <span>Table {order.table.tableNumber}</span>
          </>
        )}
        {order.customerName && (
          <>
            <span className="hidden xs:inline">·</span>
            <span className="truncate max-w-[200px]">{order.customerName}</span>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-semibold">
            {formatCurrency(order.totalAmount)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
        </div>
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-semibold">
            {order.orderItems.length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Items</div>
        </div>
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-semibold">
            {formatCurrency(order.totalPaid)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Paid</div>
        </div>
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-semibold capitalize">
            {order.orderType.replace("-", " ")}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Type</div>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Items
        </h2>
        <div className="border rounded-lg divide-y">
          {order.orderItems.map((item) => {
            return (
              <div key={item.id} className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium bg-muted rounded px-2 py-0.5 shrink-0">
                    {item.quantity}x
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base break-words">
                      {item.menuItem?.name || item.itemName || "Unknown item"}
                    </div>
                    {item.specialInstructions && (
                      <div className="text-xs sm:text-sm text-muted-foreground break-words mt-0.5">
                        {item.specialInstructions}
                      </div>
                    )}
                    {/* Mobile: Show price below item name */}
                    <div className="sm:hidden mt-1 text-sm font-medium">
                      {formatCurrency(item.totalPrice)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatCurrency(item.unitPrice)} each)
                      </span>
                    </div>
                  </div>
                </div>
                {/* Desktop: Show price on right */}
                <div className="hidden sm:block text-right shrink-0">
                  <div className="font-medium">
                    {formatCurrency(item.totalPrice)}
                  </div>
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
        <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Summary
        </h2>
        <div className="border rounded-lg p-3 sm:p-4 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.tipAmount && parseFloat(order.tipAmount) > 0 && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Tip</span>
              <span className="font-medium">{formatCurrency(order.tipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-sm sm:text-base pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Fees (shown if there are any fees) */}
      {((order.processorFee && parseFloat(order.processorFee) > 0) ||
        (order.marketplaceFee && parseFloat(order.marketplaceFee) > 0)) && (
        <div className="space-y-3">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Fees
          </h2>
          <div className="border rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-medium">{formatCurrency(order.totalPaid)}</span>
            </div>
            {order.processorFee && parseFloat(order.processorFee) > 0 && (
              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">
                  <span className="hidden sm:inline">Processor Fee (MercadoPago)</span>
                  <span className="sm:hidden">Processor Fee</span>
                </span>
                <span className="text-red-500 font-medium">
                  -{formatCurrency(order.processorFee)}
                </span>
              </div>
            )}
            {order.marketplaceFee && parseFloat(order.marketplaceFee) > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Marketplace Fee</span>
                <span className="text-red-500 font-medium">
                  -{formatCurrency(order.marketplaceFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-sm sm:text-base pt-2 border-t">
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
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Payments
          </h2>
          <div className="border rounded-lg divide-y">
            {order.paymentClaims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base">
                    {formatCurrency(claim.totalToPay)}
                  </div>
                  {claim.paidAt && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      <span className="hidden sm:inline">Paid {formatDate(claim.paidAt)}</span>
                      <span className="sm:hidden">
                        Paid {new Date(claim.paidAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <Badge
                  variant={claim.status === "paid" ? "default" : "secondary"}
                  className="capitalize text-xs shrink-0"
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
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </h2>
          <div className="border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm break-words">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Customer Info */}
      {(order.customerName || order.customerPhone) && (
        <div className="space-y-3">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Customer
          </h2>
          <div className="border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                {order.customerName && (
                  <div className="font-medium text-sm sm:text-base break-words">{order.customerName}</div>
                )}
                {order.customerPhone && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
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
