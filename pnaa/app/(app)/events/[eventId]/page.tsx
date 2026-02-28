import { EventDetail } from "@/components/events/event-detail";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventDetail eventId={eventId} />;
}
