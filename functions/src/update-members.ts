import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { chapterSlug } from "./wa-utils";

export const updateMembers = onSchedule(
  { schedule: "every day 02:00", timeZone: "America/New_York" },
  async () => {
    const db = getFirestore();
    // Use YYYY-MM-DD string — matches the stored renewalDueDate format
    const today = new Date().toISOString().split("T")[0];

    // Only read Active members whose renewal date has already passed.
    // Lapsed → Active transitions are handled in real-time by the WA webhook
    // (Membership / MembershipRenewed events), so we never need to query Lapsed members here.
    const lapsedSnap = await db
      .collection("members")
      .where("activeStatus", "==", "Active")
      .where("renewalDueDate", "<", today)
      .get();

    if (lapsedSnap.empty) {
      console.log("updateMembers: no status changes needed");
      return;
    }

    // Tally lapses per chapter so we can update aggregates via increments
    // (avoids re-reading any member documents for chapter recalculation)
    const chapterLapseCounts: Record<string, number> = {};
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of lapsedSnap.docs) {
      batch.update(doc.ref, { activeStatus: "Lapsed" });
      batchCount++;

      const chapterName = doc.data().chapterName as string | undefined;
      if (chapterName) {
        chapterLapseCounts[chapterName] = (chapterLapseCounts[chapterName] || 0) + 1;
      }

      if (batchCount === 450) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) await batch.commit();

    console.log(
      `updateMembers: ${lapsedSnap.size} members lapsed across ` +
        `${Object.keys(chapterLapseCounts).length} chapters`
    );

    // Increment/decrement chapter aggregates — no member re-reads required
    const chapterBatch = db.batch();
    for (const [chapterName, lapseCount] of Object.entries(chapterLapseCounts)) {
      const chapterRef = db.collection("chapters").doc(chapterSlug(chapterName));
      chapterBatch.update(chapterRef, {
        totalActive: FieldValue.increment(-lapseCount),
        totalLapsed: FieldValue.increment(lapseCount),
        lastUpdated: Timestamp.now(),
      });
    }

    await chapterBatch.commit();
    console.log(`updateMembers: updated ${Object.keys(chapterLapseCounts).length} chapters`);
  }
);
