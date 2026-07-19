import { ChatSessionModel, IChatSession, ChatStatus } from "../models/ChatSession.model.js";

interface QueryOptions {
  page: number;
  limit: number;
  status?: ChatStatus;
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
  if (opts.status) {
    filter.status = opts.status;
  }
  return filter;
}

export async function getAllSessions(
  userId: string,
  opts: QueryOptions
): Promise<PaginatedResult<IChatSession>> {
  const filter: Record<string, unknown> = {
    ...buildFilter(opts),
    participants: userId,
  };
  const total = await ChatSessionModel.countDocuments(filter);
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const data = await ChatSessionModel.find(filter)
    .populate("participants", "name email avatar")
    .sort({ updatedAt: -1 })
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

export async function getSessionById(id: string): Promise<IChatSession | null> {
  return ChatSessionModel.findById(id)
    .populate("participants", "name email avatar")
    .populate("messages.senderId", "name email avatar")
    .lean();
}

export async function createSession(data: Partial<IChatSession>): Promise<IChatSession> {
  return ChatSessionModel.create(data);
}

export async function addMessage(
  id: string,
  senderId: string,
  content: string
): Promise<IChatSession | null> {
  return ChatSessionModel.findByIdAndUpdate(
    id,
    {
      $push: { messages: { senderId, content, timestamp: new Date() } },
      $set: { status: "Active" as ChatStatus },
    },
    { new: true }
  )
    .populate("participants", "name email avatar")
    .populate("messages.senderId", "name email avatar")
    .lean();
}

export async function updateSessionStatus(
  id: string,
  status: ChatStatus
): Promise<IChatSession | null> {
  return ChatSessionModel.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  )
    .populate("participants", "name email avatar")
    .lean();
}

export async function deleteSession(id: string): Promise<IChatSession | null> {
  return ChatSessionModel.findByIdAndDelete(id).lean();
}

export function isParticipant(session: IChatSession, userId: string): boolean {
  return session.participants.some(
    (p) => p.toString() === userId
  );
}
