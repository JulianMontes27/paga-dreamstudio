"use client";

import { cn } from "@/lib/utils";

type TableShape = "rectangular" | "circular" | "oval" | "bar";
type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

interface TableShapeProps {
  shape: TableShape;
  width: number;
  height: number;
  status: TableStatus;
  tableNumber: string;
  capacity: number;
  isSelected?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<
  TableStatus,
  { bg: string; border: string; text: string }
> = {
  available: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
  },
  occupied: {
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-500",
    text: "text-red-700 dark:text-red-300",
  },
  reserved: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-500",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  cleaning: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
};

export function TableShape({
  shape,
  width,
  height,
  status,
  tableNumber,
  capacity,
  isSelected = false,
  className,
}: TableShapeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.available;

  const baseClasses = cn(
    "flex flex-col items-center justify-center relative",
    "border-2 transition-all duration-150",
    "cursor-grab active:cursor-grabbing",
    colors.bg,
    colors.border,
    isSelected && "ring-2 ring-primary ring-offset-2",
    className
  );

  const shapeStyles: Record<TableShape, string> = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    oval: "rounded-[50%]",
    bar: "rounded-sm",
  };

  // For bar shape, we use a longer width
  const actualWidth = shape === "bar" ? Math.max(width, height * 2) : width;
  const actualHeight = shape === "bar" ? Math.min(height, width / 2) : height;

  return (
    <div
      className={cn(baseClasses, shapeStyles[shape])}
      style={{
        width: actualWidth,
        height: actualHeight,
        minWidth: 40,
        minHeight: 40,
      }}
    >
      <span className={cn("text-sm font-bold", colors.text)}>
        {tableNumber}
      </span>
      <span className={cn("text-xs", colors.text)}>{capacity}p</span>
    </div>
  );
}

// Mini version for the unplaced tables panel
interface MiniTableShapeProps {
  shape: TableShape;
  status: TableStatus;
  tableNumber: string;
  className?: string;
}

export function MiniTableShape({
  shape,
  status,
  tableNumber,
  className,
}: MiniTableShapeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.available;

  const baseClasses = cn(
    "flex items-center justify-center",
    "border-2 w-10 h-10",
    colors.bg,
    colors.border,
    className
  );

  const shapeStyles: Record<TableShape, string> = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    oval: "rounded-[50%]",
    bar: "rounded-sm w-16",
  };

  return (
    <div className={cn(baseClasses, shapeStyles[shape])}>
      <span className={cn("text-xs font-bold", colors.text)}>
        {tableNumber}
      </span>
    </div>
  );
}
