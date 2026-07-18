import { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

export function getProfile(req: Request, res: Response): void {
  sendSuccess(res, {
    user: req.user,
    message: "Authenticated via Better Auth JWT verified by JWKS.",
  });
}
