import { usersCol, toObjectId } from "../db/collections.js";
import type { IUser, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.search) {
    conditions.push(regexSearch(["name", "email"], opts.search));
  }
  if (opts.role) {
    conditions.push({ role: opts.role });
  }

  return andFilter(conditions);
}

export async function getAllUsers(opts: QueryOptions): Promise<PaginatedResult<IUser>> {
  const filter = buildFilter(opts);
  const col = usersCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);

  const data = await col.find(filter)
    .sort({ createdAt: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  return { data, pagination };
}

export async function updateUser(id: string, data: Record<string, unknown>): Promise<IUser | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  return usersCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
}

export async function getPatientsForDoctor(doctorId: string): Promise<IUser[]> {
  const reviewsCol = (await import("../db/collections.js")).reviewsCol;
  const reviews = await reviewsCol().find({ targetId: doctorId, targetType: "Doctor" }).toArray();
  const patientIds = [...new Set(reviews.map((r) => r.reviewerId.toString()))].filter(Boolean);
  if (patientIds.length === 0) return [];
  const patients = await usersCol()
    .find({ _id: { $in: patientIds.map((id) => toObjectId(id)) } })
    .project({ name: 1, email: 1, avatar: 1, dob: 1, bloodGroup: 1 })
    .toArray() as unknown as IUser[];
  return patients;
}
