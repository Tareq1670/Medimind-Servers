import { ObjectId } from "mongodb";
import { symptomAnalysesCol, usersCol, toObjectId } from "../db/collections.js";
import type { ISymptomAnalysis, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  patientId?: string;
  search?: string;
}

async function attachPatientInfo<T extends { patientId?: ObjectId | string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const ids = [...new Set(items.map((s) => s.patientId?.toString()))].filter(Boolean);
  if (ids.length === 0) return items;
  const userDocs = await usersCol().find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email }]));
  return items.map((d) => ({
    ...d,
    patient: d.patientId ? userMap.get(d.patientId.toString()) : undefined,
  }));
}

export async function getAllAnalyses(
  opts: QueryOptions & { userId?: string; isAdmin?: boolean }
): Promise<PaginatedResult<ISymptomAnalysis>> {
  const conditions: Record<string, unknown>[] = [];
  if (opts.patientId) conditions.push({ patientId: opts.patientId });
  if (!opts.isAdmin && opts.userId) conditions.push({ patientId: opts.userId });
  if (opts.search) {
    conditions.push({
      $or: [
        { additionalInfo: { $regex: opts.search, $options: "i" } },
        { AI_Assessment_Result: { $regex: opts.search, $options: "i" } },
        { reportedSymptoms: { $regex: opts.search, $options: "i" } },
      ],
    });
  }
  const filter = andFilter(conditions);

  const col = symptomAnalysesCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);
  let data = await col.find(filter)
    .sort({ timestamp: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  data = await attachPatientInfo(data);
  return { data, pagination };
}

export async function getAnalysisById(id: string): Promise<ISymptomAnalysis | null> {
  const doc = await symptomAnalysesCol().findOne({ _id: toObjectId(id) });
  if (doc) {
    const attached = await attachPatientInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function createAnalysis(data: Record<string, unknown>): Promise<ISymptomAnalysis> {
  const doc: ISymptomAnalysis = {
    patientId: toObjectId(data.patientId as string),
    reportedSymptoms: (data.reportedSymptoms as string[]) || [],
    duration: data.duration as string | undefined,
    severity: data.severity as string | undefined,
    additionalInfo: data.additionalInfo as string | undefined,
    aiAnalysis: data.aiAnalysis as ISymptomAnalysis["aiAnalysis"],
    AI_Assessment_Result: data.AI_Assessment_Result as string | undefined,
    recommendedAction: data.recommendedAction as string | undefined,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await symptomAnalysesCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateAnalysis(id: string, data: Record<string, unknown>): Promise<ISymptomAnalysis | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  return symptomAnalysesCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
}

export async function deleteAnalysis(id: string): Promise<ISymptomAnalysis | null> {
  return symptomAnalysesCol().findOneAndDelete({ _id: toObjectId(id) });
}
