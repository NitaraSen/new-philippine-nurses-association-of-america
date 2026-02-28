import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";
import type { EventPoster } from "@/types/event";

export async function uploadEventPoster(
  eventId: string,
  file: File
): Promise<EventPoster> {
  const filename = `poster_${Date.now()}_${file.name}`;
  const storagePath = `events/${eventId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    name: file.name,
    ref: storagePath,
    downloadURL,
  };
}

export async function deleteFile(refPath: string): Promise<void> {
  if (!refPath) return;
  const storageRef = ref(storage, refPath);
  await deleteObject(storageRef);
}

export async function getFileUrl(refPath: string): Promise<string> {
  const storageRef = ref(storage, refPath);
  return getDownloadURL(storageRef);
}
