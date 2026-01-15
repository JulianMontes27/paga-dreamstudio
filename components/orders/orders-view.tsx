"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Receipt, ChevronRight } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  itemName: string | null;
  menuItem: {
    id: string;
    name: string;
    price: string;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  subtotal: string;
  tipAmount: string | null;
  totalAmount: string;
  customerName: string | null;
  createdAt: Date;
  paidAt: Date | null;
  table: {
    id: string;
    tableNumber: string;
  } | null;
  orderItems: OrderItem[];
}

interface OrdersViewProps {
  orders: Order[];
  userId: string;
  orgId: string;
}

const STATUS_OPTIONS = [
  { value: "ordering", label: "Ordering", color: "bg-blue-500" },
  { value: "payment_started", label: "Payment Started", color: "bg-yellow-500" },
  { value: "partially_paid", label: "Partially Paid", color: "bg-orange-500" },
  { value: "paid", label: "Paid", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const;

const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

export function OrdersView({ orders, userId, orgId }: OrdersViewProps) {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const clearAllFilters = () => {
    setStatusFilter("");
    setDateFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter || dateFilter !== "all" || searchQuery;

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);

        switch (dateFilter) {
          case "today":
            return orderDate >= startOfToday;
          case "week": {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return orderDate >= startOfWeek;
          }
          case "month": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return orderDate >= startOfMonth;
          }
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((order) => {
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.table?.tableNumber.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [orders, statusFilter, dateFilter, searchQuery]);

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "$0.00";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, table, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[140px] flex-1 min-w-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[130px] flex-1 min-w-0">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
      <div className="text-sm text-muted-foreground">
        {filteredOrders.length} order{filteredOrders.length !== 1 && "s"}
        {hasActiveFilters && " found"}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);

            return (
              <Link
                key={order.id}
                href={`/profile/${userId}/organizaciones/${orgId}/pedidos/${order.id}`}
                className="flex items-start sm:items-center gap-3 p-3 sm:gap-4 sm:p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Status indicator */}
                <div
                  className={`h-3 w-3 rounded-full shrink-0 mt-0.5 sm:mt-0 ${statusConfig.color}`}
                  title={statusConfig.label}
                />

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium text-sm sm:text-base">#{order.orderNumber}</span>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                      {order.table && (
                        <span>Table {order.table.tableNumber}</span>
                      )}
                      {order.customerName && (
                        <>
                          {order.table && <span>·</span>}
                          <span className="truncate max-w-[150px]">{order.customerName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                    <span>{order.orderItems.length} items</span>
                    <span>·</span>
                    <span className="hidden xs:inline">{formatDate(order.createdAt)}</span>
                    <span className="xs:hidden">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {/* Mobile: Show amount and status below order info */}
                  <div className="flex items-center gap-2 mt-2 sm:hidden">
                    <span className="font-medium text-sm">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Desktop: Amount and status on the right */}
                <div className="hidden sm:block text-right shrink-0">
                  <div className="font-medium">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
              </Link>
            );
          })}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium mb-1">No orders yet</h3>
          <p className="text-sm text-muted-foreground">
            Orders will appear here when customers place them.
          </p>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium mb-1">No orders found</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Try adjusting your search or filters.
          </p>
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
