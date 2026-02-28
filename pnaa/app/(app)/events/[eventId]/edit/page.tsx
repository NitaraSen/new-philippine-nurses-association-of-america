"use client";

import { use } from "react";
import { useDocument } from "@/hooks/use-firestore";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppEvent } from "@/types/event";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, loading } = useDocument<AppEvent>("events", eventId);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Event not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Edit Event"
        description={`Editing: ${event.name}`}
      />
      <EventForm event={event} mode="edit" />
    </div>
  );
}
