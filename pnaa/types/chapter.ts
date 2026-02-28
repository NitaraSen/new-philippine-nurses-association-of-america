import { Timestamp } from "firebase/firestore";

export interface Chapter {
  name: string;
  region: string;
  totalMembers: number;
  totalActive: number;
  totalLapsed: number;
  lastUpdated: Timestamp;
}
