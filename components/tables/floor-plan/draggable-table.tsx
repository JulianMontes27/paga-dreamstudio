"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TableShape } from "./table-shape";
import { useFloorPlan, TableData } from "./floor-plan-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface DraggableTableProps {
  table: TableData;
}

export function DraggableTable({ table }: DraggableTableProps) {
  const { selectedTableId, selectTable, removeTableFromFloor, snapToGrid, gridSize, organizationSlug, userId, canEdit } = useFloorPlan();
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: table.id,
    disabled: !canEdit,
    data: {
      type: "table",
      table,
    },
  });

  const isSelected = selectedTableId === table.id;

  // Apply snap to grid on transform
  let x = table.xPosition ?? 0;
  let y = table.yPosition ?? 0;

  if (transform) {
    x += transform.x;
    y += transform.y;

    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
  }

  const style = {
    position: "absolute" as const,
    left: x,
    top: y,
    transform: CSS.Translate.toString(transform ? { x: 0, y: 0, scaleX: 1, scaleY: 1 } : null),
    zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
    opacity: isDragging ? 0 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // For non-editors, single click navigates to table detail
    if (!canEdit && organizationSlug && userId) {
      router.push(`/profile/${userId}/organizaciones/${organizationSlug}/mesas/${table.id}`);
      return;
    }
    // For editors, single click selects the table
    selectTable(isSelected ? null : table.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Double click navigates to table detail (for editors)
    if (organizationSlug && userId) {
      router.push(`/profile/${userId}/organizaciones/${organizationSlug}/mesas/${table.id}`);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeTableFromFloor(table.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "touch-none select-none group",
        canEdit && isDragging && "cursor-grabbing",
        canEdit && !isDragging && "cursor-grab",
        !canEdit && "cursor-pointer"
      )}
    >
      {/* Remove button - shows on hover or when selected (only for editors) */}
      {canEdit && (
        <Button
          variant="destructive"
          size="icon"
          className={cn(
            "absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 transition-opacity z-10",
            "group-hover:opacity-100",
            isSelected && "opacity-100"
          )}
          onClick={handleRemove}
          title="Remove from floor"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div {...(canEdit ? { ...listeners, ...attributes } : {})}>
        <TableShape
          shape={(table.shape as "rectangular" | "circular" | "oval" | "bar") || "rectangular"}
          width={table.width ?? 80}
          height={table.height ?? 80}
          status={(table.status as "available" | "occupied" | "reserved" | "cleaning") || "available"}
          tableNumber={table.tableNumber}
          capacity={table.capacity}
          isSelected={canEdit && isSelected}
          orderActivity={table.orderActivity}
        />
      </div>
    </div>
  );
}
