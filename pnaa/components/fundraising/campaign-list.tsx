"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/use-firestore";
import { where, orderBy } from "firebase/firestore";
import { SearchInput } from "@/components/shared/search-input";
import { CampaignCard } from "./campaign-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import type { FundraisingCampaign } from "@/types/fundraising";

export function CampaignList() {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const constraints = useMemo(() => {
    const c = [];
    if (!showArchived) c.push(where("archived", "==", false));
    c.push(orderBy("date", "desc"));
    return c;
  }, [showArchived]);

  const { data: campaigns, loading } = useCollection<FundraisingCampaign>(
    "fundraising",
    constraints
  );

  const filtered = useMemo(() => {
    if (!debouncedSearch) return campaigns;
    const q = debouncedSearch.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.fundraiserName.toLowerCase().includes(q) ||
        c.chapterName.toLowerCase().includes(q)
    );
  }, [campaigns, debouncedSearch]);

  const totalRaised = campaigns.reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Total Raised: </span>
          <span className="font-bold text-primary">
            {formatCurrency(totalRaised)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Campaigns: </span>
          <span className="font-semibold">{campaigns.length}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search campaigns..."
          className="w-full sm:max-w-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className={showArchived ? "text-primary" : ""}
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No campaigns found"
          description={
            search
              ? "Try adjusting your search"
              : "No fundraising campaigns yet"
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
