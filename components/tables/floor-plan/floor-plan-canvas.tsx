"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useFloorPlan } from "./floor-plan-context";
import { DraggableTable } from "./draggable-table";
import { cn } from "@/lib/utils";

interface FloorPlanCanvasProps {
  className?: string;
}

function GridOverlay({
  gridSize,
  canvasWidth,
  canvasHeight,
}: {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
    >
      <defs>
        <pattern
          id="grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/20"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function DroppableCanvas({
  children,
  canvasWidth,
  canvasHeight,
}: {
  children: React.ReactNode;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const { setNodeRef } = useDroppable({
    id: "floor-canvas",
  });

  return (
    <div
      ref={setNodeRef}
      className="relative bg-background border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        minWidth: canvasWidth,
        minHeight: canvasHeight,
      }}
    >
      {children}
    </div>
  );
}

/**
 * FloorPlanCanvasInner - The canvas component without DndContext
 * Used inside FloorPlanEditor which provides the shared DndContext
 */
export function FloorPlanCanvasInner({ className }: FloorPlanCanvasProps) {
  const {
    currentFloor,
    tablesOnCurrentFloor,
    selectTable,
    zoom,
    showGrid,
    gridSize,
  } = useFloorPlan();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const canvasWidth = currentFloor?.canvasWidth ?? 800;
  const canvasHeight = currentFloor?.canvasHeight ?? 600;

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();

    // Use ResizeObserver for more accurate tracking
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleCanvasClick = useCallback(() => {
    selectTable(null);
  }, [selectTable]);

  if (!currentFloor) {
    return (
      <div className={cn("flex items-center justify-center h-96 text-muted-foreground", className)}>
        <p>Create a floor first using the + button above</p>
      </div>
    );
  }

  // Calculate scale to fit container (with some padding)
  const availableWidth = Math.max(containerWidth - 16, 100);
  const fitScale = Math.min(1, availableWidth / canvasWidth);

  // Apply both fit scale and manual zoom
  const effectiveScale = fitScale * zoom;

  // Calculate the scaled dimensions for the wrapper
  const scaledWidth = canvasWidth * effectiveScale;
  const scaledHeight = canvasHeight * effectiveScale;

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      {/* Wrapper with actual scaled dimensions to prevent overflow */}
      <div
        className="relative overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
          maxWidth: "100%",
        }}
      >
        {/* Scaled canvas */}
        <div
          className="origin-top-left"
          style={{
            transform: `scale(${effectiveScale})`,
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          <DroppableCanvas canvasWidth={canvasWidth} canvasHeight={canvasHeight}>
            {showGrid && (
              <GridOverlay
                gridSize={gridSize}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            )}

            {/* Click handler for deselecting */}
            <div
              className="absolute inset-0"
              onClick={handleCanvasClick}
            />

            {/* Render tables */}
            {tablesOnCurrentFloor.map((table) => (
              <DraggableTable key={table.id} table={table} />
            ))}
          </DroppableCanvas>
        </div>
      </div>
    </div>
  );
}

/**
 * FloorPlanCanvas - Legacy export for backwards compatibility
 * Now just re-exports FloorPlanCanvasInner
 */
export const FloorPlanCanvas = FloorPlanCanvasInner;
