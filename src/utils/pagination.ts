import type { PaginatedResult } from "../types/models.js";

export interface QueryOpts {
  page: number;
  limit: number;
}

export async function paginate<T>(
  total: number,
  opts: QueryOpts
): Promise<Pick<PaginatedResult<T>, "pagination">> {
  const totalPages = Math.ceil(total / opts.limit) || 1;
  return {
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

export function andFilter(conditions: Record<string, unknown>[]): Record<string, unknown> {
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

export function regexSearch(fields: string[], query: string): Record<string, unknown> {
  return {
    $or: fields.map((f) => ({ [f]: { $regex: query, $options: "i" } })),
  };
}
