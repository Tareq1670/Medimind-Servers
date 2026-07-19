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

    const { reportedSymptoms, duration, severity, additionalInfo } = req.body;

    const analysis = await aiService.analyzeSymptoms(
      userId,
      reportedSymptoms,
      duration,
      severity,
      additionalInfo
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

    const { reportType, reportName, additionalNotes } = req.body;

    const analysis = await aiService.analyzeReport(
      userId,
      reportType,
      uploadedImageUrl,
      reportName,
      additionalNotes
    );
    sendSuccess(res, analysis, "Report analysis complete", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to analyze report");
  }
}

export async function chatMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { message, sessionId } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamedContent = "";

    const { session, followUps } = await aiService.chatMessage(
      userId,
      message,
      sessionId,
      (chunk) => {
        streamedContent += chunk;
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ type: "done", sessionId: session._id.toString(), followUps })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Failed to process chat" })}\n\n`);
    res.end();
  }
}

export async function generateBlog(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { topic, audience, tone, length, keyPoints, includeSections } = req.body;

    const blog = await aiService.generateBlog(topic, audience, tone, length, keyPoints, includeSections);
    sendSuccess(res, blog, "Blog generated successfully", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate blog");
  }
}

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { symptoms, conditions, healthGoals } = req.body;

    const recommendations = await aiService.getRecommendations(userId, symptoms, conditions, healthGoals);
    sendSuccess(res, recommendations, "Recommendations generated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate recommendations");
  }
}

export async function getHealthInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const insights = await aiService.getHealthInsights(userId);
    sendSuccess(res, insights, "Health insights generated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate health insights");
  }
}

export async function classifyTags(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { title, description } = req.body;

    const tags = await aiService.classifyTags(title, description);
    sendSuccess(res, tags, "Tags generated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate tags");
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
