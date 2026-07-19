import { DoctorModel, IDoctor } from "../models/Doctor.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  specialty?: string;
  minFee?: number;
  maxFee?: number;
  verified?: string;
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
        { specialty: { $regex: opts.search, $options: "i" } },
        { bio: { $regex: opts.search, $options: "i" } },
        { hospitalAffiliation: { $regex: opts.search, $options: "i" } },
      ],
    });
  }

  if (opts.specialty) {
    andConditions.push({ specialty: opts.specialty });
  }

  if (opts.minFee !== undefined || opts.maxFee !== undefined) {
    const feeFilter: Record<string, unknown> = {};
    if (opts.minFee !== undefined) feeFilter.$gte = opts.minFee;
    if (opts.maxFee !== undefined) feeFilter.$lte = opts.maxFee;
    andConditions.push({ consultationFee: feeFilter });
  }

  if (opts.verified === "true") {
    andConditions.push({ isVerified: true });
  } else if (opts.verified === "false") {
    andConditions.push({ isVerified: false });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

export async function getAllDoctors(opts: QueryOptions): Promise<PaginatedResult<IDoctor>> {
  const filter = buildFilter(opts);
  const total = await DoctorModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const data = await DoctorModel.find(filter)
    .populate("userId", "name email avatar")
    .sort({ isVerified: -1, createdAt: -1 })
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

export async function getDoctorById(id: string): Promise<IDoctor | null> {
  return DoctorModel.findById(id).populate("userId", "name email avatar").lean();
}

export async function getDoctorByUserId(userId: string): Promise<IDoctor | null> {
  return DoctorModel.findOne({ userId }).populate("userId", "name email avatar").lean();
}

export async function createDoctor(data: Partial<IDoctor>): Promise<IDoctor> {
  return DoctorModel.create(data);
}

export async function updateDoctor(
  id: string,
  data: Partial<IDoctor>
): Promise<IDoctor | null> {
  return DoctorModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate("userId", "name email avatar")
    .lean();
}

export async function deleteDoctor(id: string): Promise<IDoctor | null> {
  return DoctorModel.findByIdAndDelete(id).lean();
}
