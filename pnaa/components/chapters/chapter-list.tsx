"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/use-firestore";
import { orderBy } from "firebase/firestore";
import { SearchInput } from "@/components/shared/search-input";
import { ChapterCard } from "./chapter-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Chapter } from "@/types/chapter";

export function ChapterList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: chapters, loading } = useCollection<Chapter>("chapters", [
    orderBy("name", "asc"),
  ]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return chapters;
    const q = debouncedSearch.toLowerCase();
    return chapters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    );
  }, [chapters, debouncedSearch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search chapters by name or region..."
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No chapters found"
          description={search ? "Try adjusting your search" : "No chapters available"}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      )}
    </div>
  );
}
