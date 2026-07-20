import { conditionsCol, toObjectId } from "../db/collections.js";
import type { IHealthCondition, PaginatedResult } from "../types/models.js";
import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  search?: string;
  severity?: "Low" | "Medium" | "High";
}

function buildFilter(opts: QueryOptions): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (opts.search) {
    conditions.push(regexSearch(["title", "description", "symptoms"], opts.search));
  }
  if (opts.severity) {
    conditions.push({ severity: opts.severity });
  }

  return andFilter(conditions);
}

export async function getAllConditions(opts: QueryOptions): Promise<PaginatedResult<IHealthCondition>> {
  const filter = buildFilter(opts);
  const col = conditionsCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);
  const data = await col.find(filter)
    .sort({ severity: 1, title: 1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  return { data, pagination };
}

export async function getConditionById(id: string): Promise<IHealthCondition | null> {
  return conditionsCol().findOne({ _id: toObjectId(id) });
}

export async function createCondition(data: Record<string, unknown>): Promise<IHealthCondition> {
  const doc: IHealthCondition = {
    title: data.title as string,
    description: data.description as string,
    symptoms: (data.symptoms as string[]) || [],
    severity: data.severity as IHealthCondition["severity"],
    precautions: (data.precautions as string[]) || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await conditionsCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateCondition(id: string, data: Record<string, unknown>): Promise<IHealthCondition | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  return conditionsCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: "after" }
  );
}

export async function deleteCondition(id: string): Promise<IHealthCondition | null> {
  return conditionsCol().findOneAndDelete({ _id: toObjectId(id) });
}
