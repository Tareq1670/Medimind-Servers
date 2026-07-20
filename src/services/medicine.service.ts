import { ObjectId } from "mongodb";
import { medicinesCol, toObjectId } from "../db/collections.js";
import type { IMedicine, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  prescription?: string;
  sortBy?: string;
  sortOrder?: string;
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.search) {
    conditions.push(regexSearch(["name", "genericName", "description"], opts.search));
  }
  if (opts.category) {
    conditions.push({ category: opts.category });
  }
  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    const priceFilter: Record<string, unknown> = {};
    if (opts.minPrice !== undefined) priceFilter.$gte = opts.minPrice;
    if (opts.maxPrice !== undefined) priceFilter.$lte = opts.maxPrice;
    conditions.push({ price: priceFilter });
  }
  if (opts.prescription === "true") {
    conditions.push({ isPrescriptionRequired: true });
  } else if (opts.prescription === "false") {
    conditions.push({ isPrescriptionRequired: false });
  }

  return andFilter(conditions);
}

export async function getAllMedicines(opts: QueryOptions): Promise<PaginatedResult<IMedicine>> {
  const filter = buildFilter(opts);
  const col = medicinesCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);

  const allowedSorts: Record<string, 1 | -1> = { name: 1, price: 1, rating: 1, createdAt: 1 };
  const sortField = opts.sortBy && opts.sortBy in allowedSorts ? opts.sortBy : "createdAt";
  const sortDir = opts.sortOrder === "asc" ? 1 : -1;

  const data = await col.find(filter)
    .sort({ [sortField]: sortDir })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  return { data, pagination };
}

export async function getMedicineById(id: string): Promise<IMedicine | null> {
  return medicinesCol().findOne({ _id: toObjectId(id) });
}

export async function createMedicine(data: Record<string, unknown>): Promise<IMedicine> {
  const doc: IMedicine = {
    name: data.name as string,
    genericName: data.genericName as string,
    category: data.category as string,
    manufacturer: data.manufacturer as string,
    price: Number(data.price) || 0,
    stockQuantity: Number(data.stockQuantity) || 0,
    description: data.description as string,
    image: data.image as string | undefined,
    isPrescriptionRequired: Boolean(data.isPrescriptionRequired),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await medicinesCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateMedicine(id: string, data: Record<string, unknown>): Promise<IMedicine | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  return medicinesCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
}

export async function deleteMedicine(id: string): Promise<IMedicine | null> {
  return medicinesCol().findOneAndDelete({ _id: toObjectId(id) });
}

export async function searchMedicines(query: string, page: number, limit: number): Promise<PaginatedResult<IMedicine>> {
  const filter = regexSearch(["name", "genericName", "description"], query);
  const col = medicinesCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, { page, limit });
  const data = await col.find(filter)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  return { data, pagination };
}

export async function getCategories(): Promise<string[]> {
  const result = await medicinesCol().aggregate([
    { $group: { _id: "$category" } },
    { $sort: { _id: 1 } },
  ]).toArray();
  return result.map((r) => r._id as string);
}

export async function getFeaturedMedicines(limit = 8): Promise<IMedicine[]> {
  return medicinesCol().find({ stockQuantity: { $gte: 50 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
