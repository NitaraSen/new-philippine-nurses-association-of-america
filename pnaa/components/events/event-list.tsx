"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/use-firestore";
import { where, orderBy } from "firebase/firestore";
import { SearchInput } from "@/components/shared/search-input";
import { EventCard } from "./event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { AppEvent } from "@/types/event";

type FilterMode = "upcoming" | "past" | "all";

export function EventList() {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("upcoming");
  const [showArchived, setShowArchived] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const today = new Date().toISOString().split("T")[0];

  const constraints = useMemo(() => {
    const c = [];
    if (!showArchived) c.push(where("archived", "==", false));
    if (filterMode === "upcoming") {
      c.push(where("startDate", ">=", today));
      c.push(orderBy("startDate", "asc"));
    } else if (filterMode === "past") {
      c.push(where("startDate", "<", today));
      c.push(orderBy("startDate", "desc"));
    } else {
      c.push(orderBy("startDate", "desc"));
    }
    return c;
  }, [filterMode, showArchived, today]);

  const { data: events, loading } = useCollection<AppEvent>(
    "events",
    constraints
  );

  const filtered = useMemo(() => {
    if (!debouncedSearch) return events;
    const q = debouncedSearch.toLowerCase();
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.chapter.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [events, debouncedSearch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search events..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          {(["upcoming", "past", "all"] as FilterMode[]).map((mode) => (
            <Button
              key={mode}
              variant={filterMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? "text-primary" : ""}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description={
            search
              ? "Try adjusting your search"
              : "No events match the current filter"
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
