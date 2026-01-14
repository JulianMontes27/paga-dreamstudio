"use client";

import { useDroppable } from "@dnd-kit/core";
import { useFloorPlan, TableData } from "./floor-plan-context";
import { MiniTableShape } from "./table-shape";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Package } from "lucide-react";

interface DraggableUnplacedTableProps {
  table: TableData;
}

function DraggableUnplacedTable({ table }: DraggableUnplacedTableProps) {
  const { selectedFloorId, updateTableFloor, updateTablePosition } = useFloorPlan();

  const handlePlace = () => {
    if (selectedFloorId) {
      // Place table at a default position (50, 50)
      updateTableFloor(table.id, selectedFloorId);
      updateTablePosition(table.id, 50, 50);
    }
  };

  return (
    <div
      onClick={handlePlace}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md border bg-card transition-colors",
        selectedFloorId
          ? "hover:bg-accent cursor-pointer hover:border-primary"
          : "opacity-50 cursor-not-allowed"
      )}
      title={selectedFloorId ? "Click to place on floor" : "Select a floor first"}
    >
      <MiniTableShape
        shape={(table.shape as "rectangular" | "circular" | "oval" | "bar") || "rectangular"}
        status={(table.status as "available" | "occupied" | "reserved" | "cleaning") || "available"}
        tableNumber={table.tableNumber}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">Table {table.tableNumber}</p>
        <p className="text-xs text-muted-foreground">{table.capacity} seats</p>
      </div>
      {selectedFloorId && (
        <MapPin className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

interface UnplacedTablesPanelProps {
  className?: string;
}

export function UnplacedTablesPanel({ className }: UnplacedTablesPanelProps) {
  const { unplacedTables, selectedFloorId, updateTableFloor, updateTablePosition } = useFloorPlan();

  const { setNodeRef, isOver } = useDroppable({
    id: "unplaced-panel",
  });

  const handlePlaceAll = () => {
    if (!selectedFloorId) return;
    unplacedTables.forEach((table, index) => {
      updateTableFloor(table.id, selectedFloorId);
      // Offset each table slightly so they don't all stack
      const offset = index * 20;
      updateTablePosition(table.id, 50 + offset, 50 + offset);
    });
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-64 flex flex-col border rounded-lg bg-card",
        isOver && "ring-2 ring-primary ring-offset-2",
        className
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Unplaced</span>
        </div>
        <Badge variant="secondary">{unplacedTables.length}</Badge>
      </div>

      <div className="flex-1 p-3">
        {unplacedTables.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center h-32 text-center rounded-md border-2 border-dashed transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-muted"
          )}>
            <p className="text-sm text-muted-foreground">
              {isOver ? "Drop here to remove" : "All tables placed"}
            </p>
          </div>
        ) : (
          <>
            {selectedFloorId && unplacedTables.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-3"
                onClick={handlePlaceAll}
              >
                Place All
              </Button>
            )}
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-2">
                {unplacedTables.map((table) => (
                  <DraggableUnplacedTable key={table.id} table={table} />
                ))}
              </div>
            </ScrollArea>
            {isOver && (
              <div className="mt-3 p-3 rounded-md border-2 border-dashed border-primary bg-primary/5 text-center">
                <p className="text-sm text-primary">Drop to remove from floor</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
