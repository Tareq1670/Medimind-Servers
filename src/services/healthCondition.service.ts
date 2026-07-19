import { HealthConditionModel, IHealthCondition } from "../models/HealthCondition.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  severity?: "Low" | "Medium" | "High";
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

  if (opts.search) {
    andConditions.push({
      $or: [
        { title: { $regex: opts.search, $options: "i" } },
        { description: { $regex: opts.search, $options: "i" } },
        { symptoms: { $regex: opts.search, $options: "i" } },
      ],
    });
  }

  if (opts.severity) {
    andConditions.push({ severity: opts.severity });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

export async function getAllConditions(
  opts: QueryOptions
): Promise<PaginatedResult<IHealthCondition>> {
  const filter = buildFilter(opts);
  const total = await HealthConditionModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const data = await HealthConditionModel.find(filter)
    .sort({ severity: 1, title: 1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .lean();

  return {
    data,
    pagination: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages,
      hasNextPage: opts.page < totalPages,
      hasPrevPage: opts.page > 1,
    },
  };
}

export async function getConditionById(id: string): Promise<IHealthCondition | null> {
  return HealthConditionModel.findById(id).lean();
}

export async function createCondition(
  data: Partial<IHealthCondition>
): Promise<IHealthCondition> {
  return HealthConditionModel.create(data);
}

export async function updateCondition(
  id: string,
  data: Partial<IHealthCondition>
): Promise<IHealthCondition | null> {
  return HealthConditionModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function deleteCondition(id: string): Promise<IHealthCondition | null> {
  return HealthConditionModel.findByIdAndDelete(id).lean();
}
