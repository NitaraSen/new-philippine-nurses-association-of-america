"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, ArrowUpRight, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AppEvent } from "@/types/event";

export function UpcomingEvents({
  events,
}: {
  events: (AppEvent & { id: string })[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Upcoming Events</CardTitle>
        <Link
          href="/events"
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No upcoming events
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-start gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-accent"
              >
                <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.startDate)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
