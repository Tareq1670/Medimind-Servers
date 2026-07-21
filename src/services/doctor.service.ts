import { ObjectId } from "mongodb";
import { doctorsCol, usersCol, toObjectId } from "../db/collections.js";
import type { IDoctor, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  specialty?: string;
  minFee?: number;
  maxFee?: number;
  verified?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: string;
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.search) {
    conditions.push(regexSearch(["specialty", "bio", "hospitalAffiliation"], opts.search));
  }
  if (opts.specialty) {
    conditions.push({ specialty: opts.specialty });
  }
  if (opts.minFee !== undefined || opts.maxFee !== undefined) {
    const feeFilter: Record<string, unknown> = {};
    if (opts.minFee !== undefined) feeFilter.$gte = opts.minFee;
    if (opts.maxFee !== undefined) feeFilter.$lte = opts.maxFee;
    conditions.push({ consultationFee: feeFilter });
  }
  if (opts.minRating !== undefined) {
    conditions.push({ rating: { $gte: opts.minRating } });
  }
  if (opts.verified === "true") {
    conditions.push({ isVerified: true });
  } else if (opts.verified === "false") {
    conditions.push({ isVerified: false });
  }

  return andFilter(conditions);
}

async function attachUserInfo<T extends { userId?: ObjectId | string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const userIds = [...new Set(items.map((d) => d.userId?.toString()))].filter(Boolean);
  const userDocs = await usersCol().find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email, avatar: u.avatar }]));
  return items.map((d) => ({
    ...d,
    user: d.userId ? userMap.get(d.userId.toString()) : undefined,
  }));
}

export async function getAllDoctors(opts: QueryOptions): Promise<PaginatedResult<IDoctor>> {
  const filter = buildFilter(opts);
  const col = doctorsCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);

  const allowedSorts: Record<string, 1 | -1> = {
    consultationFee: 1,
    experienceYears: 1,
    createdAt: 1,
  };
  const sortField = opts.sortBy && opts.sortBy in allowedSorts ? opts.sortBy : "createdAt";
  const sortDir = opts.sortOrder === "asc" ? 1 : -1;

  let data = await col.find(filter)
    .sort({ [sortField]: sortDir, isVerified: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  data = await attachUserInfo(data);
  return { data, pagination };
}

export async function getDoctorById(id: string): Promise<IDoctor | null> {
  const doc = await doctorsCol().findOne({ _id: toObjectId(id) });
  if (doc) {
    const attached = await attachUserInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function getDoctorByUserId(userId: string): Promise<IDoctor | null> {
  const doc = await doctorsCol().findOne({ userId: toObjectId(userId) });
  if (doc) {
    const attached = await attachUserInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function createDoctor(data: Record<string, unknown>): Promise<IDoctor> {
  const doc: IDoctor = {
    userId: typeof data.userId === "string" ? toObjectId(data.userId as string) : data.userId as ObjectId,
    specialty: data.specialty as string,
    experienceYears: Number(data.experienceYears) || 0,
    hospitalAffiliation: data.hospitalAffiliation as string,
    bio: data.bio as string,
    consultationFee: Number(data.consultationFee) || 0,
    availabilitySlots: (data.availabilitySlots as IDoctor["availabilitySlots"]) || [],
    isVerified: Boolean(data.isVerified),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await doctorsCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateDoctor(id: string, data: Record<string, unknown>): Promise<IDoctor | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  const doc = await doctorsCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
  if (doc) {
    const attached = await attachUserInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function deleteDoctor(id: string): Promise<IDoctor | null> {
  return doctorsCol().findOneAndDelete({ _id: toObjectId(id) });
}
