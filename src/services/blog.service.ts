import { ObjectId } from "mongodb";
import { blogsCol, usersCol, toObjectId } from "../db/collections.js";
import type { IBlog, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  tag?: string;
  status?: "Draft" | "Published";
  authorId?: string;
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.search) {
    conditions.push(regexSearch(["title", "content"], opts.search));
  }
  if (opts.tag) {
    conditions.push({ tags: opts.tag });
  }
  if (opts.status) {
    conditions.push({ status: opts.status });
  }
  if (opts.authorId) {
    conditions.push({ authorId: toObjectId(opts.authorId) });
  }

  return andFilter(conditions);
}

async function attachAuthorInfo<T extends { authorId?: ObjectId | string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const authorIds = [...new Set(items.map((b) => b.authorId?.toString()))].filter(Boolean);
  const userDocs = await usersCol().find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email, avatar: u.avatar }]));
  return items.map((d) => ({
    ...d,
    author: d.authorId ? userMap.get(d.authorId.toString()) : undefined,
  }));
}

export async function getAllBlogs(opts: QueryOptions): Promise<PaginatedResult<IBlog>> {
  const filter = buildFilter(opts);
  const col = blogsCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);
  let data = await col.find(filter)
    .sort({ createdAt: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  data = await attachAuthorInfo(data);
  return { data, pagination };
}

export async function getBlogByIdInternal(id: string): Promise<IBlog | null> {
  return blogsCol().findOne({ _id: toObjectId(id) });
}

export async function getBlogById(id: string): Promise<IBlog | null> {
  const col = blogsCol();
  await col.updateOne({ _id: toObjectId(id) }, { $inc: { viewCount: 1 } });
  const doc = await col.findOne({ _id: toObjectId(id) });
  if (doc) {
    const attached = await attachAuthorInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function createBlog(data: Record<string, unknown>): Promise<IBlog> {
  const doc: IBlog = {
    title: data.title as string,
    content: data.content as string,
    authorId: typeof data.authorId === "string" ? toObjectId(data.authorId as string) : data.authorId as ObjectId,
    tags: (data.tags as string[]) || [],
    coverImage: data.coverImage as string | undefined,
    status: (data.status as IBlog["status"]) || "Draft",
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await blogsCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateBlog(id: string, data: Record<string, unknown>): Promise<IBlog | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  const doc = await blogsCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
  if (doc) {
    const attached = await attachAuthorInfo([doc]);
    return attached[0];
  }
  return null;
}

export async function deleteBlog(id: string): Promise<IBlog | null> {
  return blogsCol().findOneAndDelete({ _id: toObjectId(id) });
}
