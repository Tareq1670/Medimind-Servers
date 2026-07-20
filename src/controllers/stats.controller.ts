import { Request, Response } from "express";
import * as statsService from "../services/stats.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const requestedRole = (req.query.role as string) || req.user?.role || "admin";
    const userRole = req.user?.role;

    if (requestedRole === "admin" && userRole !== "admin") {
      sendError(res, "Forbidden: admin role required", 403);
      return;
    }

    if (requestedRole === "doctor" && userRole !== "doctor" && userRole !== "admin") {
      sendError(res, "Forbidden: doctor role required", 403);
      return;
    }

    if (requestedRole === "admin") {
      const stats = await statsService.getDashboardStats();
      sendSuccess(res, stats);
    } else if (requestedRole === "doctor") {
      const userId = req.user?.userId;
      if (!userId) { sendError(res, "Not authenticated", 401); return; }
      const stats = await statsService.getDoctorDashboardStats(userId);
      sendSuccess(res, stats);
    } else {
      const userId = req.user?.userId;
      if (!userId) { sendError(res, "Not authenticated", 401); return; }
      const stats = await statsService.getUserDashboardStats(userId);
      sendSuccess(res, stats);
    }
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch dashboard stats");
  }
}

export async function getAnalytics(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await statsService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch analytics");
  }
}
