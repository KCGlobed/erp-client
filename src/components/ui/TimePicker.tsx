import * as React from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./Button";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  className,
  placeholder = "Select time",
}: TimePickerProps) {
  const [hour, setHour] = React.useState<string>("12");
  const [minute, setMinute] = React.useState<string>("00");
  const [meridiem, setMeridiem] = React.useState<"AM" | "PM">("AM");
  const [isOpen, setIsOpen] = React.useState(false);

  const hoursRef = React.useRef<HTMLDivElement>(null);
  const minutesRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value && value.includes(":")) {
      const [hStr, mStr] = value.split(":");
      const hNum = parseInt(hStr, 10);
      const mNum = parseInt(mStr, 10);
      if (!isNaN(hNum) && !isNaN(mNum)) {
        const displayHour = hNum % 12 === 0 ? 12 : hNum % 12;
        const displayMeridiem = hNum >= 12 ? "PM" : "AM";
        setHour(displayHour.toString().padStart(2, "0"));
        setMinute(mNum.toString().padStart(2, "0"));
        setMeridiem(displayMeridiem);
      }
    } else {
      setHour("12");
      setMinute("00");
      setMeridiem("AM");
    }
  }, [value]);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (hoursRef.current) {
          const selected = hoursRef.current.querySelector('[data-selected="true"]');
          if (selected) {
            selected.scrollIntoView({ block: "center", behavior: "auto" });
          }
        }
        if (minutesRef.current) {
          const selected = minutesRef.current.querySelector('[data-selected="true"]');
          if (selected) {
            selected.scrollIntoView({ block: "center", behavior: "auto" });
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const updateParent = (h: string, m: string, mer: "AM" | "PM") => {
    let hNum = parseInt(h, 10);
    if (mer === "PM" && hNum !== 12) {
      hNum += 12;
    } else if (mer === "AM" && hNum === 12) {
      hNum = 0;
    }
    const hStr = hNum.toString().padStart(2, "0");
    const mStr = m.padStart(2, "0");
    onChange(`${hStr}:${mStr}`);
  };

  const selectHour = (h: string) => {
    setHour(h);
    updateParent(h, minute, meridiem);
  };

  const selectMinute = (m: string) => {
    setMinute(m);
    updateParent(hour, m, meridiem);
  };

  const selectMeridiem = (mer: "AM" | "PM") => {
    setMeridiem(mer);
    updateParent(hour, minute, mer);
  };

  // Lists definition
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Display value formatting
  const displayValue = React.useMemo(() => {
    if (!value) return "";
    const [hStr, mStr] = value.split(":");
    const hNum = parseInt(hStr, 10);
    const mNum = parseInt(mStr, 10);
    if (isNaN(hNum) || isNaN(mNum)) return "";
    const displayHour = hNum % 12 === 0 ? 12 : hNum % 12;
    const displayMeridiem = hNum >= 12 ? "PM" : "AM";
    return `${displayHour.toString().padStart(2, "0")}:${mNum.toString().padStart(2, "0")} ${displayMeridiem}`;
  }, [value]);

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
          <Clock className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-lg z-50 pointer-events-auto flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Hours column */}
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-wider">Hours</span>
            <div
              ref={hoursRef}
              className="h-40 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/50 p-1 flex flex-col gap-0.5 scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-selected={hour === h}
                  onClick={() => selectHour(h)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-all cursor-pointer text-center font-medium",
                    hour === h
                      ? "bg-[var(--primary)] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes column */}
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-wider">Minutes</span>
            <div
              ref={minutesRef}
              className="h-40 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/50 p-1 flex flex-col gap-0.5 scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-selected={minute === m}
                  onClick={() => selectMinute(m)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-all cursor-pointer text-center font-medium",
                    minute === m
                      ? "bg-[var(--primary)] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* AM/PM Column */}
          <div className="flex flex-col gap-1.5 w-16">
            <span className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-wider">Period</span>
            <div className="flex flex-col gap-1 justify-center h-40 border border-gray-100 rounded-lg bg-gray-50/50 p-1">
              {(["AM", "PM"] as const).map((mer) => (
                <button
                  key={mer}
                  type="button"
                  onClick={() => selectMeridiem(mer)}
                  className={cn(
                    "px-2 py-2.5 text-xs rounded-md transition-all cursor-pointer text-center font-bold",
                    meridiem === mer
                      ? "bg-[var(--primary)] text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {mer}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
