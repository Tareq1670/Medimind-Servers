import { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

export function getProfile(req: Request, res: Response): void {
  sendSuccess(res, {
    user: req.user ?? null,
    message: "Token is valid. This is a protected resource.",
  });
}
