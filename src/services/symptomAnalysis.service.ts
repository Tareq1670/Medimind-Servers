import { SymptomAnalysisModel, ISymptomAnalysis } from "../models/SymptomAnalysis.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  patientId?: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (opts.patientId) {
    filter.patientId = opts.patientId;
  }
  return filter;
}

export async function getAllAnalyses(
  opts: QueryOptions & { userId?: string; isAdmin?: boolean }
): Promise<PaginatedResult<ISymptomAnalysis>> {
  const filter = buildFilter(opts);

  if (!opts.isAdmin && opts.userId) {
    const userFilter = { ...filter, patientId: opts.userId };
    const total = await SymptomAnalysisModel.countDocuments(userFilter);
    const totalPages = Math.ceil(total / opts.limit) || 1;
    const data = await SymptomAnalysisModel.find(userFilter)
      .populate("patientId", "name email")
      .sort({ timestamp: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .lean();
    return {
      data,
      pagination: { page: opts.page, limit: opts.limit, total, totalPages, hasNextPage: opts.page < totalPages, hasPrevPage: opts.page > 1 },
    };
  }

  const total = await SymptomAnalysisModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;
  const data = await SymptomAnalysisModel.find(filter)
    .populate("patientId", "name email")
    .sort({ timestamp: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .lean();
  return { data, pagination: { page: opts.page, limit: opts.limit, total, totalPages, hasNextPage: opts.page < totalPages, hasPrevPage: opts.page > 1 } };
}

export async function getAnalysisById(id: string): Promise<ISymptomAnalysis | null> {
  return SymptomAnalysisModel.findById(id).populate("patientId", "name email").lean();
}

export async function createAnalysis(data: Partial<ISymptomAnalysis>): Promise<ISymptomAnalysis> {
  return SymptomAnalysisModel.create(data);
}

export async function updateAnalysis(
  id: string,
  data: Partial<ISymptomAnalysis>
): Promise<ISymptomAnalysis | null> {
  return SymptomAnalysisModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function deleteAnalysis(id: string): Promise<ISymptomAnalysis | null> {
  return SymptomAnalysisModel.findByIdAndDelete(id).lean();
}
