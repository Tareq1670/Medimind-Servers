import { Request, Response } from "express";
import * as chatService from "../services/chatSession.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function getAllSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const result = await chatService.getAllSessions(userId, req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch sessions");
  }
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const session = await chatService.getSessionById(req.params.id);
    if (!session) {
      sendError(res, "Session not found", 404);
      return;
    }
    if (!chatService.isParticipant(session, userId)) {
      sendError(res, "Not authorized to view this session", 403);
      return;
    }
    sendSuccess(res, session);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch session");
  }
}

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const participants = [...new Set([userId, ...req.body.participants])];
    const session = await chatService.createSession({ participants });
    sendSuccess(res, session, "Session created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create session");
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const session = await chatService.getSessionById(req.params.id);
    if (!session) {
      sendError(res, "Session not found", 404);
      return;
    }
    if (!chatService.isParticipant(session, userId)) {
      sendError(res, "Not authorized to message in this session", 403);
      return;
    }
    const updated = await chatService.addMessage(
      req.params.id,
      userId,
      req.body.content
    );
    sendSuccess(res, updated, "Message sent");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to send message");
  }
}

export async function updateSessionStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const session = await chatService.getSessionById(req.params.id);
    if (!session) {
      sendError(res, "Session not found", 404);
      return;
    }
    if (!chatService.isParticipant(session, userId)) {
      sendError(res, "Not authorized to update this session", 403);
      return;
    }
    const updated = await chatService.updateSessionStatus(req.params.id, req.body.status);
    sendSuccess(res, updated, "Session status updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update session");
  }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const session = await chatService.getSessionById(req.params.id);
    if (!session) {
      sendError(res, "Session not found", 404);
      return;
    }
    if (!chatService.isParticipant(session, userId)) {
      sendError(res, "Not authorized to delete this session", 403);
      return;
    }
    await chatService.deleteSession(req.params.id);
    sendSuccess(res, null, "Session deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete session");
  }
}
