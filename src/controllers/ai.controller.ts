import { Request, Response } from "express";
import * as aiService from "../services/ai.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { uploadToImageBB } from "../services/upload.service.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function analyzeSymptoms(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const analysis = await aiService.analyzeSymptoms(
      userId,
      req.body.reportedSymptoms
    );
    sendSuccess(res, analysis, "Symptom analysis complete", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to analyze symptoms");
  }
}

export async function analyzeReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    let uploadedImageUrl: string | undefined;

    if (req.file) {
      uploadedImageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    if (!uploadedImageUrl) {
      sendError(res, "Report image is required", 400);
      return;
    }

    const analysis = await aiService.analyzeReport(
      userId,
      req.body.reportType,
      uploadedImageUrl,
      req.body.additionalNotes
    );
    sendSuccess(res, analysis, "Report analysis complete", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to analyze report");
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const result = await aiService.getHistory(userId, req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch AI history");
  }
}
