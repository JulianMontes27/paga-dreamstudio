"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// Types for floor and table data
export interface FloorData {
  id: string;
  name: string;
  organizationId: string;
  displayOrder: number | null;
  canvasWidth: number | null;
  canvasHeight: number | null;
}

export type OrderActivity = "idle" | "active" | "payment_made";

export interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  section?: string | null;
  floorId: string | null;
  xPosition: number | null;
  yPosition: number | null;
  width: number | null;
  height: number | null;
  shape: string | null;
  orderActivity?: OrderActivity;
  qrCode?: {
    id: string;
    code: string;
    isActive: boolean;
    scanCount: number;
  } | null;
}

interface FloorPlanContextType {
  // Data
  floors: FloorData[];
  tables: TableData[];
  selectedFloorId: string | null;
  selectedTableId: string | null;
  organizationId: string | null;
  userId: string | null;
  canEdit: boolean;

  // UI State
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  hasUnsavedChanges: boolean;
  isSaving: boolean;

  // Actions
  setFloors: (floors: FloorData[]) => void;
  setTables: (tables: TableData[]) => void;
  selectFloor: (floorId: string | null) => void;
  selectTable: (tableId: string | null) => void;
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  updateTableFloor: (tableId: string, floorId: string | null) => void;
  removeTableFromFloor: (tableId: string) => void;
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  markAsSaved: () => void;
  setIsSaving: (saving: boolean) => void;

  // Computed
  currentFloor: FloorData | null;
  tablesOnCurrentFloor: TableData[];
  unplacedTables: TableData[];
}

const FloorPlanContext = createContext<FloorPlanContextType | null>(null);

interface FloorPlanProviderProps {
  children: ReactNode;
  initialFloors?: FloorData[];
  initialTables?: TableData[];
  organizationId?: string;
  userId?: string;
  canEdit?: boolean;
}

export function FloorPlanProvider({
  children,
  initialFloors = [],
  initialTables = [],
  organizationId,
  userId,
  canEdit = false,
}: FloorPlanProviderProps) {
  // Data state
  const [floors, setFloorsState] = useState<FloorData[]>(initialFloors);
  const [tables, setTablesState] = useState<TableData[]>(initialTables);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(
    initialFloors.length > 0 ? initialFloors[0].id : null
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Sync with props when they change (e.g., after router.refresh())
  useEffect(() => {
    setFloorsState(initialFloors);
    if (initialFloors.length > 0 && !initialFloors.find(f => f.id === selectedFloorId)) {
      setSelectedFloorId(initialFloors[0].id);
    }
  }, [initialFloors]);

  useEffect(() => {
    setTablesState(initialTables);
  }, [initialTables]);

  // UI state
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(20);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Setters
  const setFloors = useCallback((newFloors: FloorData[]) => {
    setFloorsState(newFloors);
    // Select first floor if current selection is invalid
    if (newFloors.length > 0 && !newFloors.find(f => f.id === selectedFloorId)) {
      setSelectedFloorId(newFloors[0].id);
    }
  }, [selectedFloorId]);

  const setTables = useCallback((newTables: TableData[]) => {
    setTablesState(newTables);
  }, []);

  const selectFloor = useCallback((floorId: string | null) => {
    setSelectedFloorId(floorId);
    setSelectedTableId(null); // Deselect table when changing floors
  }, []);

  const selectTable = useCallback((tableId: string | null) => {
    setSelectedTableId(tableId);
  }, []);

  const updateTablePosition = useCallback((tableId: string, x: number, y: number) => {
    setTablesState(prevTables =>
      prevTables.map(table =>
        table.id === tableId
          ? { ...table, xPosition: x, yPosition: y }
          : table
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateTableFloor = useCallback((tableId: string, floorId: string | null) => {
    setTablesState(prevTables =>
      prevTables.map(table =>
        table.id === tableId
          ? {
              ...table,
              floorId,
              // Reset position when moving to a new floor
              xPosition: floorId ? 50 : null,
              yPosition: floorId ? 50 : null,
            }
          : table
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  const removeTableFromFloor = useCallback((tableId: string) => {
    setTablesState(prevTables =>
      prevTables.map(table =>
        table.id === tableId
          ? {
              ...table,
              floorId: null,
              xPosition: null,
              yPosition: null,
            }
          : table
      )
    );
    setSelectedTableId(null);
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Computed values
  const currentFloor = floors.find(f => f.id === selectedFloorId) ?? null;

  const tablesOnCurrentFloor = tables.filter(
    t => t.floorId === selectedFloorId && t.xPosition !== null && t.yPosition !== null
  );

  const unplacedTables = tables.filter(
    t => t.floorId === null || t.xPosition === null || t.yPosition === null
  );

  const value: FloorPlanContextType = {
    // Data
    floors,
    tables,
    selectedFloorId,
    selectedTableId,
    organizationId: organizationId ?? null,
    userId: userId ?? null,
    canEdit,

    // UI State
    zoom,
    showGrid,
    snapToGrid,
    gridSize,
    hasUnsavedChanges,
    isSaving,

    // Actions
    setFloors,
    setTables,
    selectFloor,
    selectTable,
    updateTablePosition,
    updateTableFloor,
    removeTableFromFloor,
    setZoom,
    setShowGrid,
    setSnapToGrid,
    markAsSaved,
    setIsSaving,

    // Computed
    currentFloor,
    tablesOnCurrentFloor,
    unplacedTables,
  };

  return (
    <FloorPlanContext.Provider value={value}>
      {children}
    </FloorPlanContext.Provider>
  );
}

export function useFloorPlan() {
  const context = useContext(FloorPlanContext);
  if (!context) {
    throw new Error("useFloorPlan must be used within a FloorPlanProvider");
  }
  return context;
}
