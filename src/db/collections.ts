import { Collection, Document } from "mongodb";
import { getDB } from "../config/db.js";

export enum CollectionName {
  USERS = "users",
  MEDICINES = "medicines",
  DOCTORS = "doctors",
  CONDITIONS = "conditions",
  BLOGS = "blogs",
  REVIEWS = "reviews",
  CHAT_SESSIONS = "chat_sessions",
  REPORT_ANALYSES = "report_analyses",
  HEALTH_RECORDS = "health_records",
  SYMPTOM_ANALYSES = "symptom_analyses",
}

export function getCollection<T extends Document>(name: CollectionName): Collection<T> {
  return getDB().collection<T>(name);
}
