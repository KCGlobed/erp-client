import { Info } from "lucide-react";

interface InfoTooltipProps {
  message: React.ReactNode;
  className?: string;
}

export function InfoTooltip({
  message,
  className = "",
}: InfoTooltipProps) {
  return (
    <div className={`relative inline-flex group ${className}`}>
      <Info
        size={16}
        className="cursor-pointer text-gray-400 hover:text-[var(--primary)]"
      />

      <div
        className="
          absolute left-1/2 top-full mt-2
          -translate-x-1/2
          min-w-max
          rounded-md border border-gray-200
          bg-white px-3 py-2
          text-xs text-gray-600
          shadow-lg
          opacity-0 invisible
          transition-all duration-200
          group-hover:opacity-100
          group-hover:visible
          z-50
        "
      >
        {message}
      </div>
    </div>
  );
}