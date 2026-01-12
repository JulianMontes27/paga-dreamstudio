"use client"
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SimpleDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
}

export const SimpleDatePicker = ({ value, onChange, placeholder = "Selecciona una fecha", name }: SimpleDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate limits
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
  const minDate = new Date(maxDate.getFullYear() - 100, 0, 1);

  // Max year for selector
  const maxYear = maxDate.getFullYear();
  const minYear = minDate.getFullYear();

  useEffect(() => {
    // Set initial view to a valid date
    if (selectedDate) {
      setViewDate(new Date(selectedDate));
    } else {
      // Default to max allowed date
      setViewDate(new Date(maxDate));
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInside =
        (containerRef.current && containerRef.current.contains(target)) ||
        (calendarRef.current && calendarRef.current.contains(target));

      if (!clickedInside) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Calculate position with boundary checks
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const calendarWidth = 384; // max-w-sm = 24rem = 384px
        const calendarHeight = 400; // approximate height
        const padding = 16; // 1rem padding from edges

        let top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX;

        // Check if calendar would go off right edge
        if (left + calendarWidth > window.innerWidth - padding) {
          left = window.innerWidth - calendarWidth - padding;
        }

        // Check if calendar would go off left edge
        if (left < padding) {
          left = padding;
        }

        // Check if calendar would go off bottom edge
        if (rect.bottom + calendarHeight > window.innerHeight - padding) {
          // Position above the input instead
          top = rect.top + window.scrollY - calendarHeight - 8;
        }

        // Check if calendar would go off top edge when positioned above
        if (top < padding + window.scrollY) {
          // If it doesn't fit above either, position it at the top with scroll
          top = padding + window.scrollY;
        }

        setPosition({ top, left });
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const displayDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const isDateDisabled = (date: Date) => {
    return date > maxDate || date < minDate;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (!isDateDisabled(newDate)) {
      setSelectedDate(newDate);
      onChange?.(formatDate(newDate));
      setIsOpen(false);
    }
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + increment, 1);
    if (newDate <= maxDate && newDate >= minDate) {
      setViewDate(newDate);
    }
  };

  const changeYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
  };

  const changeMonthDirect = (month: number) => {
    setViewDate(new Date(viewDate.getFullYear(), month, 1));
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange?.('');
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfMonth(viewDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedDate ? formatDate(selectedDate) : ''} />

      {/* Input */}
      <div className="flex items-center gap-2 rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm px-4 py-4 transition-colors focus-within:border-primary/50 focus-within:bg-primary/5">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 cursor-pointer"
        >
          <span className="flex-1 text-sm">
            {selectedDate ? (
              <span className="text-foreground">{displayDate(selectedDate)}</span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </span>
          <Calendar size={18} className="text-muted-foreground" />
        </div>
        {selectedDate && (
          <button
            type="button"
            onClick={() => clearDate()}
            className="p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Calendar Popup Portal */}
      {mounted && isOpen && createPortal(
        <div
          ref={calendarRef}
          className="fixed w-full max-w-sm rounded-2xl border dark:border-[#303030] bg-background shadow-2xl p-4 z-[99999]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >

          {/* Month + Year Select */}
          <div className="flex gap-2 mb-4">
            <select
              value={viewDate.getMonth()}
              onChange={(e) => changeMonthDirect(parseInt(e.target.value))}
              className="flex-1 rounded-xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-primary/50 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={viewDate.getFullYear()}
              onChange={(e) => changeYear(parseInt(e.target.value))}
              className="flex-1 rounded-xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-primary/50 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
            >
              {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mb-3 text-sm font-medium text-foreground">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-lg hover:bg-foreground/10 dark:hover:bg-foreground/5 transition-colors"
              disabled={new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1) < minDate}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1.5">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-2 rounded-lg hover:bg-foreground/10 dark:hover:bg-foreground/5 transition-colors"
              disabled={new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) > maxDate}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="w-full text-center text-sm">
            {/* Week days header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="py-2 text-xs font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for alignment */}
              {emptyDays.map(i => (
                <div key={`empty-${i}`} />
              ))}

              {/* Days of month */}
              {days.map(day => {
                const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isDisabled = isDateDisabled(currentDate);
                const isSelected = selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === viewDate.getMonth() &&
                  selectedDate.getFullYear() === viewDate.getFullYear();
                const isToday =
                  currentDate.getDate() === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${!isSelected && !isDisabled ? 'hover:bg-primary/20' : ''}
                      ${isToday && !isSelected ? 'border border-primary/50' : ''}
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};