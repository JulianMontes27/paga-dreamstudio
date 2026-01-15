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

  const handleFitToScreen = () => {
    setZoom(1);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Prepare table positions for bulk update
      // Include ALL tables, even those with floorId === null (removed from floor)
      const tableUpdates = tables.map((t) => ({
        id: t.id,
        floorId: t.floorId, // Can be null if table was removed from floor
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
          "flex items-center gap-1 p-1.5 sm:p-2 bg-card border rounded-lg flex-wrap",
          className
        )}
      >
        {/* Zoom controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleFitToScreen}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset Zoom</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 sm:h-6 mx-0.5 sm:mx-1" />

        {/* Grid controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={showGrid}
              onPressedChange={setShowGrid}
              aria-label="Toggle grid"
              className="h-8 w-8 p-0"
              size="sm"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
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
              className="h-8 w-8 p-0"
              size="sm"
            >
              <Magnet className="h-3.5 w-3.5" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {snapToGrid ? "Disable Snap" : "Enable Snap"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 sm:h-6 mx-0.5 sm:mx-1" />

        {/* Save button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasUnsavedChanges ? "default" : "ghost"}
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="gap-1.5 h-8 px-2 sm:px-3"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="hidden xs:inline text-xs sm:text-sm">
                {hasUnsavedChanges ? "Save" : "Saved"}
              </span>
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
