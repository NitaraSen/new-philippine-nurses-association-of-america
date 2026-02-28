import {
  collection,
  doc,
  getDoc as firestoreGetDoc,
  getDocs as firestoreGetDocs,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint,
  type DocumentData,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Member } from "@/types/member";
import type { Chapter } from "@/types/chapter";
import type { AppEvent } from "@/types/event";
import type { FundraisingCampaign } from "@/types/fundraising";
import type { AppUser } from "@/types/user";

// Collection references
export const membersRef = collection(db, "members");
export const chaptersRef = collection(db, "chapters");
export const eventsRef = collection(db, "events");
export const fundraisingRef = collection(db, "fundraising");
export const usersRef = collection(db, "users");

// Typed document getter
export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await firestoreGetDoc(docRef);
  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), id: docSnap.id } as T;
}

// Typed collection query
export async function queryCollection<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);
  const snapshot = await firestoreGetDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
}

// Add document
export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const ref = collection(db, collectionName);
  const docRef = await firestoreAddDoc(ref, {
    ...data,
    creationDate: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });
  return docRef.id;
}

// Update document
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await firestoreUpdateDoc(docRef, {
    ...data,
    lastUpdated: serverTimestamp(),
  });
}

// Soft delete (archive)
export async function archiveDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  await updateDocument(collectionName, docId, { archived: true });
}

// Re-export query helpers for convenience
export { query, where, orderBy, limit, Timestamp, serverTimestamp };

// Type re-exports for convenience
export type { Member, Chapter, AppEvent, FundraisingCampaign, AppUser };
