import { Request, Response } from "express";
import * as reportService from "../services/reportAnalysis.service.js";
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

export async function getAllReports(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const isAdmin = req.user?.role === "admin";
    const result = await reportService.getAllReports({
      ...(req.query as any),
      userId,
      isAdmin,
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch reports");
  }
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      sendError(res, "Report not found", 404);
      return;
    }
    if (report.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to view this report", 403);
      return;
    }
    sendSuccess(res, report);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch report");
  }
}

export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    let uploadedImageUrl: string | undefined;

    if (req.file) {
      uploadedImageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    const report = await reportService.createReport({
      ...req.body,
      patientId: userId,
      uploadedImageUrl,
    });
    sendSuccess(res, report, "Report created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create report");
  }
}

export async function updateReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      sendError(res, "Report not found", 404);
      return;
    }
    if (report.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to update this report", 403);
      return;
    }

    let uploadedImageUrl: string | undefined;
    if (req.file) {
      uploadedImageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    const updateData = req.file
      ? { ...req.body, uploadedImageUrl }
      : req.body;

    const updated = await reportService.updateReport(req.params.id, updateData);
    sendSuccess(res, updated, "Report updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update report");
  }
}

export async function deleteReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      sendError(res, "Report not found", 404);
      return;
    }
    if (report.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to delete this report", 403);
      return;
    }
    await reportService.deleteReport(req.params.id);
    sendSuccess(res, null, "Report deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete report");
  }
}
