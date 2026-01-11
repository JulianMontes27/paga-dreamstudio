"use client";

import { useRouter } from "next/navigation";
import { useFloorPlan } from "./floor-plan-context";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Magnet,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FloorPlanToolbarProps {
  organizationId: string;
  className?: string;
}

export function FloorPlanToolbar({
  organizationId,
  className,
}: FloorPlanToolbarProps) {
  const router = useRouter();
  const {
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    hasUnsavedChanges,
    isSaving,
    setIsSaving,
    markAsSaved,
    tables,
  } = useFloorPlan();

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  const handleFitToScreen = () => {
    setZoom(1);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Prepare table positions for bulk update
      const tableUpdates = tables
        .filter((t) => t.floorId !== null)
        .map((t) => ({
          id: t.id,
          floorId: t.floorId,
          xPosition: t.xPosition,
          yPosition: t.yPosition,
          width: t.width,
          height: t.height,
          shape: t.shape,
        }));

      const response = await fetch("/api/tables/positions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          tables: tableUpdates,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save positions");
      }

      markAsSaved();
      router.refresh();
      toast.success("Floor plan saved successfully");
    } catch (error) {
      console.error("Error saving floor plan:", error);
      toast.error("Failed to save floor plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-1 p-2 bg-card border rounded-lg",
          className
        )}
      >
        {/* Zoom controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <span className="text-sm text-muted-foreground w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleFitToScreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset Zoom</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Grid controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={showGrid}
              onPressedChange={setShowGrid}
              aria-label="Toggle grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {showGrid ? "Hide Grid" : "Show Grid"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={snapToGrid}
              onPressedChange={setSnapToGrid}
              aria-label="Toggle snap to grid"
            >
              <Magnet className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {snapToGrid ? "Disable Snap" : "Enable Snap"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Save button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasUnsavedChanges ? "default" : "ghost"}
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {hasUnsavedChanges ? "Save" : "Saved"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasUnsavedChanges
              ? "Save floor plan changes"
              : "No unsaved changes"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
