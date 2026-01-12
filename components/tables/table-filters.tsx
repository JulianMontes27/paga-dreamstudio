"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Users, ChevronRight } from "lucide-react";
import { TableActions } from "./table-actions";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "available", label: "Available", color: "bg-green-500" },
  { value: "occupied", label: "Occupied", color: "bg-red-500" },
  { value: "reserved", label: "Reserved", color: "bg-yellow-500" },
  { value: "cleaning", label: "Cleaning", color: "bg-blue-500" },
] as const;

const CAPACITY_OPTIONS = [
  { value: "1-2", label: "1-2 seats" },
  { value: "3-4", label: "3-4 seats" },
  { value: "5-6", label: "5-6 seats" },
  { value: "7+", label: "7+ seats" },
] as const;

type OrderActivity = "idle" | "active" | "payment_made";

type TableWithCheckout = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  section: string | null;
  isNFCEnabled: boolean;
  nfcScanCount: number;
  lastNfcScanAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  floorId: string | null;
  xPosition: number | null;
  yPosition: number | null;
  width: number | null;
  height: number | null;
  shape: string | null;
  orderActivity?: OrderActivity;
  checkoutUrl: string;
};

interface TableFiltersProps {
  tables: TableWithCheckout[];
  userRole: "member" | "admin" | "owner";
  organizationSlug?: string;
}

export function TableFilters({
  tables,
  userRole,
  organizationSlug = "",
}: TableFiltersProps) {
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    setCapacityFilter(searchParams.get("capacity") || "");
    setSearchQuery(searchParams.get("search") || "");
  }, []);

  const clearAllFilters = () => {
    setStatusFilter("");
    setCapacityFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter || capacityFilter || searchQuery;

  const filteredTables = useMemo(() => {
    let filtered = tables;

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((table) => table.status === statusFilter);
    }

    if (capacityFilter && capacityFilter !== "all") {
      filtered = filtered.filter((table) => {
        const capacity = table.capacity;
        switch (capacityFilter) {
          case "1-2":
            return capacity >= 1 && capacity <= 2;
          case "3-4":
            return capacity >= 3 && capacity <= 4;
          case "5-6":
            return capacity >= 5 && capacity <= 6;
          case "7+":
            return capacity >= 7;
          default:
            return true;
        }
      });
    }

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((table) => {
        const tableNumber = (table.tableNumber || "").toLowerCase();
        const section = (table.section || "").toLowerCase();
        return (
          tableNumber.includes(query) ||
          section.includes(query) ||
          `table ${tableNumber}`.includes(query)
        );
      });
    }

    return filtered;
  }, [tables, statusFilter, capacityFilter, searchQuery]);

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[130px]">
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

          <Select
            value={capacityFilter || "all"}
            onValueChange={(v) => setCapacityFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Capacity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              {CAPACITY_OPTIONS.map((cap) => (
                <SelectItem key={cap.value} value={cap.value}>
                  {cap.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearAllFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredTables.length} table{filteredTables.length !== 1 && "s"}
        {hasActiveFilters && " found"}
      </div>

      {/* Table List */}
      {filteredTables.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {filteredTables.map((table) => {
            const statusConfig = getStatusConfig(table.status);
            const canManage = userRole === "admin" || userRole === "owner";

            return (
              <Link
                key={table.id}
                href={`/dashboard/${organizationSlug}/tables/${table.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Status indicator */}
                <div
                  className={`h-3 w-3 rounded-full shrink-0 ${statusConfig.color}`}
                  title={statusConfig.label}
                />

                {/* Table info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Table {table.tableNumber}
                    </span>
                    {table.section && (
                      <span className="text-sm text-muted-foreground">
                        · {table.section}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {table.capacity}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex capitalize"
                >
                  {table.status}
                </Badge>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                  {canManage && (
                    <TableActions
                      table={table}
                      userRole={userRole}
                      organizationSlug={organizationSlug || ""}
                    />
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <div className="text-4xl mb-3">🪑</div>
          <h3 className="font-medium mb-1">No tables yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first table to get started.
          </p>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-medium mb-1">No tables found</h3>
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
