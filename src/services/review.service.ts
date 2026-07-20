import { ObjectId } from "mongodb";
import { reviewsCol, usersCol, toObjectId } from "../db/collections.js";
import type { IReview, TargetType, PaginatedResult } from "../types/models.js";
import { paginate, andFilter } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  targetId?: string;
  targetType?: TargetType;
  rating?: number;
  approved?: string;
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.targetId) {
    conditions.push({ targetId: opts.targetId });
  }
  if (opts.targetType) {
    conditions.push({ targetType: opts.targetType });
  }
  if (opts.rating) {
    conditions.push({ rating: opts.rating });
  }
  if (opts.approved === "true") {
    conditions.push({ isApproved: true });
  } else if (opts.approved === "false") {
    conditions.push({ isApproved: false });
  }

  return andFilter(conditions);
}

async function attachReviewerInfo<T extends { reviewerId?: ObjectId | string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const reviewerIds = [...new Set(items.map((r) => r.reviewerId?.toString()))].filter(Boolean);
  const userDocs = await usersCol().find({ _id: { $in: reviewerIds.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email, avatar: u.avatar }]));
  return items.map((d) => ({
    ...d,
    reviewer: d.reviewerId ? userMap.get(d.reviewerId.toString()) : undefined,
  }));
}

export async function getAllReviews(opts: QueryOptions): Promise<PaginatedResult<IReview>> {
  const filter = buildFilter(opts);
  const col = reviewsCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);
  let data = await col.find(filter)
    .sort({ createdAt: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  data = await attachReviewerInfo(data);
  return { data, pagination };
}

export async function getReviewById(id: string): Promise<IReview | null> {
  const doc = await reviewsCol().findOne({ _id: toObjectId(id) });
  if (doc) {
    const attached = await attachReviewerInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function createReview(data: Record<string, unknown>): Promise<IReview> {
  const doc: IReview = {
    reviewerId: toObjectId(data.reviewerId as string),
    targetId: data.targetId as string,
    targetType: data.targetType as TargetType,
    rating: Number(data.rating) || 5,
    comment: data.comment as string,
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await reviewsCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateReview(id: string, data: Record<string, unknown>): Promise<IReview | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  const doc = await reviewsCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
  if (doc) {
    const attached = await attachReviewerInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function deleteReview(id: string): Promise<IReview | null> {
  return reviewsCol().findOneAndDelete({ _id: toObjectId(id) });
}

export async function getReviewsByTarget(
  targetType: TargetType,
  targetId: string,
  page: number,
  limit: number
): Promise<PaginatedResult<IReview>> {
  const filter = { targetId, targetType, isApproved: true };
  const col = reviewsCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, { page, limit });
  let data = await col.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  data = await attachReviewerInfo(data);
  return { data, pagination };
}

export async function approveReview(id: string): Promise<IReview | null> {
  return reviewsCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { isApproved: true, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function getAverageRating(targetId: string, targetType: TargetType): Promise<number> {
  const result = await reviewsCol().aggregate([
    { $match: { targetId, targetType, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]).toArray();
  return result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
}
