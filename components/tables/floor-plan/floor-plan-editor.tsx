"use client";

import { useCallback, useState, useRef } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { useFloorPlan, type TableData } from "./floor-plan-context";
import { FloorPlanCanvasInner } from "./floor-plan-canvas";
import { UnplacedTablesPanel } from "./unplaced-tables-panel";
import { TableShape } from "./table-shape";

interface FloorPlanEditorProps {
  className?: string;
}

/**
 * FloorPlanEditor - Wraps the canvas and unplaced tables panel in a shared DndContext
 * This allows dragging tables from the unplaced panel onto the canvas
 */
export function FloorPlanEditor({ className }: FloorPlanEditorProps) {
  const {
    currentFloor,
    updateTablePosition,
    updateTableFloor,
    removeTableFromFloor,
    snapToGrid,
    gridSize,
    canvasScale,
  } = useFloorPlan();

  const [draggedTable, setDraggedTable] = useState<TableData | null>(null);
  const [isOverValidDropZone, setIsOverValidDropZone] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const table = active.data.current?.table as TableData | undefined;
    if (table) {
      setDraggedTable(table);
      setIsOverValidDropZone(false);
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over, active } = event;
    if (active.rect.current.translated) {
      pointerPositionRef.current = {
        x:
          active.rect.current.translated.left +
          (active.data.current?.table?.width ?? 80) / 2,
        y:
          active.rect.current.translated.top +
          (active.data.current?.table?.height ?? 80) / 2,
      };
    }
    // Check if we're over a valid drop zone
    setIsOverValidDropZone(
      over?.id === "floor-canvas" || over?.id === "unplaced-panel"
    );
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;
      setDraggedTable(null);
      setIsOverValidDropZone(false);

      const tableData = active.data.current?.table as TableData | undefined;
      if (!tableData) return;

      // Check if dropped on the unplaced panel (remove from floor)
      if (over?.id === "unplaced-panel") {
        if (tableData.floorId !== null) {
          removeTableFromFloor(tableData.id);
        }
        pointerPositionRef.current = null;
        return;
      }

      // Check if dropped on the canvas
      if (over?.id === "floor-canvas") {
        // If it's an unplaced table, assign it to the current floor
        if (tableData.floorId === null && currentFloor) {
          const canvasRect = over?.rect;

          let newX = 50; // Default fallback
          let newY = 50; // Default fallback

          if (canvasRect && pointerPositionRef.current) {
            const tableWidth = tableData.width ?? 80;
            const tableHeight = tableData.height ?? 80;

            // Calculate position relative to canvas, centering table on pointer
            newX =
              pointerPositionRef.current.x - canvasRect.left - tableWidth / 2;
            newY =
              pointerPositionRef.current.y - canvasRect.top - tableHeight / 2;

            // Ensure within canvas bounds
            const canvasWidth = currentFloor?.canvasWidth ?? 800;
            const canvasHeight = currentFloor?.canvasHeight ?? 600;

            newX = Math.max(0, Math.min(newX, canvasWidth - tableWidth));
            newY = Math.max(0, Math.min(newY, canvasHeight - tableHeight));
          }

          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          updateTableFloor(tableData.id, currentFloor.id);
          updateTablePosition(tableData.id, newX, newY);
          pointerPositionRef.current = null;
          return;
        }
      }

      pointerPositionRef.current = null;

      // For tables already on the floor, update position based on delta
      if (
        tableData.floorId !== null &&
        tableData.xPosition !== null &&
        tableData.yPosition !== null
      ) {
        // Adjust delta by canvas scale
        const scaledDeltaX = delta.x / canvasScale;
        const scaledDeltaY = delta.y / canvasScale;

        let newX = tableData.xPosition + scaledDeltaX;
        let newY = tableData.yPosition + scaledDeltaY;

        // Snap to grid if enabled
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        // Ensure within canvas bounds
        const canvasWidth = currentFloor?.canvasWidth ?? 800;
        const canvasHeight = currentFloor?.canvasHeight ?? 600;
        const tableWidth = tableData.width ?? 80;
        const tableHeight = tableData.height ?? 80;

        newX = Math.max(0, Math.min(newX, canvasWidth - tableWidth));
        newY = Math.max(0, Math.min(newY, canvasHeight - tableHeight));

        updateTablePosition(tableData.id, newX, newY);
      }
    },
    [
      currentFloor,
      snapToGrid,
      gridSize,
      canvasScale,
      updateTablePosition,
      updateTableFloor,
      removeTableFromFloor,
    ]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        {/* Canvas */}
        <div className="flex-1" ref={canvasRef}>
          <FloorPlanCanvasInner className={className} />
        </div>

        {/* Unplaced tables sidebar - desktop */}
        <UnplacedTablesPanel className="hidden lg:flex" />
      </div>

      {/* Mobile unplaced tables */}
      <div className="lg:hidden mt-4">
        <UnplacedTablesPanel />
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedTable && (
          <div
            className={`transition-opacity cursor-grabbing inline-block ${
              isOverValidDropZone ? "opacity-100" : "opacity-40"
            }`}
          >
            <TableShape
              shape={
                (draggedTable.shape as
                  | "rectangular"
                  | "circular"
                  | "oval"
                  | "bar") || "rectangular"
              }
              width={draggedTable.width ?? 80}
              height={draggedTable.height ?? 80}
              status={
                (draggedTable.status as
                  | "available"
                  | "occupied"
                  | "reserved"
                  | "cleaning") || "available"
              }
              tableNumber={draggedTable.tableNumber}
              capacity={draggedTable.capacity}
              isSelected={false}
              className={`shadow-2xl cursor-grabbing !m-0 ${!isOverValidDropZone ? "ring-2 ring-red-500" : ""}`}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
