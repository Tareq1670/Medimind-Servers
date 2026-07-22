import { ObjectId } from "mongodb";
import { reportAnalysesCol, usersCol, toObjectId } from "../db/collections.js";
import type { IReportAnalysis, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  reportType?: string;
  patientId?: string;
  search?: string;
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.reportType) {
    conditions.push({ reportType: opts.reportType });
  }
  if (opts.patientId) {
    conditions.push({ patientId: opts.patientId });
  }
  if (opts.search) {
    conditions.push(regexSearch(["reportName", "analysisSummary", "aiDoctorNotes"], opts.search));
  }

  return andFilter(conditions);
}

async function attachPatientInfo<T extends { patientId?: ObjectId | string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const ids = [...new Set(items.map((r) => r.patientId?.toString()))].filter(Boolean);
  if (ids.length === 0) return items;
  const userDocs = await usersCol().find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email }]));
  return items.map((d) => ({
    ...d,
    patient: d.patientId ? userMap.get(d.patientId.toString()) : undefined,
  }));
}

export async function getAllReports(
  opts: QueryOptions & { userId?: string; isAdmin?: boolean }
): Promise<PaginatedResult<IReportAnalysis>> {
  const filter = buildFilter(opts);
  if (!opts.isAdmin && opts.userId) filter.patientId = opts.userId;

  const col = reportAnalysesCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);
  let data = await col.find(filter)
    .sort({ createdAt: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  data = await attachPatientInfo(data);
  return { data, pagination };
}

export async function getReportById(id: string): Promise<IReportAnalysis | null> {
  const doc = await reportAnalysesCol().findOne({ _id: toObjectId(id) });
  if (doc) {
    const attached = await attachPatientInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function createReport(data: Record<string, unknown>): Promise<IReportAnalysis> {
  const now = new Date();
  const doc: IReportAnalysis = {
    patientId: toObjectId(data.patientId as string),
    reportName: data.reportName as string | undefined,
    reportType: data.reportType as string,
    uploadedImageUrl: data.uploadedImageUrl as string | undefined,
    originalText: data.originalText as string | undefined,
    structuredData: data.structuredData as Record<string, unknown> | undefined,
    analysisSummary: data.analysisSummary as string | undefined,
    aiDoctorNotes: data.aiDoctorNotes as string | undefined,
    aiAnalysis: data.aiAnalysis as IReportAnalysis["aiAnalysis"],
    createdAt: now,
    updatedAt: now,
  };
  const result = await reportAnalysesCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateReport(id: string, data: Record<string, unknown>): Promise<IReportAnalysis | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  return reportAnalysesCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
}

export async function deleteReport(id: string): Promise<IReportAnalysis | null> {
  return reportAnalysesCol().findOneAndDelete({ _id: toObjectId(id) });
}
