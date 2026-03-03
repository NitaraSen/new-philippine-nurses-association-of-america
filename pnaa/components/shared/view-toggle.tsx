"use client";

import { Table2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "cards";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border bg-muted p-1 gap-0.5 shrink-0">
      {(["table", "cards"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all",
            view === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode === "table" ? (
            <Table2 className="h-3.5 w-3.5" />
          ) : (
            <LayoutGrid className="h-3.5 w-3.5" />
          )}
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
}
