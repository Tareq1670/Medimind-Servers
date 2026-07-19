import { Request, Response } from "express";
import * as symptomService from "../services/symptomAnalysis.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function getAllAnalyses(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const isAdmin = req.user?.role === "admin";
    const result = await symptomService.getAllAnalyses({
      ...(req.query as any),
      userId,
      isAdmin,
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch analyses");
  }
}

export async function getAnalysisById(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const analysis = await symptomService.getAnalysisById(req.params.id);
    if (!analysis) {
      sendError(res, "Analysis not found", 404);
      return;
    }
    if (analysis.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to view this analysis", 403);
      return;
    }
    sendSuccess(res, analysis);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch analysis");
  }
}

export async function createAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const analysis = await symptomService.createAnalysis({
      ...req.body,
      patientId: userId,
    });
    sendSuccess(res, analysis, "Analysis created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create analysis");
  }
}

export async function updateAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const analysis = await symptomService.getAnalysisById(req.params.id);
    if (!analysis) {
      sendError(res, "Analysis not found", 404);
      return;
    }
    if (analysis.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to update this analysis", 403);
      return;
    }
    const updated = await symptomService.updateAnalysis(req.params.id, req.body);
    sendSuccess(res, updated, "Analysis updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update analysis");
  }
}

export async function deleteAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const analysis = await symptomService.getAnalysisById(req.params.id);
    if (!analysis) {
      sendError(res, "Analysis not found", 404);
      return;
    }
    if (analysis.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to delete this analysis", 403);
      return;
    }
    await symptomService.deleteAnalysis(req.params.id);
    sendSuccess(res, null, "Analysis deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete analysis");
  }
}
