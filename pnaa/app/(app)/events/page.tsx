"use client";

import Link from "next/link";
import { EventList } from "@/components/events/event-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-auth";

export default function EventsPage() {
  const isAdmin = useIsAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Events" description="All events across PNAA chapters">
        {isAdmin && (
          <Link href="/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </Link>
        )}
      </PageHeader>
      <EventList />
    </div>
  );
}
