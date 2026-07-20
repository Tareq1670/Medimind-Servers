import { Collection, ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import type {
  IUser, IMedicine, IDoctor, IHealthCondition, IBlog,
  IReview, IChatSession, IReportAnalysis, IHealthRecord, ISymptomAnalysis,
} from "../types/models.js";

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

export function usersCol(): Collection<IUser> {
  return getDB().collection<IUser>(CollectionName.USERS);
}

export function medicinesCol(): Collection<IMedicine> {
  return getDB().collection<IMedicine>(CollectionName.MEDICINES);
}

export function doctorsCol(): Collection<IDoctor> {
  return getDB().collection<IDoctor>(CollectionName.DOCTORS);
}

export function conditionsCol(): Collection<IHealthCondition> {
  return getDB().collection<IHealthCondition>(CollectionName.CONDITIONS);
}

export function blogsCol(): Collection<IBlog> {
  return getDB().collection<IBlog>(CollectionName.BLOGS);
}

export function reviewsCol(): Collection<IReview> {
  return getDB().collection<IReview>(CollectionName.REVIEWS);
}

export function chatSessionsCol(): Collection<IChatSession> {
  return getDB().collection<IChatSession>(CollectionName.CHAT_SESSIONS);
}

export function reportAnalysesCol(): Collection<IReportAnalysis> {
  return getDB().collection<IReportAnalysis>(CollectionName.REPORT_ANALYSES);
}

export function healthRecordsCol(): Collection<IHealthRecord> {
  return getDB().collection<IHealthRecord>(CollectionName.HEALTH_RECORDS);
}

export function symptomAnalysesCol(): Collection<ISymptomAnalysis> {
  return getDB().collection<ISymptomAnalysis>(CollectionName.SYMPTOM_ANALYSES);
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}
