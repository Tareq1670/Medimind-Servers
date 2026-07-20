import { Request, Response } from "express";
import * as doctorService from "../services/doctor.service.js";
import * as userService from "../services/user.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function getAllDoctors(req: Request, res: Response): Promise<void> {
  try {
    const result = await doctorService.getAllDoctors(req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch doctors");
  }
}

export async function getDoctorById(req: Request, res: Response): Promise<void> {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) {
      sendError(res, "Doctor not found", 404);
      return;
    }
    sendSuccess(res, doctor);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch doctor");
  }
}

export async function createDoctor(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const doctor = await doctorService.createDoctor({
      ...req.body,
      userId,
    });
    sendSuccess(res, doctor, "Doctor profile created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create doctor");
  }
}

export async function updateDoctor(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const existing = await doctorService.getDoctorById(req.params.id);
    if (!existing) {
      sendError(res, "Doctor not found", 404);
      return;
    }
    if (existing.userId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to update this doctor profile", 403);
      return;
    }
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);
    sendSuccess(res, doctor, "Doctor updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update doctor");
  }
}

export async function deleteDoctor(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const existing = await doctorService.getDoctorById(req.params.id);
    if (!existing) {
      sendError(res, "Doctor not found", 404);
      return;
    }
    if (existing.userId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to delete this doctor profile", 403);
      return;
    }
    const doctor = await doctorService.deleteDoctor(req.params.id);
    if (!doctor) {
      sendError(res, "Doctor not found", 404);
      return;
    }
    sendSuccess(res, null, "Doctor deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete doctor");
  }
}

export async function getMySchedule(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;
    const doctor = await doctorService.getDoctorByUserId(userId);
    if (!doctor) {
      sendError(res, "Doctor profile not found", 404);
      return;
    }
    sendSuccess(res, doctor.availabilitySlots || []);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch schedule");
  }
}

export async function updateMySchedule(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;
    const doctor = await doctorService.getDoctorByUserId(userId);
    if (!doctor) {
      sendError(res, "Doctor profile not found", 404);
      return;
    }
    const updated = await doctorService.updateDoctor(doctor._id!.toString(), {
      availabilitySlots: req.body.slots,
    });
    sendSuccess(res, updated?.availabilitySlots || [], "Schedule updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update schedule");
  }
}

export async function getMyPatients(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;
    const doctor = await doctorService.getDoctorByUserId(userId);
    if (!doctor) {
      sendError(res, "Doctor profile not found", 404);
      return;
    }
    const result = await userService.getPatientsForDoctor(doctor._id!.toString());
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch patients");
  }
}
