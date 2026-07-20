import { ObjectId } from "mongodb";
import { chatSessionsCol, usersCol, toObjectId } from "../db/collections.js";
import type { IChatSession, ChatStatus, PaginatedResult } from "../types/models.js";
import { paginate } from "../utils/pagination.js";

interface QueryOptions {
  page: number;
  limit: number;
  status?: ChatStatus;
}

async function attachParticipants<T extends { participants?: (ObjectId | string)[] }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const ids = [...new Set(items.flatMap((s) => (s.participants || []).map((p) => p.toString())))].filter(Boolean);
  if (ids.length === 0) return items;
  const userDocs = await usersCol().find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email, avatar: u.avatar }]));
  return items.map((d) => ({
    ...d,
    participantUsers: (d.participants || []).map((p) => userMap.get(p.toString())),
  }));
}

async function attachMessageSenderInfo<T extends { messages?: { senderId?: ObjectId | string }[] }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const ids = [...new Set(items.flatMap((s) => (s.messages || []).map((m) => m.senderId?.toString()).filter(Boolean)))];
  if (ids.length === 0) return items;
  const userDocs = await usersCol().find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  const userMap = new Map(userDocs.map((u) => [u._id!.toString(), { name: u.name, email: u.email, avatar: u.avatar }]));
  return items.map((d) => ({
    ...d,
    messages: (d.messages || []).map((m) => ({
      ...m,
      sender: m.senderId ? userMap.get(m.senderId.toString()) : undefined,
    })),
  }));
}

export async function getAllSessions(userId: string, opts: QueryOptions): Promise<PaginatedResult<IChatSession>> {
  const filter: Record<string, unknown> = { participants: userId };
  if (opts.status) filter.status = opts.status;
  const col = chatSessionsCol();
  const total = await col.countDocuments(filter);
  const { pagination } = await paginate(total, opts);
  let data = await col.find(filter)
    .sort({ updatedAt: -1 })
    .skip((opts.page - 1) * opts.limit)
    .limit(opts.limit)
    .toArray();
  data = await attachParticipants(data);
  return { data, pagination };
}

export async function getSessionById(id: string): Promise<IChatSession | null> {
  let doc = await chatSessionsCol().findOne({ _id: toObjectId(id) });
  if (doc) {
    const attached = await attachParticipants([doc]);
    doc = attached[0];
    const withMessages = await attachMessageSenderInfo([doc]);
    return withMessages[0];
  }
  return null;
}

export async function createSession(data: Record<string, unknown>): Promise<IChatSession> {
  const doc: IChatSession = {
    participants: ((data.participants as string[]) || []).map((p) => toObjectId(p)),
    messages: [],
    status: "Active",
    sessionTitle: data.sessionTitle as string | undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await chatSessionsCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function addMessage(id: string, senderId: string, content: string): Promise<IChatSession | null> {
  const col = chatSessionsCol();
  await col.updateOne(
    { _id: toObjectId(id) },
    {
      $push: { messages: { senderId: toObjectId(senderId), content, timestamp: new Date() } },
      $set: { status: "Active" as ChatStatus, updatedAt: new Date() },
    }
  );
  return getSessionById(id);
}

export async function updateSessionStatus(id: string, status: ChatStatus): Promise<IChatSession | null> {
  return chatSessionsCol().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function deleteSession(id: string): Promise<IChatSession | null> {
  return chatSessionsCol().findOneAndDelete({ _id: toObjectId(id) });
}

export function isParticipant(session: IChatSession, userId: string): boolean {
  return session.participants.some((p) => p.toString() === userId);
}
