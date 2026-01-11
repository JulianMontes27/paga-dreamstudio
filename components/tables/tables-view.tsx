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

type OrderActivity = "idle" | "active" | "payment_made";

type TableWithQr = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  section: string | null;
  isQrEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  floorId: string | null;
  xPosition: number | null;
  yPosition: number | null;
  width: number | null;
  height: number | null;
  shape: string | null;
  orderActivity?: OrderActivity;
  qrCode: {
    id: string;
    code: string;
    checkoutUrl: string;
    isActive: boolean;
    scanCount: number;
    lastScannedAt: Date | null;
    expiresAt: Date | null;
  } | null;
};

interface TablesViewProps {
  tablesWithQr: TableWithQr[];
  floors: FloorData[];
  userRole: "member" | "admin" | "owner";
  organizationSlug: string;
  organizationId: string;
}

export function TablesView({
  tablesWithQr,
  floors,
  userRole,
  organizationSlug,
  organizationId,
}: TablesViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  const floorPlanTables: TableData[] = tablesWithQr.map((table) => ({
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
    orderActivity: table.orderActivity,
    qrCode: table.qrCode
      ? {
          id: table.qrCode.id,
          code: table.qrCode.code,
          isActive: table.qrCode.isActive,
          scanCount: table.qrCode.scanCount,
        }
      : null,
  }));

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          List
        </Button>
        <Button
          variant={viewMode === "map" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("map")}
          className="gap-2"
        >
          <Map className="h-4 w-4" />
          Floor Plan
        </Button>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <TableFilters
          tablesWithQr={tablesWithQr}
          userRole={userRole}
          organizationSlug={organizationSlug}
        />
      )}

      {/* Floor Plan View */}
      {viewMode === "map" && (
        <FloorPlanProvider
          initialFloors={floors}
          initialTables={floorPlanTables}
          organizationSlug={organizationSlug}
          canEdit={userRole === "admin" || userRole === "owner"}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <FloorSelector organizationId={organizationId} canEdit={userRole === "admin" || userRole === "owner"} />
              {(userRole === "admin" || userRole === "owner") && (
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
