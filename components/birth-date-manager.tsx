"use client";

import React, { useState, useCallback, useMemo, useTransition } from "react";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MONTHS_ES, VALIDATION } from "@/constants/profile";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface BirthDateManagerProps {
  birthDate?: string | Date | null;
}

export function BirthDateManager({ birthDate }: BirthDateManagerProps) {
  const existingDate = useMemo(
    () =>
      birthDate
        ? birthDate instanceof Date
          ? birthDate
          : new Date(birthDate)
        : null,
    [birthDate]
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(
    existingDate || undefined
  );
  const [month, setMonth] = useState<Date>(selected || new Date(2000, 0, 1));
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const formatDisplayDate = useCallback((date: Date) => {
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  }, []);

  // Generate years (1900 to current year - minimum age)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - VALIDATION.MIN_AGE;
    return Array.from({ length: maxYear - 1900 + 1 }, (_, i) => maxYear - i);
  }, []);

  // React memoizes the function itself in memory, to avoid rerenders
  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;

      setSelected(date);
      setOpen(false);

      startTransition(async () => {
        try {
          const { error } = await authClient.updateUser({
            birthdate: date,
          });

          if (error) {
            toast.error(
              error.message || "Error al guardar la fecha de nacimiento"
            );
            // Revert on error
            setSelected(existingDate || undefined);
          } else {
            toast.success("Fecha de nacimiento guardada");
          }
        } catch {
          toast.error("Error al guardar la fecha de nacimiento");
          setSelected(existingDate || undefined);
        }
      });
    },
    [existingDate]
  );

  const handleYearChange = useCallback(
    (year: string) => {
      const newYear = parseInt(year, 10);
      const newDate = new Date(month);
      newDate.setFullYear(newYear);
      setMonth(newDate);
    },
    [month]
  );

  const handleMonthChange = useCallback(
    (monthIndex: string) => {
      const newMonthIndex = parseInt(monthIndex, 10);
      const newDate = new Date(month);
      newDate.setMonth(newMonthIndex);
      setMonth(newDate);
    },
    [month]
  );

  const handleDelete = useCallback(() => {
    setMenuOpen(false);

    startTransition(async () => {
      try {
        const { error } = await authClient.updateUser({
          birthdate: null,
        });

        if (error) {
          toast.error(
            error.message || "Error al eliminar la fecha de nacimiento"
          );
        } else {
          setSelected(undefined);
          toast.success("Fecha de nacimiento eliminada");
        }
      } catch {
        toast.error("Error al eliminar la fecha de nacimiento");
      }
    });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group"
          role="button"
          aria-label={
            selected
              ? `Fecha de nacimiento: ${formatDisplayDate(selected)}`
              : "Seleccionar fecha de nacimiento"
          }
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <CalendarIcon
              className="h-5 w-5 text-gray-400 flex-shrink-0"
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-sm font-medium",
                !selected && "text-gray-500 dark:text-gray-400",
                isPending && "opacity-50"
              )}
            >
              {isPending
                ? "Guardando..."
                : selected
                  ? formatDisplayDate(selected)
                  : "Fecha de nacimiento (Opcional)"}
            </span>
          </div>
          {selected && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label="Opciones de fecha de nacimiento"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-[#2a2a2a] invisible group-hover:visible transition-all rounded-lg h-8 w-8 flex items-center justify-center"
                >
                  <span className="text-xl" aria-hidden="true">
                    ⋯
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-2xl border dark:border-zinc-800 bg-background/95 backdrop-blur-md shadow-lg"
                sideOffset={8}
              >
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="rounded-xl cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 px-3 py-2"
                  >
                    <Trash2
                      className="mr-2 h-4 w-4"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span>Eliminar</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-4 w-auto bg-white border-gray-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] rounded-2xl"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          disabled={(date) => date > new Date() || date < new Date(1900, 0, 1)}
          className="p-0"
          classNames={{
            day_button: cn(
              "hover:bg-gray-100 dark:hover:bg-[#2a2a2a] data-[selected]:bg-primary data-[selected]:text-primary-foreground",
              "data-[disabled]:text-gray-600 data-[disabled]:cursor-not-allowed",
              "data-[outside]:text-gray-600"
            ),
            months: "flex flex-col sm:flex-row gap-4",
            month: "w-full space-y-4",
            month_caption: "relative flex h-10 items-center justify-center",
            caption_label: "text-sm font-medium capitalize",
            nav: "hidden",
            weekday: "size-9 p-0 text-xs font-medium text-gray-500",
            day: "group size-9 px-0 text-sm",
            today: "*:after:bg-primary",
            outside: "text-gray-600 opacity-50",
          }}
          components={{
            CaptionLabel: () => (
              <div className="flex items-center gap-2 w-full">
                <Select
                  value={String(month.getMonth())}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger
                    className="h-8 flex-1 text-xs bg-gray-100 border-gray-200 hover:border-gray-300 focus-visible:border-gray-200 dark:bg-[#1f1f1f] dark:border-[#2a2a2a] dark:hover:border-[#3a3a3a] dark:focus-visible:border-[#2a2a2a] focus-visible:ring-0 focus:ring-0 focus:outline-none"
                    aria-label="Seleccionar mes"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48 bg-white border-gray-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                    {MONTHS_ES.map((monthName, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(month.getFullYear())}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger
                    className="h-8 flex-1 text-xs bg-gray-100 border-gray-200 hover:border-gray-300 focus-visible:border-gray-200 dark:bg-[#1f1f1f] dark:border-[#2a2a2a] dark:hover:border-[#3a3a3a] dark:focus-visible:border-[#2a2a2a] focus-visible:ring-0 focus:ring-0 focus:outline-none"
                    aria-label="Seleccionar año"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48 bg-white border-gray-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ),
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
