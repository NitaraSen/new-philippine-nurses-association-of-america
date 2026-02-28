import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewEventPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Create Event"
        description="Add a new event to the platform"
      />
      <EventForm mode="create" />
    </div>
  );
}
