import { Request, Response } from "express";
import * as statsService from "../services/stats.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const stats = await statsService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch dashboard stats");
  }
}
