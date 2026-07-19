import { Request, Response } from "express";
import * as healthRecordService from "../services/healthRecord.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function getMyHealthRecord(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const record = await healthRecordService.getHealthRecordByPatientId(userId);
    if (!record) {
      sendError(res, "Health record not found", 404);
      return;
    }
    sendSuccess(res, record);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch health record");
  }
}

export async function getHealthRecordByPatientId(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    if (req.user?.role !== "admin" && req.user?.role !== "doctor" && req.params.patientId !== userId) {
      sendError(res, "Not authorized to view this record", 403);
      return;
    }
    const record = await healthRecordService.getHealthRecordByPatientId(req.params.patientId);
    if (!record) {
      sendError(res, "Health record not found", 404);
      return;
    }
    sendSuccess(res, record);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch health record");
  }
}

export async function createHealthRecord(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const existing = await healthRecordService.getHealthRecordByPatientId(userId);
    if (existing) {
      sendError(res, "Health record already exists. Use PUT to update.", 409);
      return;
    }
    const record = await healthRecordService.createHealthRecord({
      ...req.body,
      patientId: userId,
    });
    sendSuccess(res, record, "Health record created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create health record");
  }
}

export async function updateHealthRecord(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const existing = await healthRecordService.getHealthRecordByPatientId(userId);
    if (!existing) {
      sendError(res, "Health record not found. Use POST to create.", 404);
      return;
    }
    const record = await healthRecordService.updateHealthRecord(userId, req.body);
    sendSuccess(res, record, "Health record updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update health record");
  }
}

export async function deleteHealthRecord(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const record = await healthRecordService.getHealthRecordByPatientId(userId);
    if (!record) {
      sendError(res, "Health record not found", 404);
      return;
    }
    if (record.patientId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to delete this record", 403);
      return;
    }
    await healthRecordService.deleteHealthRecord(userId);
    sendSuccess(res, null, "Health record deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete health record");
  }
}
