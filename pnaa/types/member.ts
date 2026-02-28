import { Timestamp } from "firebase/firestore";

export interface Member {
  name: string;
  email: string;
  membershipLevel: string;
  renewalDueDate: string;
  chapterName: string;
  highestEducation: string;
  memberId: string;
  region: string;
  activeStatus: "Active" | "Lapsed";
  lastSynced: Timestamp;
}
