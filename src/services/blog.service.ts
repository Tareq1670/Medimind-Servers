import { BlogModel, IBlog } from "../models/Blog.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  tag?: string;
  status?: "Draft" | "Published";
  authorId?: string;
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
        { content: { $regex: opts.search, $options: "i" } },
      ],
    });
  }

  if (opts.tag) {
    andConditions.push({ tags: opts.tag });
  }

  if (opts.status) {
    andConditions.push({ status: opts.status });
  }

  if (opts.authorId) {
    andConditions.push({ authorId: opts.authorId });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

export async function getAllBlogs(opts: QueryOptions): Promise<PaginatedResult<IBlog>> {
  const filter = buildFilter(opts);
  const total = await BlogModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const data = await BlogModel.find(filter)
    .populate("authorId", "name email avatar")
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

export async function getBlogByIdInternal(id: string): Promise<IBlog | null> {
  return BlogModel.findById(id).lean();
}

export async function getBlogById(id: string): Promise<IBlog | null> {
  const blog = await BlogModel.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate("authorId", "name email avatar")
    .lean();
  return blog;
}

export async function createBlog(data: Partial<IBlog>): Promise<IBlog> {
  return BlogModel.create(data);
}

export async function updateBlog(
  id: string,
  data: Partial<IBlog>
): Promise<IBlog | null> {
  return BlogModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate("authorId", "name email avatar")
    .lean();
}

export async function deleteBlog(id: string): Promise<IBlog | null> {
  return BlogModel.findByIdAndDelete(id).lean();
}
