import { Response } from "express";
import { ApiResponse } from "../types/index.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): void {
  const body: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message = "Internal Server Error",
  statusCode = 500
): void {
  const body: ApiResponse = { success: false, message };
  res.status(statusCode).json(body);
}
