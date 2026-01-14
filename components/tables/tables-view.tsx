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
    <div className="space-y-3">
      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-full sm:w-fit">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="gap-2 flex-1 sm:flex-initial"
        >
          <List className="h-4 w-4" />
          <span className="hidden xs:inline">Lista</span>
        </Button>
        <Button
          variant={viewMode === "map" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("map")}
          className="gap-2 flex-1 sm:flex-initial"
        >
          <Map className="h-4 w-4" />
          <span className="hidden xs:inline">Plano</span>
        </Button>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <TableFilters
          tables={tablesWithCheckout}
          organizationId={organizationId}
          userId={userId}
          canUpdate={canUpdate}
          floors={floors}
        />
      )}

      {/* Floor Plan View */}
      {viewMode === "map" && (
        <FloorPlanProvider
          initialFloors={floors}
          initialTables={floorPlanTables}
          userId={userId}
          organizationId={organizationId}
          canEdit={canUpdate}
        >
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <FloorSelector organizationId={organizationId} canEdit={canUpdate} />
              {canUpdate && (
                <FloorPlanToolbar organizationId={organizationId} />
              )}
            </div>
            <FloorPlanEditor className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] border rounded-lg bg-muted/20" />
          </div>
        </FloorPlanProvider>
      )}
    </div>
  );
}
