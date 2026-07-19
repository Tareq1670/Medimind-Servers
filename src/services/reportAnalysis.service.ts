import { ReportAnalysisModel, IReportAnalysis } from "../models/ReportAnalysis.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  reportType?: string;
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
  const andConditions: Record<string, unknown>[] = [];

  if (opts.reportType) {
    andConditions.push({ reportType: opts.reportType });
  }

  if (opts.patientId) {
    andConditions.push({ patientId: opts.patientId });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

export async function getAllReports(
  opts: QueryOptions & { userId?: string; isAdmin?: boolean }
): Promise<PaginatedResult<IReportAnalysis>> {
  const filter = buildFilter(opts);

  if (!opts.isAdmin && opts.userId) {
    const userFilter = { ...filter, patientId: opts.userId };
    const total = await ReportAnalysisModel.countDocuments(userFilter);
    const totalPages = Math.ceil(total / opts.limit) || 1;
    const data = await ReportAnalysisModel.find(userFilter)
      .populate("patientId", "name email")
      .sort({ createdAt: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .lean();
    return {
      data,
      pagination: { page: opts.page, limit: opts.limit, total, totalPages, hasNextPage: opts.page < totalPages, hasPrevPage: opts.page > 1 },
    };
  }

  const total = await ReportAnalysisModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;
  const data = await ReportAnalysisModel.find(filter)
    .populate("patientId", "name email")
    .sort({ createdAt: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .lean();
  return { data, pagination: { page: opts.page, limit: opts.limit, total, totalPages, hasNextPage: opts.page < totalPages, hasPrevPage: opts.page > 1 } };
}

export async function getReportById(id: string): Promise<IReportAnalysis | null> {
  return ReportAnalysisModel.findById(id).populate("patientId", "name email").lean();
}

export async function createReport(data: Partial<IReportAnalysis>): Promise<IReportAnalysis> {
  return ReportAnalysisModel.create(data);
}

export async function updateReport(
  id: string,
  data: Partial<IReportAnalysis>
): Promise<IReportAnalysis | null> {
  return ReportAnalysisModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function deleteReport(id: string): Promise<IReportAnalysis | null> {
  return ReportAnalysisModel.findByIdAndDelete(id).lean();
}
