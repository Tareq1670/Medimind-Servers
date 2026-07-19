import { MedicineModel, IMedicine } from "../models/Medicine.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  prescription?: string;
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
        { name: { $regex: opts.search, $options: "i" } },
        { genericName: { $regex: opts.search, $options: "i" } },
        { description: { $regex: opts.search, $options: "i" } },
      ],
    });
  }

  if (opts.category) {
    andConditions.push({ category: opts.category });
  }

  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    const priceFilter: Record<string, unknown> = {};
    if (opts.minPrice !== undefined) priceFilter.$gte = opts.minPrice;
    if (opts.maxPrice !== undefined) priceFilter.$lte = opts.maxPrice;
    andConditions.push({ price: priceFilter });
  }

  if (opts.prescription === "true") {
    andConditions.push({ isPrescriptionRequired: true });
  } else if (opts.prescription === "false") {
    andConditions.push({ isPrescriptionRequired: false });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

export async function getAllMedicines(opts: QueryOptions): Promise<PaginatedResult<IMedicine>> {
  const filter = buildFilter(opts);
  const total = await MedicineModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const data = await MedicineModel.find(filter)
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

export async function getMedicineById(id: string): Promise<IMedicine | null> {
  return MedicineModel.findById(id).lean();
}

export async function createMedicine(data: Partial<IMedicine>): Promise<IMedicine> {
  return MedicineModel.create(data);
}

export async function updateMedicine(
  id: string,
  data: Partial<IMedicine>
): Promise<IMedicine | null> {
  return MedicineModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function deleteMedicine(id: string): Promise<IMedicine | null> {
  return MedicineModel.findByIdAndDelete(id).lean();
}

export async function searchMedicines(
  query: string,
  page: number,
  limit: number
): Promise<PaginatedResult<IMedicine>> {
  const filter = {
    $text: { $search: query },
  };
  const total = await MedicineModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await MedicineModel.find(filter)
    .sort({ score: { $meta: "textScore" } })
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

export async function getCategories(): Promise<string[]> {
  const result = await MedicineModel.aggregate([
    { $group: { _id: "$category" } },
    { $sort: { _id: 1 } },
  ]);
  return result.map((r) => r._id);
}

export async function getFeaturedMedicines(limit = 8): Promise<IMedicine[]> {
  return MedicineModel.find({ stockQuantity: { $gte: 50 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
