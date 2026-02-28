export default function EventPage({ params }: { params: { eventId: string } }) {
  return <div>Event {params.eventId}</div>;
}
