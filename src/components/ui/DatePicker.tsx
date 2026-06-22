import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { cn } from "./Button";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" format
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Select date",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const d = parseISO(value);
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd");
      onChange(formatted);
      setIsOpen(false);
    } else {
      onChange("");
    }
  };

  const displayValue = React.useMemo(() => {
    if (!parsedDate) return "";
    return format(parsedDate, "PPP");
  }, [parsedDate]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm outline-none transition-colors text-left cursor-pointer",
            !value && "text-gray-400",
            isOpen ? "border-[var(--primary)] ring-1 ring-[var(--primary)]" : "border-gray-200 bg-white hover:border-gray-300",
            className
          )}
          style={{
            color: value ? "var(--foreground)" : undefined,
          }}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarIcon className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelect}
          // initialFocus
          className="rounded-xl border border-transparent shadow-none p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
