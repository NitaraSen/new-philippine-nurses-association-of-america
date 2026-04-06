import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getWAToken, getWAAccountId } from "./wa-utils";

const WEBHOOK_SECRET = defineString("WEBHOOK_SECRET");

// HTTP endpoint for manually triggering a full event sync.
// Real-time event inserts, updates, and soft-deletes are handled by the
// wildApricotWebhook function.
// Call with: POST /syncEvents?key=[WEBHOOK_SECRET]
export const syncEvents = onRequest(
  { timeoutSeconds: 300 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const key = req.query["key"] as string | undefined;
    if (!key || key !== WEBHOOK_SECRET.value()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const db = getFirestore();
    const accessToken = await getWAToken();
    const accountId = getWAAccountId();

    // Paginate through all WA events (stop when page < PAGE_SIZE = last page)
    const PAGE_SIZE = 100;
    let skip = 0;
    const allWAEvents: Record<string, unknown>[] = [];

    while (true) {
      const url =
        `https://api.wildapricot.org/v2/accounts/${accountId}/events` +
        `?$top=${PAGE_SIZE}&$skip=${skip}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `WA events fetch failed at skip=${skip}: ${response.statusText}`
        );
        break;
      }

      const data = await response.json();

      // WA events API may return a plain array or { Events: [...] }
      if (Array.isArray(data)) {
        allWAEvents.push(...(data as Record<string, unknown>[]));
        break;
      }

      const events: Record<string, unknown>[] = data.Events || [];
      if (events.length === 0) break;

      allWAEvents.push(...events);
      skip += events.length;
      if (events.length < PAGE_SIZE) break; // last page
    }

    // Load all existing event IDs from Firestore in one query (avoids N reads in the loop)
    const existingSnapshot = await db.collection("events").get();
    const existingIds = new Set(existingSnapshot.docs.map((doc) => doc.id));

    // Batch write only new events (INSERT ONLY — never overwrite existing)
    let batch = db.batch();
    let batchCount = 0;
    let added = 0;
    let skipped = 0;

    for (const event of allWAEvents) {
      const eventId = String(event.Id);

      if (existingIds.has(eventId)) {
        skipped++;
        continue;
      }

      const startDate = event.StartDate
        ? String(event.StartDate).split("T")[0]
        : "";
      const endDate = event.EndDate
        ? String(event.EndDate).split("T")[0]
        : startDate;

      const eventData = {
        id: eventId,
        name: event.Name || "",
        startDate,
        endDate,
        location: event.Location || "",
        chapter: "",
        region: "National",
        archived: false,
        about: "",
        startTime: "",
        endTime: "",
        eventPoster: { name: "", ref: "", downloadURL: "" },
        attendees: 0,
        volunteers: 0,
        participantsServed: 0,
        contactHours: 0,
        volunteerHours: 0,
        source: "wildapricot",
        lastUpdatedUser: "WildApricot",
        lastUpdated: Timestamp.now(),
        creationDate: Timestamp.now(),
      };

      const docRef = db.collection("events").doc(eventId);
      batch.set(docRef, eventData);
      batchCount++;
      added++;

      if (batchCount === 450) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`syncEvents: ${added} new events added, ${skipped} skipped (already exist)`);

    // Fields used for diffing attendee docs — add new fields here to include them in future comparisons
    const FIELDS_TO_COMPARE: (keyof typeof emptyAttendee)[] = [
      "registrationId", "eventId", "contactId", "name",
      "registrationTypeId", "registrationType", "organization",
      "isPaid", "registrationFee", "paidSum", "OnWaitlist", "Status",
    ];
    const emptyAttendee = {
      registrationId: "", eventId: "", contactId: "", name: "",
      registrationTypeId: "", registrationType: "", organization: "",
      isPaid: false, registrationFee: 0, paidSum: 0, OnWaitlist: false, Status: "",
    };

    let attendeeBatch = db.batch();
    let attendeeBatchCount = 0;
    let totalAttendees = 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;

    for (const event of allWAEvents) {
      const eventId = String(event.Id);
      const eventRef = db.collection("events").doc(eventId);

      // Paginate through all registrations for this event
      const REG_PAGE_SIZE = 100;
      let regSkip = 0;
      const allRegistrations: Record<string, unknown>[] = [];
      let regFetchFailed = false;

      while (true) {
        const regUrl =
          `https://api.wildapricot.org/v2.1/Accounts/${accountId}/eventregistrations` +
          `?eventId=${eventId}&$top=${REG_PAGE_SIZE}&$skip=${regSkip}`;

        const regResponse = await fetch(regUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        if (!regResponse.ok) {
          console.error(`Registrations fetch failed for event ${eventId} at skip=${regSkip}: ${regResponse.statusText}`);
          regFetchFailed = true;
          break;
        }

        const regData = await regResponse.json();
        const page: Record<string, unknown>[] = Array.isArray(regData)
          ? regData
          : (regData.Registrations ?? []);

        allRegistrations.push(...page);
        regSkip += page.length;
        if (page.length < REG_PAGE_SIZE) break;
      }

      // Skip diffing this event if the fetch failed — preserve existing attendees
      if (regFetchFailed) continue;

      // Build a Map of incoming WA registrations keyed by registrationId
      const waMap = new Map<string, typeof emptyAttendee>();
      for (const reg of allRegistrations) {
        const contact = (reg.Contact ?? {}) as Record<string, unknown>;
        const regEvent = (reg.Event ?? {}) as Record<string, unknown>;
        const regType = (reg.RegistrationType ?? {}) as Record<string, unknown>;

        const registrationId = String(reg.Id ?? "");
        const contactId = String(contact.Id ?? "");
        const guestReg = Boolean(reg.IsGuestRegistration ?? false);
        if (!registrationId || !contactId) continue;

        waMap.set(registrationId, {
          registrationId,
          eventId: String(regEvent.Id ?? ""),
          contactId,
          name: String(reg.DisplayName ?? ""),
          registrationTypeId: String(regType.Id ?? ""),
          registrationType: String(regType.Name ?? ""),
          organization: String(reg.Organization ?? ""),
          isPaid: Boolean(reg.IsPaid ?? false),
          registrationFee: Number(reg.RegistrationFee ?? 0),
          paidSum: Number(reg.PaidSum ?? 0),
          OnWaitlist: Boolean(reg.OnWaitlist ?? false),
          Status: String(reg.Status ?? ""),
        });
      }

      // Read existing attendees from Firestore into a Map
      const existingSnap = await eventRef.collection("attendees").get();
      const existingMap = new Map<string, Record<string, unknown>>();
      for (const doc of existingSnap.docs) {
        existingMap.set(doc.id, doc.data());
      }

      // Diff: add new, update changed, delete removed
      for (const [id, incoming] of waMap) {
        const existing = existingMap.get(id);
        if (!existing) {
          // New registration
          attendeeBatch.set(eventRef.collection("attendees").doc(id), incoming);
          attendeeBatchCount++;
          totalAdded++;
          totalAttendees++;
        } else {
          // Check if any field changed
          const hasChanged = FIELDS_TO_COMPARE.some(
            (field) => incoming[field] !== existing[field]
          );
          if (hasChanged) {
            attendeeBatch.set(eventRef.collection("attendees").doc(id), incoming);
            attendeeBatchCount++;
            totalUpdated++;
          }
          totalAttendees++;
        }

        if (attendeeBatchCount === 450) {
          await attendeeBatch.commit();
          attendeeBatch = db.batch();
          attendeeBatchCount = 0;
        }
      }

      for (const [id] of existingMap) {
        if (!waMap.has(id)) {
          attendeeBatch.delete(eventRef.collection("attendees").doc(id));
          attendeeBatchCount++;
          totalDeleted++;

          if (attendeeBatchCount === 450) {
            await attendeeBatch.commit();
            attendeeBatch = db.batch();
            attendeeBatchCount = 0;
          }
        }
      }

      // Always update attendees count on the event doc
      attendeeBatch.update(eventRef, {
        attendees: waMap.size,
        lastUpdated: Timestamp.now(),
        lastUpdatedUser: "WildApricot",
      });
      attendeeBatchCount++;

      if (attendeeBatchCount === 450) {
        await attendeeBatch.commit();
        attendeeBatch = db.batch();
        attendeeBatchCount = 0;
      }
    }

    if (attendeeBatchCount > 0) {
      await attendeeBatch.commit();
    }

    const msg =
      `syncEvents: ${added} new events added, ${skipped} skipped; ` +
      `attendees: ${totalAdded} added, ${totalUpdated} updated, ${totalDeleted} deleted ` +
      `(${totalAttendees} total across ${allWAEvents.length} events)`;
    console.log(msg);
    res.status(200).send(msg);
  }
);
