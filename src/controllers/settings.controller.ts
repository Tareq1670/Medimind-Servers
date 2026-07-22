import { Request, Response } from "express";
import * as settingsService from "../services/settings.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await settingsService.getSettings();
    sendSuccess(res, settings);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch settings");
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await settingsService.updateSettings(req.body);
    sendSuccess(res, settings, "Settings updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update settings");
  }
}
