import { Request, Response } from "express";
import * as conditionService from "../services/healthCondition.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getAllConditions(req: Request, res: Response): Promise<void> {
  try {
    const result = await conditionService.getAllConditions(req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch conditions");
  }
}

export async function getConditionById(req: Request, res: Response): Promise<void> {
  try {
    const condition = await conditionService.getConditionById(req.params.id);
    if (!condition) {
      sendError(res, "Condition not found", 404);
      return;
    }
    sendSuccess(res, condition);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch condition");
  }
}

export async function createCondition(req: Request, res: Response): Promise<void> {
  try {
    const condition = await conditionService.createCondition(req.body);
    sendSuccess(res, condition, "Condition created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create condition");
  }
}

export async function updateCondition(req: Request, res: Response): Promise<void> {
  try {
    const condition = await conditionService.updateCondition(req.params.id, req.body);
    if (!condition) {
      sendError(res, "Condition not found", 404);
      return;
    }
    sendSuccess(res, condition, "Condition updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update condition");
  }
}

export async function deleteCondition(req: Request, res: Response): Promise<void> {
  try {
    const condition = await conditionService.deleteCondition(req.params.id);
    if (!condition) {
      sendError(res, "Condition not found", 404);
      return;
    }
    sendSuccess(res, null, "Condition deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete condition");
  }
}
