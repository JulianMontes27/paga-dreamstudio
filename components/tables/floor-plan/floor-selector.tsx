"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFloorPlan } from "./floor-plan-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FloorSelectorProps {
  organizationId: string;
  canEdit?: boolean;
  onFloorCreated?: () => void;
  onFloorDeleted?: () => void;
}

export function FloorSelector({
  organizationId,
  canEdit = false,
  onFloorCreated,
  onFloorDeleted,
}: FloorSelectorProps) {
  const router = useRouter();
  const { floors, selectedFloorId, selectFloor, setFloors } = useFloorPlan();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCreateFloor = async () => {
    if (!newFloorName.trim()) {
      toast.error("Please enter a floor name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFloorName.trim(),
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create floor");
      }

      const data = await response.json();
      setFloors([...floors, data.floor]);
      selectFloor(data.floor.id);
      setNewFloorName("");
      setCreateDialogOpen(false);
      toast.success("Floor created successfully");
      router.refresh();
      onFloorCreated?.();
    } catch (error) {
      console.error("Error creating floor:", error);
      toast.error("Failed to create floor");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFloor = async () => {
    if (!selectedFloorId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/floors/${selectedFloorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete floor");
      }

      const updatedFloors = floors.filter((f) => f.id !== selectedFloorId);
      setFloors(updatedFloors);
      selectFloor(updatedFloors.length > 0 ? updatedFloors[0].id : null);
      setDeleteDialogOpen(false);
      toast.success("Floor deleted successfully");
      router.refresh();
      onFloorDeleted?.();
    } catch (error) {
      console.error("Error deleting floor:", error);
      toast.error("Failed to delete floor");
    } finally {
      setIsDeleting(false);
    }
  };

  const currentFloor = floors.find((f) => f.id === selectedFloorId);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {floors.length > 0 ? (
        <Select value={selectedFloorId ?? ""} onValueChange={selectFloor}>
          <SelectTrigger className="w-full sm:w-[200px] min-w-0">
            <SelectValue placeholder="Select floor" />
          </SelectTrigger>
          <SelectContent>
            {floors.map((floor) => (
              <SelectItem key={floor.id} value={floor.id}>
                {floor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-sm text-muted-foreground">No floors created</span>
      )}

      {/* Create Floor Dialog - only for editors */}
      {canEdit && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Floor</DialogTitle>
              <DialogDescription>
                Add a new floor to your restaurant layout. Tables can be assigned to this floor.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="floor-name">Floor Name</Label>
              <Input
                id="floor-name"
                placeholder="e.g., Main Floor, Patio, Rooftop"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFloor();
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFloor} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Floor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Floor Dialog - only for editors */}
      {canEdit && currentFloor && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Floor</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{currentFloor.name}&quot;? Tables on this
                floor will be moved to &quot;Unplaced&quot;.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteFloor}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Floor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
