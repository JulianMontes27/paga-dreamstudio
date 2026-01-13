"use client";

import { useState } from "react";
import { TableFilters } from "./table-filters";
import {
  FloorPlanProvider,
  FloorPlanEditor,
  FloorSelector,
  FloorPlanToolbar,
  FloorData,
  TableData,
} from "./floor-plan";
import { Button } from "@/components/ui/button";
import { List, Map } from "lucide-react";
import { Table } from "@/db";

interface TablesViewProps {
  tables: Table[];
  floors: FloorData[];
  canUpdate: boolean;
  organizationId: string;
  userId: string;
}

export function TablesView({
  tables,
  floors,
  canUpdate,
  organizationId,
  userId,
}: TablesViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  // Transform tables for floor plan view
  const floorPlanTables: TableData[] = tables.map((table) => ({
    id: table.id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    status: table.status,
    section: table.section,
    floorId: table.floorId,
    xPosition: table.xPosition,
    yPosition: table.yPosition,
    width: table.width,
    height: table.height,
    shape: table.shape,
  }));

  // Transform tables for list view (with checkout URL)
  const tablesWithCheckout = tables.map((table) => ({
    ...table,
    checkoutUrl: `/checkout/${table.id}`,
  }));

  return (
    <div className="space-y-2">
      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          Lista
        </Button>
        <Button
          variant={viewMode === "map" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("map")}
          className="gap-2"
        >
          <Map className="h-4 w-4" />
          Plano
        </Button>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <TableFilters
          tables={tablesWithCheckout}
          organizationId={organizationId}
          userId={userId}
          canUpdate={canUpdate}
        />
      )}

      {/* Floor Plan View */}
      {viewMode === "map" && (
        <FloorPlanProvider
          initialFloors={floors}
          initialTables={floorPlanTables}
          userId={userId}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FloorSelector organizationId={organizationId} />
              {canUpdate && (
                <FloorPlanToolbar organizationId={organizationId} />
              )}
            </div>
            <FloorPlanEditor className="min-h-[500px] border rounded-lg bg-muted/20" />
          </div>
        </FloorPlanProvider>
      )}
    </div>
  );
}
