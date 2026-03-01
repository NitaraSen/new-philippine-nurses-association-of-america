import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";

const WA_API_KEY = defineString("WILD_APRICOT_API_KEY");
const WA_ACCOUNT_ID = defineString("WILD_APRICOT_ACCOUNT_ID");

async function getWAToken(): Promise<string> {
  const credentials = Buffer.from(
    `APIKEY:${WA_API_KEY.value()}`
  ).toString("base64");

  const response = await fetch("https://oauth.wildapricot.org/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=auto",
  });

  if (!response.ok) throw new Error(`WA auth failed: ${response.statusText}`);
  const data = await response.json();
  return data.access_token;
}

function extractFieldValue(
  fieldValues: Array<{ FieldName: string; Value: unknown }>,
  fieldName: string
): string {
  const field = fieldValues.find((f) => f.FieldName === fieldName);
  if (!field || field.Value === null || field.Value === undefined) return "";
  if (
    typeof field.Value === "object" &&
    field.Value !== null &&
    "Label" in (field.Value as Record<string, unknown>)
  ) {
    return (field.Value as { Label: string }).Label;
  }
  return String(field.Value);
}

export const syncMembers = onSchedule(
  { schedule: "every 1 minutes", timeoutSeconds: 300 },
  async () => {
    const db = getFirestore();
    const accessToken = await getWAToken();
    const accountId = WA_ACCOUNT_ID.value();

    // Fetch contacts from WA (paginated via async result)
    const contactsUrl = `https://api.wildapricot.org/v2/accounts/${accountId}/contacts?$async=false`;
    const response = await fetch(contactsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`WA contacts fetch failed: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const contacts = data.Contacts || [];
    const batch = db.batch();
    let processed = 0;

    for (const contact of contacts) {
      const fieldValues = contact.FieldValues || [];
      const renewalDueDate = extractFieldValue(fieldValues, "Renewal due");

      const isActive = (() => {
        if (!renewalDueDate) return "Lapsed";
        const dueDate = new Date(renewalDueDate);
        return dueDate >= new Date() ? "Active" : "Lapsed";
      })();

      const memberId =
        extractFieldValue(fieldValues, "Member ID") || String(contact.Id);
      const memberData = {
        name: `${contact.FirstName || ""} ${contact.LastName || ""}`.trim(),
        email: contact.Email || "",
        membershipLevel: contact.MembershipLevel?.Name || "",
        renewalDueDate,
        chapterName: extractFieldValue(
          fieldValues,
          "Chapter (Active/Associate - 1 year)"
        ),
        highestEducation: extractFieldValue(
          fieldValues,
          "Highest Level of Education"
        ),
        memberId,
        region: extractFieldValue(fieldValues, "PNAA Region"),
        activeStatus: isActive,
        lastSynced: Timestamp.now(),
      };

      const docRef = db.collection("members").doc(memberId);
      batch.set(docRef, memberData, { merge: true });
      processed++;

      // Firestore batch limit is 500
      if (processed % 450 === 0) {
        await batch.commit();
      }
    }

    await batch.commit();
    console.log(`syncMembers: processed ${processed} contacts`);
  }
);
