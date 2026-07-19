import { ReviewModel, IReview, TargetType } from "../models/Review.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  targetId?: string;
  targetType?: TargetType;
  rating?: number;
  approved?: string;
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

  if (opts.targetId) {
    andConditions.push({ targetId: opts.targetId });
  }

  if (opts.targetType) {
    andConditions.push({ targetType: opts.targetType });
  }

  if (opts.rating) {
    andConditions.push({ rating: opts.rating });
  }

  if (opts.approved === "true") {
    andConditions.push({ isApproved: true });
  } else if (opts.approved === "false") {
    andConditions.push({ isApproved: false });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

export async function getAllReviews(opts: QueryOptions): Promise<PaginatedResult<IReview>> {
  const filter = buildFilter(opts);
  const total = await ReviewModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const data = await ReviewModel.find(filter)
    .populate("reviewerId", "name email avatar")
    .sort({ createdAt: -1 })
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

export async function getReviewById(id: string): Promise<IReview | null> {
  return ReviewModel.findById(id).populate("reviewerId", "name email avatar").lean();
}

export async function createReview(data: Partial<IReview>): Promise<IReview> {
  return ReviewModel.create(data);
}

export async function updateReview(
  id: string,
  data: Partial<IReview>
): Promise<IReview | null> {
  return ReviewModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function deleteReview(id: string): Promise<IReview | null> {
  return ReviewModel.findByIdAndDelete(id).lean();
}

export async function getReviewsByTarget(
  targetType: TargetType,
  targetId: string,
  page: number,
  limit: number
): Promise<PaginatedResult<IReview>> {
  const filter = { targetId: targetId as any, targetType, isApproved: true };
  const total = await ReviewModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await ReviewModel.find(filter)
    .populate("reviewerId", "name email avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function approveReview(id: string): Promise<IReview | null> {
  return ReviewModel.findByIdAndUpdate(
    id,
    { $set: { isApproved: true } },
    { new: true, runValidators: true }
  ).lean();
}

export async function getAverageRating(targetId: string, targetType: TargetType): Promise<number> {
  const result = await ReviewModel.aggregate([
    { $match: { targetId: targetId as any, targetType, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);
  return result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
}
