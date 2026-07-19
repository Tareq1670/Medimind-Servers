import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";

export function getProfile(req: Request, res: Response): void {
  sendSuccess(res, {
    user: req.user ?? null,
    message: "Authenticated via Better Auth JWT verified by JWKS.",
  });
}

export async function register(_req: Request, res: Response): Promise<void> {
  sendError(
    res,
    "Registration is handled by Better Auth on the frontend. Send requests to GET/POST /api/auth/* on the frontend URL.",
    501
  );
}

export async function login(_req: Request, res: Response): Promise<void> {
  sendError(
    res,
    "Login is handled by Better Auth on the frontend. Send requests to GET/POST /api/auth/* on the frontend URL.",
    501
  );
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, null, "Logged out successfully. Clear client-side tokens.");
}
