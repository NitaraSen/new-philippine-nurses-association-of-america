"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AdvancedDataTable, type ColumnDef, type ColumnMeta } from "@/components/shared/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { AppEvent as Attendee } from "@/types/attendee";

type AttendeeRow = Attendee & { id: string };

export function AttendeeList({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Track whether this effect invocation is still current so strict-mode's
  // double-invoke doesn't apply a stale fetch after the component moves on.
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    setLoading(true);

    getDocs(query(collection(db, "events", eventId, "attendees")))
      .then((snapshot) => {
        if (!activeRef.current) return;
        setRows(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as AttendeeRow));
      })
      .finally(() => {
        if (activeRef.current) setLoading(false);
      });

    return () => { activeRef.current = false; };
  }, [eventId]);

  // Map registrationId -> name for resolving attendee names
  const registrationNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.registrationId, row.name);
    }
    return map;
  }, [rows]);

  const columns: ColumnDef<AttendeeRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
        enableSorting: true,
        meta: { filterType: "text" } satisfies ColumnMeta,
        cell: ({ row }) => (
          <a
            href={`https://mypnaa.org/admin/contacts/details/?contactId=${row.original.contactId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-primary hover:underline"
          >
            {row.original.name || "—"}
          </a>
        ),
      },
      {
        accessorKey: "Type",
        header: "Registration Type",
        size: 90,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {row.original.registrationType || "—"}
          </span>
        ),
      },
      {
        accessorKey: "Status",
        header: "Payment",
        size: 100,
        enableSorting: true,
        filterFn: "equals",
        meta: {
          filterType: "select",
          filterOptions: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        } satisfies ColumnMeta,
        accessorFn: (row) => String(row.isPaid),
        cell: ({ row }) =>
          row.original.isPaid ? (
            row.original.registrationFee == 0 ? (
                <Badge variant="outline" className="text-xs text-muted-foreground border-muted bg-muted/50">
                  Free
                </Badge>
            ):(
            <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50 dark:bg-green-950/30">
              Paid in Full - ${row.original.paidSum.toFixed(2)}
            </Badge>
            )
          ) : (
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              ${ (row.original.registrationFee - row.original.paidSum).toFixed(2)} Due
            </Badge>
          ),
      },
    ],
    [registrationNames]
  );

  return (
    <AdvancedDataTable<AttendeeRow>
      columns={columns}
      data={rows}
      loading={loading}
      emptyTitle="No attendees"
      emptyDescription="No registrations found for this event"
      emptyIcon={Users}
      defaultPageSize={15}
      exportFilename={`PNAA_${eventId}_attendees`}
    />
  );
}
