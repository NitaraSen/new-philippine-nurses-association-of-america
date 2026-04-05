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

    // Fetch registrations for every event and write to attendees subcollection

    //TODO: link to users
    //TODO: handle updates/deletes (currently only adds new registrations, but doesn't remove old ones if they were deleted in WA)
    let attendeeBatch = db.batch();
    let attendeeBatchCount = 0;
    let totalAttendees = 0;

    for (const event of allWAEvents) {
      const eventId = String(event.Id);

       // Fetch registrations for this event (authentication included)
      const regUrl =
        `https://api.wildapricot.org/v2.1/Accounts/${accountId}/eventregistrations` +
        `?eventId=${eventId}`;

     
      const regResponse = await fetch(regUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!regResponse.ok) {
        console.error(`Registrations fetch failed for event ${eventId}: ${regResponse.statusText}`);
        continue;
      }

      // WA event registrations API may return a plain array or { Registrations: [...] }
      const regData = await regResponse.json();
      const registrations: Record<string, unknown>[] = Array.isArray(regData)
        ? regData
        : (regData.Registrations ?? []);

      const eventRef = db.collection("events").doc(eventId);


      // Delete existing attendees subcollection docs (full replace)
     
      // NOTE: this will cause additional reads, but ensures that registrations
      // are consistent with Wild Apricot (for deleltes/changes)
      // Potential improvement: instead of full replace, do diff and only update 
      // changed/new/deleted registrations (more complex but saves reads/writes)

      const existingAttendees = await eventRef.collection("attendees").get();
      for (const doc of existingAttendees.docs) {
        attendeeBatch.delete(doc.ref);
        attendeeBatchCount++;
        if (attendeeBatchCount === 450) {
          await attendeeBatch.commit();
          attendeeBatch = db.batch();
          attendeeBatchCount = 0;
        }
      }

      // Write new attendee docs for this event
      for (const reg of registrations) {
        const contact = (reg.Contact ?? {}) as Record<string, unknown>;
        const contactId = String(contact.Id ?? "");
        if (!contactId) continue;

        attendeeBatch.set(eventRef.collection("attendees").doc(contactId), {
          contactId,
          memberId: null,
          name: String(contact.Name ?? ""),
        });
        attendeeBatchCount++;
        totalAttendees++;

        // Commit in batches of 450 to avoid Firestore limits
        if (attendeeBatchCount === 450) {
          await attendeeBatch.commit();
          attendeeBatch = db.batch();
          attendeeBatchCount = 0;
        }
      }

      // Update attendees count on the event doc
      attendeeBatch.update(eventRef, {
        attendees: registrations.length,
        lastUpdated: Timestamp.now(),
        lastUpdatedUser: "WildApricot",
      });
      attendeeBatchCount++;

      // Commit in batches of 450 to avoid Firestore limits
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
      `${totalAttendees} attendees written across ${allWAEvents.length} events`;
    console.log(msg);
    res.status(200).send(msg);
  }
);
